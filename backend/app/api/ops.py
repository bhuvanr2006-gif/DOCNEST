from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import AuditLog, Notification, Reminder, User
from app.schemas import AuditOut, NotificationOut, ReminderOut
from app.services.access import require_membership, require_role

router = APIRouter(prefix="/api", tags=["operations"])


@router.get("/reminders", response_model=list[ReminderOut])
def reminders(household_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_membership(db, user, household_id)
    rows = (
        db.query(Reminder)
        .filter(Reminder.household_id == household_id, Reminder.user_id == user.id)
        .order_by(Reminder.target_date.asc())
        .all()
    )
    return rows


@router.get("/notifications", response_model=list[NotificationOut])
def notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.post("/notifications/{notification_id}/read")
def mark_read(notification_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(Notification, notification_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found.")
    item.is_read = True
    db.commit()
    return {"ok": True}


@router.get("/audit", response_model=list[AuditOut])
def audit_logs(household_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = require_membership(db, user, household_id)
    require_role(member, {"owner"})
    return (
        db.query(AuditLog)
        .filter(AuditLog.household_id == household_id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )


@router.get("/security/status")
def security_status(user: User = Depends(get_current_user)):
    settings = get_settings()
    mode = "blockchain" if settings.blockchain_enabled and settings.integrity_mode == "blockchain" else "database"
    return {
        "integrity_mode": mode,
        "blockchain_enabled": settings.blockchain_enabled,
        "email_notifications_enabled": settings.email_notifications_enabled,
        "encryption": "AES-256-GCM",
        "hashing": "SHA-256",
        "key_management": "Per-document DEK wrapped with DOCNEST_MASTER_KEY; keys stored in a dedicated table, not beside ciphertext files.",
    }
