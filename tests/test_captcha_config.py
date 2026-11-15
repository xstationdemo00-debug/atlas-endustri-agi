from fastapi.testclient import TestClient
from backend.app import app
client=TestClient(app)
def test_independent_captcha_config_never_claims_unconfigured_turnstile():
    r=client.get('/api/captcha-config',headers={'Origin':'https://atlas-endustri-orijinal-arayuz.onrender.com'})
    assert r.status_code == 200
    assert r.json()['enabled'] is False
    assert r.json()['site_key'] is None
    assert r.headers.get('access-control-allow-origin') == 'https://atlas-endustri-orijinal-arayuz.onrender.com'
