
from fastapi.testclient import TestClient

from app.main import app


def test_health_route_exists():
    with TestClient(app) as client:
        response = client.get("/openapi.json")

    assert response.status_code == 200

    paths = response.json()["paths"]

    assert "/api/v1/health" in paths
    assert "/api/v1/repositories/{repository_id}/index" in paths
    assert "/api/v1/repositories/{repository_id}/index-status" in paths
