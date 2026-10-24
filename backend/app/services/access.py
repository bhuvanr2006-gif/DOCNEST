from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Document, Membership, SharingGrant, User


ROLE_RANK = {"guest": 1, "dependent": 2, "adult": 3, "owner": 4}


def membership_for(db: Session, user: User, household_id: str) -> Membership | None:
    return (
        db.query(Membership)
        .filter(
            Membership.user_id == user.id,
            Membership.household_id == household_id,
            Membership.status == "active",
        )
        .first()
    )


def require_membership(db: Session, user: User, household_id: str) -> Membership:
    member = membership_for(db, user, household_id)
    if not member:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this household.")
    return member


def require_role(member: Membership, allowed: set[str]) -> None:
    if member.role not in allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient role for this action.")


def _grant_active(grant: SharingGrant) -> bool:
    now = datetime.utcnow()
    if grant.revoked_at:
        return False
    if grant.starts_at and grant.starts_at > now:
        return False
    if grant.expires_at and grant.expires_at <= now:
        return False
    return True


def active_grant(db: Session, document_id: str, user_id: str) -> SharingGrant | None:
    grants = (
        db.query(SharingGrant)
        .filter(SharingGrant.document_id == document_id, SharingGrant.grantee_id == user_id)
        .all()
    )
    for grant in grants:
        if _grant_active(grant):
            return grant
    return None


def can_read_document(db: Session, user: User, document: Document) -> tuple[bool, str]:
    if document.deleted_at:
        return False, "deleted"
    member = membership_for(db, user, document.household_id)
    if member:
        if member.role == "owner":
            return True, "owner"
        if member.role == "adult":
            return True, "adult"
        if member.role == "dependent":
            if document.owner_user_id == user.id:
                return True, "owner"
            grant = active_grant(db, document.id, user.id)
            return (True, "grant") if grant else (False, "restricted")
        if member.role == "guest":
            grant = active_grant(db, document.id, user.id)
            return (True, "grant") if grant else (False, "guest")
    grant = active_grant(db, document.id, user.id)
    if grant:
        return True, "grant"
    return False, "denied"


def can_download_document(db: Session, user: User, document: Document) -> bool:
    allowed, reason = can_read_document(db, user, document)
    if not allowed:
        return False
    if reason in {"owner", "adult"}:
        return True
    grant = active_grant(db, document.id, user.id)
    return bool(grant and grant.permission == "download")


def can_modify_document(db: Session, user: User, document: Document) -> bool:
    member = membership_for(db, user, document.household_id)
    if not member or document.deleted_at:
        return False
    if member.role == "owner":
        return True
    if member.role == "adult" and document.owner_user_id == user.id:
        return True
    if member.role == "dependent" and document.owner_user_id == user.id:
        return True
    return False


def require_document_read(db: Session, user: User, document: Document) -> None:
    allowed, _ = can_read_document(db, user, document)
    if not allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not authorized to access this document.")


def require_document_modify(db: Session, user: User, document: Document) -> None:
    if not can_modify_document(db, user, document):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not authorized to modify this document.")
