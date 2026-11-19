
from datetime import date

from fastapi.testclient import TestClient

from app.main import app
from app.api.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models import Agency, Report, User
from sqlalchemy import select
from app.api.routes.reports import list_reports

client = TestClient(app)


def test_admin_endpoint_rejects_non_admin_user() -> None:
    normal_user = User(
        id=1,
        name="Test User",
        email="testuser@example.com",
        hashed_password="not-used",
        role="user",
        is_active=True,
        agency_id=1,
    )

    app.dependency_overrides[get_current_user] = lambda: normal_user

    try:
        response = client.get("/api/audit-logs")
        assert response.status_code == 403
        assert response.json()["detail"] == "Admin access required."
    finally:
        app.dependency_overrides.clear()


def test_user_cannot_view_report_uploaded_by_another_user() -> None:
    normal_user = User(
        id=1,
        name="Test User",
        email="testuser@example.com",
        hashed_password="not-used",
        role="user",
        is_active=True,
        agency_id=None,
    )

    private_report = Report(
        id=999,
        title="Private Test Report",
        description="Test only",
        report_type="Testing",
        report_date=date(2026, 10, 23),
        agency_id=2,
        uploaded_by=2,
        is_deleted=False,
    )

    class FakeDB:
        def get(self, model, record_id):
            if model is Report and record_id == 999:
                return private_report
            return None

    app.dependency_overrides[get_current_user] = lambda: normal_user
    app.dependency_overrides[get_db] = lambda: FakeDB()

    try:
        response = client.get("/api/reports/999")
        assert response.status_code == 403
        assert response.json()["detail"] == (
            "You do not have access to this report."
        )
    finally:
        app.dependency_overrides.clear()


def test_list_reports_filters_by_uploader() -> None:
    normal_user = User(
        id=1,
        name="Test User",
        email="testuser@example.com",
        hashed_password="not-used",
        role="user",
        is_active=True,
        agency_id=None,
    )

    class FakeScalars:
        def all(self):
            return [
                Report(
                    id=101,
                    title="Agency One Report",
                    report_type="Testing",
                    report_date=date(2026, 10, 23),
                    agency_id=1,
                    uploaded_by=1,
                    is_deleted=False,
                )
            ]

    class FakeDB:
        def scalars(self, query):
            sql = str(query)
            assert "reports.uploaded_by" in sql
            assert "reports.is_deleted" in sql
            return FakeScalars()

    result = list_reports(current_user=normal_user, db=FakeDB())

    assert len(result) == 1
    assert result[0].agency_id == 1
    assert result[0].title == "Agency One Report"


def test_authenticated_user_can_list_agencies() -> None:
    normal_user = User(
        id=1,
        name="Test User",
        email="testuser@example.com",
        hashed_password="not-used",
        role="user",
        is_active=True,
        agency_id=None,
    )
    agency = Agency(id=3, name="Test Agency", description=None)

    class FakeScalars:
        def all(self):
            return [agency]

    class FakeDB:
        def scalars(self, query):
            return FakeScalars()

    app.dependency_overrides[get_current_user] = lambda: normal_user
    app.dependency_overrides[get_db] = lambda: FakeDB()

    try:
        response = client.get("/api/agencies")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == [
        {"id": 3, "name": "Test Agency", "description": None}
    ]


def test_list_reports_excludes_deleted_reports() -> None:
    normal_user = User(
        id=1,
        name="Test User",
        email="testuser@example.com",
        hashed_password="not-used",
        role="user",
        is_active=True,
        agency_id=1,
    )

    class FakeScalars:
        def all(self):
            return []

    class FakeDB:
        def scalars(self, query):
            sql = str(query)
            assert "reports.is_deleted" in sql
            return FakeScalars()

    result = list_reports(current_user=normal_user, db=FakeDB())

    assert result == []


def test_admin_can_list_audit_logs() -> None:
    from app.api.dependencies import require_admin
    from app.models import AuditLog
    from app.api.routes.audit_logs import list_audit_logs

    admin_user = User(
        id=2,
        name="Admin",
        email="admin-test@example.com",
        hashed_password="not-used",
        role="admin",
        is_active=True,
        agency_id=None,
    )

    expected_log = AuditLog(
        id=10,
        action="report_created",
        entity_type="report",
        entity_id=101,
        user_id=2,
        details={"title": "Test Report"},
    )

    class FakeScalars:
        def all(self):
            return [expected_log]

    class FakeDB:
        def scalars(self, query):
            return FakeScalars()

    result = list_audit_logs(
        current_user=admin_user,
        db=FakeDB(),
        limit=20,
        offset=0,
    )

    assert len(result) == 1
    assert result[0].action == "report_created"
    assert result[0].entity_id == 101


def test_report_version_listing_requires_admin() -> None:
    normal_user = User(
        id=1,
        name="Test User",
        email="testuser@example.com",
        hashed_password="not-used",
        role="user",
        is_active=True,
        agency_id=1,
    )

    app.dependency_overrides[get_current_user] = lambda: normal_user

    try:
        response = client.get("/api/reports/2/versions")
        assert response.status_code == 403
        assert response.json()["detail"] == "Admin access required."
    finally:
        app.dependency_overrides.clear()
