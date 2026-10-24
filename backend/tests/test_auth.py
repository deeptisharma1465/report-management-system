
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_login_rejects_invalid_credentials() -> None:
    response = client.post(
        "/api/auth/login",
        json={
            "email": "not-a-real-user@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."
