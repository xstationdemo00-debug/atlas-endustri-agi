import os
import sys
from pathlib import Path
from uuid import uuid4
os.environ['ATLAS_DEV_SQLITE']='1'
os.environ['ATLAS_DEV_SQLITE_PATH']='/tmp/atlas_endustri_test_'+uuid4().hex+'.sqlite3'
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from backend.app import app
from backend.database import get_engine
from sqlalchemy import text

client=TestClient(app)

def test_public_routes_and_health():
    for route in ['/','/ilk-hizmet','/hizmetler','/nasil-calisir','/gizlilik']:
        response=client.get(route)
        assert response.status_code==200, route
        assert 'ENDÜSTRİ AĞI' in response.text
    r=client.get('/api/health'); assert r.status_code==200 and r.json()['database']=='ready'
    assert client.get('/api/services').json()['worker_fee']==0

def valid_payload():
    return {'company_name':'Test sanayi firması','contact_name':'Test kullanıcısı', 'contact_email':'pilot@example.com', 'city':'Ankara', 'service_type':'supplier_research', 'description':'Paslanmaz çelik kaynak ve fason imalat için tedarikçi ön araştırması.', 'consent':True, 'website':''}

def test_inquiry_is_persisted():
    response=client.post('/api/inquiries',json=valid_payload()); assert response.status_code==201,response.text
    payload=response.json(); assert payload['received'] and payload['reference']
    with get_engine().connect() as db:
        count=db.execute(text('SELECT COUNT(*) FROM service_inquiries')).scalar_one()
    assert count >= 1

def test_inquiry_validation():
    q=valid_payload();q['consent']=False
    assert client.post('/api/inquiries',json=q).status_code==422
    q=valid_payload();q['service_type']='paid_worker_matching'
    assert client.post('/api/inquiries',json=q).status_code==422
    q=valid_payload();q['contact_email']='bad-address'
    assert client.post('/api/inquiries',json=q).status_code==422


def test_no_directory_traversal_or_public_admin_listing():
    assert client.get('/.env').status_code==404
    assert client.get('/api/inquiries').status_code in (404,405)


def test_storage_failure_returns_503(monkeypatch):
    import backend.app as app_module
    def fail_write(_data):
        raise RuntimeError("Database unavailable")
    monkeypatch.setattr(app_module, "save_inquiry", fail_write)
    response = client.post('/api/inquiries', json=valid_payload())
    assert response.status_code == 503
    assert 'kaydedilemiyor' in response.json()['detail']

def test_frontend_does_not_claim_success_without_reference():
    frontend_js = (Path(__file__).resolve().parents[1] / 'frontend/assets/app.js').read_text()
    assert 'json.received && json.reference' in frontend_js
    assert 'checkInquiryAvailability' in frontend_js
