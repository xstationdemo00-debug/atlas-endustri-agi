"""Independent Atlas first B2B pilot: public pages, private database writes."""
import os
import re
import time
import hashlib
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from .database import healthcheck_db, save_inquiry
from .network import create_network_application, list_approved_projects

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "dist"
app = FastAPI(title="Atlas Endüstri Ağı — bağımsız pilot", docs_url=None, redoc_url=None)

ALLOWED_NETWORK_KINDS = {"worker", "team", "company"}
ALLOWED_TYPES = {"supplier_research", "subcontractor_research", "technical_review"}
RE_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
RATELIMIT = {}  # Additional external protection is required on multi-instance deployment.

class InquiryInput(BaseModel):
    company_name: str = Field(min_length=2, max_length=180)
    contact_name: str = Field(min_length=2, max_length=140)
    contact_email: str = Field(min_length=5, max_length=254)
    city: str = Field(default="", max_length=120)
    service_type: str
    description: str = Field(min_length=20, max_length=3000)
    consent: bool
    website: str = Field(default="", max_length=150)  # Honeypot: should stay empty.



class NetworkInterestInput(BaseModel):
    kind: str
    name: str = Field(min_length=2, max_length=180)
    contact_name: str = Field(min_length=2, max_length=140)
    email: str = Field(min_length=5, max_length=254)
    city: str = Field(min_length=2, max_length=120)
    specialty: str = Field(min_length=2, max_length=140)
    details: str = Field(min_length=20, max_length=1500)
    consent: bool
    website: str = Field(default="", max_length=150)


def _allow_submit(request: Request):
    # In-memory per-instance throttle plus honeypot. External WAF still recommended.
    ip = request.client.host if request.client else "unknown"
    key = hashlib.sha256((ip + os.environ.get("ATLAS_RATE_SALT", "local")).encode()).hexdigest()
    now = time.monotonic()
    previous = [stamp for stamp in RATELIMIT.get(key, []) if now - stamp < 600]
    if len(previous) >= 3:
        raise HTTPException(status_code=429, detail="Çok sık deneme. Bir süre sonra tekrar deneyin.")
    return key, now, previous


@app.post("/api/network-interest", status_code=201)
def network_interest(body: NetworkInterestInput, request: Request):
    if body.website.strip():
        return {"received": True, "reference": ""}
    if body.kind not in ALLOWED_NETWORK_KINDS:
        raise HTTPException(status_code=422, detail="Geçersiz kayıt türü.")
    if not body.consent:
        raise HTTPException(status_code=422, detail="Bilgilendirme onayı gerekli.")
    if not RE_EMAIL.match(body.email.strip()):
        raise HTTPException(status_code=422, detail="Geçerli e-posta adresi girin.")
    key, now, previous = _allow_submit(request)
    try:
        reference = create_network_application({
            "kind": body.kind,
            "name": body.name.strip(),
            "contact_name": body.contact_name.strip(),
            "email": body.email.strip().lower(),
            "city": body.city.strip(),
            "specialty": body.specialty.strip(),
            "details": body.details.strip(),
            "consent_confirmed": True,
            "status": "pending",
        })
    except (SQLAlchemyError, RuntimeError):
        raise HTTPException(status_code=503, detail="Ön kayıt şu anda kaydedilemiyor. Daha sonra tekrar deneyin.")
    previous.append(now)
    RATELIMIT[key] = previous
    return {"received": True, "reference": reference, "status": "pending"}


@app.get("/api/projects")
def approved_public_projects():
    try:
        return {"projects": list_approved_projects()}
    except (SQLAlchemyError, RuntimeError):
        raise HTTPException(status_code=503, detail="Onaylı projeler şu anda görüntülenemiyor.")

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'"
    response.headers["Cache-Control"] = "no-store" if request.url.path.startswith("/api/") else "public, max-age=180"
    return response

@app.get("/api/health")
def health():
    try: db_ok = healthcheck_db()
    except Exception: db_ok = False
    return {"status": "ok", "database": "ready" if db_ok else "not_configured_or_unreachable", "provider": "independent"}

@app.get("/api/services")
def services():
    return {"services": [
        {"id":"supplier_research","name":"Tedarikçi ön araştırması"},
        {"id":"subcontractor_research","name":"Fason üretici / alt yüklenici ön araştırması"},
        {"id":"technical_review","name":"Teknik kapsam ön değerlendirme"}
    ], "worker_fee": 0, "pilot_price_try": 2900,
    "price_notice": "Tanıtım başlangıç bedelidir. Yasal/faturalama hazırlığı tamamlanmadan ücretli sipariş alınmaz."}

@app.post("/api/inquiries",status_code=201)
def create_inquiry(body: InquiryInput, request: Request):
    if body.website.strip():  # no record created, avoid indicating anti-spam mechanism
        return {"received": True, "reference": ""}
    if not body.consent:
        raise HTTPException(status_code=422, detail="Bilgilendirme onayı gerekli.")
    if body.service_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail="Geçersiz hizmet türü.")
    if not RE_EMAIL.match(body.contact_email.strip()):
        raise HTTPException(status_code=422, detail="Geçerli e-posta adresi girin.")
    # Never trust user-supplied forwarding headers without configured proxy trust.
    ip = request.client.host if request.client else "unknown"
    key = hashlib.sha256((ip + os.environ.get("ATLAS_RATE_SALT","local")).encode()).hexdigest()
    now = time.monotonic()
    prior = [stamp for stamp in RATELIMIT.get(key,[]) if now - stamp < 600]
    if len(prior) >= 3:
        raise HTTPException(status_code=429, detail="Çok sık deneme. Bir süre sonra tekrar deneyin.")
    try:
        record_id = save_inquiry({
            "company_name":body.company_name.strip(),"contact_name":body.contact_name.strip(),
            "contact_email":body.contact_email.strip().lower(),"city":body.city.strip(),
            "service_type":body.service_type,"description":body.description.strip(),
            "consent_confirmed":True
        })
    except (SQLAlchemyError,RuntimeError):
        raise HTTPException(status_code=503, detail="Talep şu anda kaydedilemiyor. Daha sonra tekrar deneyin.")
    prior.append(now);RATELIMIT[key] = prior
    return {"received":True,"reference":record_id}

@app.get("/assets/{asset_path:path}")
def assets(asset_path: str):
    safe = (FRONTEND / "assets" / asset_path).resolve()
    if not safe.is_relative_to((FRONTEND / "assets").resolve()) or not safe.is_file():
        raise HTTPException(status_code=404,detail="Bulunamadı")
    return FileResponse(safe)

@app.get("/{page_path:path}")
def page(page_path: str):
    if page_path in {"", "ilk-hizmet", "hizmetler", "gizlilik", "nasil-calisir", "usta", "firma", "ekip", "projeler"}:
        path = FRONTEND / "index.html"
        if path.is_file():return FileResponse(path)
    raise HTTPException(status_code=404,detail="Sayfa bulunamadı")
