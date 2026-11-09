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


def network_payload(kind='worker'):
    return {
        'kind': kind, 'name': 'Atlas deneme ustası', 'contact_name': 'Atlas test irtibat',
        'email': f'{kind}@example.invalid', 'city': 'Ankara',
        'specialty': 'TIG kaynak ve proses boru montajı',
        'details': 'Bu kayıt yalnızca laboratuvar koşullarında otomatik test amaçlıdır.',
        'consent': True, 'website': ''
    }


def test_worker_team_company_interest_private_and_persisted():
    from backend.app import RATELIMIT
    RATELIMIT.clear()  # Isolate this test from earlier intake requests.
    from backend.network import NetworkApplication
    from sqlalchemy.orm import Session
    for kind in ('worker', 'team', 'company'):
        r=client.post('/api/network-interest',json=network_payload(kind))
        assert r.status_code == 201, r.text
        assert r.json()['status']=='pending' and r.json()['reference']
        with Session(get_engine()) as db:
            item=db.get(NetworkApplication,r.json()['reference'])
            assert item and item.kind == kind and item.status=='pending'
            assert item.email == f'{kind}@example.invalid'
    assert client.get('/api/network-interest').status_code in (404,405)


def test_network_data_validation_and_private_project_board():
    from backend.network import ApprovedProjectListing
    from sqlalchemy.orm import Session
    q=network_payload();q['consent']=False
    assert client.post('/api/network-interest',json=q).status_code==422
    q=network_payload();q['kind']='admin'
    assert client.post('/api/network-interest',json=q).status_code==422
    q=network_payload();q['email']='not-valid'
    assert client.post('/api/network-interest',json=q).status_code==422
    q=network_payload();q['details']='short'
    assert client.post('/api/network-interest',json=q).status_code==422
    with Session(get_engine()) as db:
        db.add_all([
            ApprovedProjectListing(title='Onaysız / gizli proje', city='Ankara',trade='Kaynak',scope_summary='Bu ilan halka gösterilmemeli',public_visible=True,approval_status='draft'),
            ApprovedProjectListing(title='Demo / gerçek ilan değil', city='Ankara',trade='Kaynak',scope_summary='Bu ilan da halka gösterilmemeli',public_visible=True,approval_status='approved',is_demo=True),
            ApprovedProjectListing(title='Onaylı deneme proje', city='Konya',trade='Borulama',scope_summary='Uygunluk kontrolü tamamlanmış örnek.',public_visible=True,approval_status='approved',is_demo=False),
        ])
        db.commit()
    r=client.get('/api/projects')
    assert r.status_code==200 and len(r.json()['projects'])==1
    assert r.json()['projects'][0]['title']=='Onaylı deneme proje'
    assert 'email' not in r.json()['projects'][0]


def test_new_pages_exist_and_safe_frontend_rendering():
    from pathlib import Path
    root=Path(__file__).resolve().parents[1]
    for route in ['/usta','/firma','/ekip','/projeler']:
        r=client.get(route)
        assert r.status_code==200
        assert 'id="network-form"' in r.text
    js=(root/'frontend/assets/app.js').read_text()
    assert 'textContent = project.title' in js
    assert 'innerHTML' not in js
