import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Household, Invitation, Membership, User
from app.schemas import HouseholdOut, InviteAcceptIn, InviteIn, MembershipOut, RoleUpdateIn
from app.services.access import require_membership, require_role
from app.services.audit import log_event

router = APIRouter(prefix="/api/households", tags=["households"])


def _membership_out(member: Membership) -> MembershipOut:
    return MembershipOut(
        id=member.id,
        user_id=member.user_id,
        email=member.user.email,
        full_name=member.user.full_name,
        role=member.role,
        status=member.status,
        created_at=member.created_at,
    )


@router.get("/mine", response_model=list[HouseholdOut])
def my_households(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(Membership)
        .filter(Membership.user_id == user.id, Membership.status == "active")
        .all()
    )
    result = []
    for row in rows:
        item = HouseholdOut.model_validate(row.household)
        item.role = row.role
        result.append(item)
    return result


@router.get("/{household_id}/members", response_model=list[MembershipOut])
def members(household_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_membership(db, user, household_id)
    rows = db.query(Membership).filter(Membership.household_id == household_id).all()
    return [_membership_out(row) for row in rows]


@router.post("/{household_id}/invitations", status_code=201)
def invite(
    household_id: str,
    payload: InviteIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = require_membership(db, user, household_id)
    require_role(member, {"owner"})
    token = secrets.token_urlsafe(24)
    invitation = Invitation(
        household_id=household_id,
        email=payload.email.lower(),
        role=payload.role,
        token=token,
        invited_by=user.id,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(invitation)
    log_event(
        db,
        action="household.invite",
        resource_type="invitation",
        resource_id=invitation.id,
        actor_id=user.id,
        household_id=household_id,
        details=payload.role,
    )
    db.commit()
    return {"token": token, "email": invitation.email, "role": invitation.role, "expires_at": invitation.expires_at}


@router.post("/invitations/accept", response_model=HouseholdOut)
def accept_invite(payload: InviteAcceptIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    invitation = db.query(Invitation).filter(Invitation.token == payload.token).first()
    if not invitation or invitation.accepted_at or invitation.expires_at < datetime.utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invitation is invalid or expired.")
    if invitation.email != user.email.lower():
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This invitation was issued to a different email.")
    existing = (
        db.query(Membership)
        .filter(Membership.household_id == invitation.household_id, Membership.user_id == user.id)
        .first()
    )
    if existing:
        existing.status = "active"
        existing.role = invitation.role
    else:
        db.add(
            Membership(
                household_id=invitation.household_id,
                user_id=user.id,
                role=invitation.role,
                status="active",
                invited_by=invitation.invited_by,
            )
        )
    invitation.accepted_at = datetime.utcnow()
    log_event(
        db,
        action="household.join",
        resource_type="household",
        resource_id=invitation.household_id,
        actor_id=user.id,
        household_id=invitation.household_id,
    )
    db.commit()
    household = db.get(Household, invitation.household_id)
    out = HouseholdOut.model_validate(household)
    out.role = invitation.role
    return out


@router.patch("/{household_id}/members/{member_id}", response_model=MembershipOut)
def update_role(
    household_id: str,
    member_id: str,
    payload: RoleUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    actor = require_membership(db, user, household_id)
    require_role(actor, {"owner"})
    target = db.get(Membership, member_id)
    if not target or target.household_id != household_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found.")
    if target.role == "owner" and payload.role != "owner":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Transfer ownership is not supported in this prototype.")
    target.role = payload.role
    log_event(
        db,
        action="household.role_change",
        resource_type="membership",
        resource_id=target.id,
        actor_id=user.id,
        household_id=household_id,
        details=payload.role,
    )
    db.commit()
    db.refresh(target)
    return _membership_out(target)


@router.delete("/{household_id}/members/{member_id}", status_code=204)
def remove_member(
    household_id: str,
    member_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    actor = require_membership(db, user, household_id)
    require_role(actor, {"owner"})
    target = db.get(Membership, member_id)
    if not target or target.household_id != household_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found.")
    if target.role == "owner":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot remove the household owner.")
    db.delete(target)
    log_event(
        db,
        action="household.member_removed",
        resource_type="membership",
        resource_id=member_id,
        actor_id=user.id,
        household_id=household_id,
    )
    db.commit()
    return None

