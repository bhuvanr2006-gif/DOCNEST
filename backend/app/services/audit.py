from sqlalchemy.orm import Session

from app.models import AuditLog


def log_event(
    db: Session,
    *,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    actor_id: str | None = None,
    household_id: str | None = None,
    details: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        actor_id=actor_id,
        household_id=household_id,
        details=details,
    )
    db.add(entry)
    db.flush()
    return entry
