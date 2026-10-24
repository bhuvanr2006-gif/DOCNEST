from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import ConsentRecord, Document, SharingGrant, User
from app.schemas import ConsentOut, GrantOut, ShareIn
from app.services.access import require_document_modify, require_membership, require_role
from app.services.audit import log_event

router = APIRouter(prefix="/api", tags=["sharing"])


def _grant_out(db: Session, grant: SharingGrant) -> GrantOut:
    item = GrantOut.model_validate(grant)
    doc = db.get(Document, grant.document_id)
    grantee = db.get(User, grant.grantee_id)
    item.document_title = doc.title if doc else None
    item.grantee_email = grantee.email if grantee else None
    return item


@router.post("/documents/{document_id}/share", response_model=GrantOut, status_code=201)
def share_document(
    document_id: str,
    payload: ShareIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.get(Document, document_id)
    if not doc or doc.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    require_document_modify(db, user, doc)
    grantee = db.query(User).filter(User.email == payload.grantee_email.lower()).first()
    if not grantee:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recipient account was not found.")
    consent = ConsentRecord(
        household_id=doc.household_id,
        document_id=doc.id,
        grantor_id=user.id,
        grantee_id=grantee.id,
        scope=payload.scope,
        permission=payload.permission,
        expires_at=payload.expires_at,
    )
    db.add(consent)
    db.flush()
    grant = SharingGrant(
        document_id=doc.id,
        household_id=doc.household_id,
        grantor_id=user.id,
        grantee_id=grantee.id,
        permission=payload.permission,
        expires_at=payload.expires_at,
        consent_id=consent.id,
    )
    db.add(grant)
    log_event(
        db,
        action="share.grant",
        resource_type="document",
        resource_id=doc.id,
        actor_id=user.id,
        household_id=doc.household_id,
        details=payload.permission,
    )
    db.commit()
    db.refresh(grant)
    return _grant_out(db, grant)


@router.post("/shares/{grant_id}/revoke", response_model=GrantOut)
def revoke_grant(grant_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    grant = db.get(SharingGrant, grant_id)
    if not grant:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Grant not found.")
    member = require_membership(db, user, grant.household_id)
    if member.role != "owner" and grant.grantor_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the grantor or household owner can revoke this grant.")
    grant.revoked_at = datetime.utcnow()
    if grant.consent_id:
        consent = db.get(ConsentRecord, grant.consent_id)
        if consent:
            consent.revoked_at = grant.revoked_at
    log_event(
        db,
        action="share.revoke",
        resource_type="grant",
        resource_id=grant.id,
        actor_id=user.id,
        household_id=grant.household_id,
    )
    db.commit()
    db.refresh(grant)
    return _grant_out(db, grant)


@router.get("/shares", response_model=list[GrantOut])
def list_grants(household_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = require_membership(db, user, household_id)
    query = db.query(SharingGrant).filter(SharingGrant.household_id == household_id)
    if member.role not in {"owner", "adult"}:
        query = query.filter(SharingGrant.grantee_id == user.id)
    grants = query.order_by(SharingGrant.created_at.desc()).all()
    return [_grant_out(db, g) for g in grants]


@router.get("/consent", response_model=list[ConsentOut])
def list_consent(household_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = require_membership(db, user, household_id)
    query = db.query(ConsentRecord).filter(ConsentRecord.household_id == household_id)
    if member.role != "owner":
        query = query.filter(
            (ConsentRecord.grantor_id == user.id) | (ConsentRecord.grantee_id == user.id)
        )
    return query.order_by(ConsentRecord.created_at.desc()).all()
