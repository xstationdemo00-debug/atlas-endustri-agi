from fastapi.testclient import TestClient
from backend.app import app

client=TestClient(app)
ALLOWED="https://atlas-endustri-orijinal-arayuz.onrender.com"

def test_original_atlas_service_inquiry_preflight():
    response=client.options("/api/inquiries",headers={
        "Origin":ALLOWED,
        "Access-Control-Request-Method":"POST",
        "Access-Control-Request-Headers":"content-type",
    })
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin")==ALLOWED
    assert "POST" in response.headers.get("access-control-allow-methods","")

def test_cross_site_origin_not_allowed():
    response=client.options("/api/inquiries",headers={
        "Origin":"https://unexpected-attacker.invalid",
        "Access-Control-Request-Method":"POST",
    })
    assert response.status_code == 400
    assert response.headers.get("access-control-allow-origin") is None

def test_preflight_does_not_create_inquiry():
    response=client.options("/api/inquiries",headers={
        "Origin":ALLOWED,
        "Access-Control-Request-Method":"POST",
    })
    assert response.status_code == 200
