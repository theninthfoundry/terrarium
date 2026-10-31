from fastapi.testclient import TestClient
from terrarium.api import app

client = TestClient(app)


def test_public_demo_excludes_other_repositories():
    response = client.post('/api/analyze', json={'repository_path': '../', 'changed_files': ['src/pricing.py']})
    assert response.status_code == 403


def test_public_demo_disallows_expensive_mutations():
    response = client.post('/api/analyze', json={'max_mutations': 20})
    assert response.status_code == 400


def test_invalid_input_is_rejected():
    response = client.post('/api/analyze', json={'max_mutations': 0})
    assert response.status_code == 422


def test_health_discloses_demo_mode_not_secrets():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert 'mode' in response.json()
    assert 'GEMMA_API_KEY' not in response.text
