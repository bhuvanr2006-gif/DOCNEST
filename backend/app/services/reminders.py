from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Document, Notification, Reminder
from app.services.audit import log_event

WINDOWS = (30, 7, 1)


def expiry_status(expiry: date | None, today: date | None = None) -> str:
    if expiry is None:
        return "none"
    today = today or date.today()
    if expiry < today:
        return "expired"
    if expiry <= today + timedelta(days=30):
        return "expiring"
    return "valid"


def sync_document_reminders(db: Session, document: Document) -> None:
    if not document.expiry_date or document.deleted_at:
        return
    today = date.today()
    for window in WINDOWS:
        target = document.expiry_date
        trigger_on = target - timedelta(days=window)
        existing = (
            db.query(Reminder)
            .filter(
                Reminder.document_id == document.id,
                Reminder.window_days == window,
                Reminder.target_date == target,
            )
            .first()
        )
        if existing:
            if target < today:
                existing.status = "expired"
            continue
        status = "expired" if target < today else "active"
        reminder = Reminder(
            household_id=document.household_id,
            user_id=document.owner_user_id,
            document_id=document.id,
            title=f"{document.title} expires in {window} day(s)",
            window_days=window,
            target_date=target,
            status=status,
            notified_at=datetime.utcnow() if trigger_on <= today <= target else None,
        )
        db.add(reminder)
        if trigger_on <= today <= target:
            db.add(
                Notification(
                    user_id=document.owner_user_id,
                    household_id=document.household_id,
                    title="Document expiry reminder",
                    body=f"{document.title} reaches its expiry date on {target.isoformat()}.",
                )
            )
            log_event(
                db,
                action="reminder.created",
                resource_type="document",
                resource_id=document.id,
                actor_id=document.owner_user_id,
                household_id=document.household_id,
                details=f"window={window}",
            )
