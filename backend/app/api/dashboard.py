from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Asset, AuditLog, Document, SharingGrant, User
from app.schemas import AuditOut, DashboardOut, DocumentOut, GrantOut
from app.services.access import can_read_document, require_membership
from app.services.reminders import expiry_status

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _doc_out(doc: Document) -> DocumentOut:
    item = DocumentOut.model_validate(doc)
    item.expiry_status = expiry_status(doc.expiry_date)
    item.fields = []
    return item


@router.get("", response_model=DashboardOut)
def dashboard(household_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_membership(db, user, household_id)
    docs = (
        db.query(Document)
        .filter(Document.household_id == household_id, Document.deleted_at.is_(None))
        .all()
    )
    visible = [d for d in docs if can_read_document(db, user, d)[0]]
    by_category: dict[str, int] = {}
    for doc in visible:
        by_category[doc.category] = by_category.get(doc.category, 0) + 1
    today = date.today()
    upcoming = [d for d in visible if d.expiry_date and today <= d.expiry_date <= today + timedelta(days=30)]
    expired = [d for d in visible if d.expiry_date and d.expiry_date < today]
    recent = sorted(visible, key=lambda d: d.created_at, reverse=True)[:6]
    assets_count = db.query(Asset).filter(Asset.household_id == household_id).count()
    shares = (
        db.query(SharingGrant)
        .filter(SharingGrant.household_id == household_id)
        .order_by(SharingGrant.created_at.desc())
        .limit(6)
        .all()
    )
    audit = (
        db.query(AuditLog)
        .filter(AuditLog.household_id == household_id)
        .order_by(AuditLog.created_at.desc())
        .limit(8)
        .all()
    )
    share_out = []
    for grant in shares:
        item = GrantOut.model_validate(grant)
        doc = db.get(Document, grant.document_id)
        grantee = db.get(User, grant.grantee_id)
        item.document_title = doc.title if doc else None
        item.grantee_email = grantee.email if grantee else None
        share_out.append(item)
    return DashboardOut(
        total_documents=len(visible),
        by_category=by_category,
        recent_documents=[_doc_out(d) for d in recent],
        upcoming_expirations=[_doc_out(d) for d in upcoming[:6]],
        expired_documents=[_doc_out(d) for d in expired[:6]],
        assets_count=assets_count,
        recent_shares=share_out,
        recent_audit=[AuditOut.model_validate(a) for a in audit],
    )
