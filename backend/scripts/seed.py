"""Seed or verify owner account for DocNest."""

from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy.orm import Session  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import Household, Membership, User  # noqa: E402
from app.security.passwords import hash_password  # noqa: E402

OWNER_EMAIL = "owner@docnest.com"
OWNER_PASSWORD = "OwnerVault@2026!"
OWNER_NAME = "Bhuvan R"
HOUSEHOLD_NAME = "Bhuvan Family Vault"


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.email == OWNER_EMAIL).first()
        if not owner:
            owner = db.query(User).filter(User.full_name == OWNER_NAME).first()
        if not owner:
            owner = User(
                email=OWNER_EMAIL,
                full_name=OWNER_NAME,
                hashed_password=hash_password(OWNER_PASSWORD),
            )
            db.add(owner)
            db.flush()
        else:
            owner.email = OWNER_EMAIL
            owner.hashed_password = hash_password(OWNER_PASSWORD)
            db.flush()

        household = db.query(Household).filter(Household.owner_id == owner.id).first()
        if not household:
            household = Household(name=HOUSEHOLD_NAME, owner_id=owner.id)
            db.add(household)
            db.flush()
        else:
            household.name = HOUSEHOLD_NAME
            db.flush()

        membership = (
            db.query(Membership)
            .filter(Membership.household_id == household.id, Membership.user_id == owner.id)
            .first()
        )
        if not membership:
            db.add(Membership(household_id=household.id, user_id=owner.id, role="owner", status="active"))

        db.commit()
        print("DocNest Owner Initialized:")
        print(f"  Email:    {OWNER_EMAIL}")
        print(f"  Password: {OWNER_PASSWORD}")
        print(f"  Owner ID: {owner.id}")
        print(f"  Vault:    {household.name}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
