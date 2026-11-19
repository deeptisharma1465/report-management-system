
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db

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


def test_registration_creates_user_without_agency() -> None:
    class FakeDB:
        user = None

        def scalar(self, query):
            return None

        def add(self, user) -> None:
            self.user = user

        def commit(self) -> None:
            self.user.id = 1

        def refresh(self, user) -> None:
            pass

    app.dependency_overrides[get_db] = lambda: FakeDB()

    try:
        response = client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "email": "new-user@example.com",
                "password": "StrongPassword123!",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["agency_id"] is None
