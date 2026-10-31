from fastapi.testclient import TestClient

from terrarium.api import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_public_api_rejects_arbitrary_workspace():
    response = client.post("/api/analyze", json={"repository_path": "../", "changed_files": ["x.py"]})
    assert response.status_code in {400, 403}
