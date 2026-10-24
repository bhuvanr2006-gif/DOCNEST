from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Household, Membership, User
from app.schemas import CredentialsUpdate, LoginIn, ProfileUpdate, TokenOut, UserCreate, UserOut
from app.security.passwords import hash_password, verify_password
from app.security.tokens import create_access_token
from app.services.audit import log_event

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
    )
    db.add(user)
    db.flush()
    household = Household(name=payload.household_name, owner_id=user.id)
    db.add(household)
    db.flush()
    db.add(Membership(household_id=household.id, user_id=user.id, role="owner", status="active"))
    log_event(
        db,
        action="auth.register",
        resource_type="user",
        resource_id=user.id,
        actor_id=user.id,
        household_id=household.id,
    )
    db.commit()
    db.refresh(user)
    return user


def _issue_token(db: Session, email: str, password: str) -> TokenOut:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.hashed_password):
        log_event(db, action="auth.login_failed", resource_type="user", details="invalid_credentials")
        db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.")
    token = create_access_token(user.id)
    membership = db.query(Membership).filter(Membership.user_id == user.id, Membership.status == "active").first()
    log_event(
        db,
        action="auth.login",
        resource_type="user",
        resource_id=user.id,
        actor_id=user.id,
        household_id=membership.household_id if membership else None,
    )
    db.commit()
    return TokenOut(access_token=token)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    return _issue_token(db, payload.email, payload.password)


@router.post("/token", response_model=TokenOut)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return _issue_token(db, form.username, form.password)


@router.post("/logout")
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_event(db, action="auth.logout", resource_type="user", resource_id=user.id, actor_id=user.id)
    db.commit()
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.timezone is not None:
        user.timezone = payload.timezone
    db.commit()
    db.refresh(user)
    return user


@router.post("/credentials", response_model=TokenOut)
def change_credentials(
    payload: CredentialsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect.")

    if payload.new_email:
        new_email = payload.new_email.lower().strip()
        if new_email != user.email.lower():
            existing = db.query(User).filter(User.email == new_email).first()
            if existing:
                raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
            user.email = new_email

    if payload.new_password:
        user.hashed_password = hash_password(payload.new_password)

    log_event(
        db,
        action="auth.credentials_change",
        resource_type="user",
        resource_id=user.id,
        actor_id=user.id,
    )
    db.commit()
    db.refresh(user)

    new_token = create_access_token(user.id)
    return TokenOut(access_token=new_token)

