from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog


def record_audit(
    db: Session,
    *,
    action: str,
    entity_type: str,
    entity_id: int | None,
    user_id: int | None,
    details: dict[str, Any] | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        details=details,
    )

    db.add(audit_log)
    return audit_log