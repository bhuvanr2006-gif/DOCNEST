"""Clean up docnest database: remove all demo members, remove synthetic documents, retain only the owner."""
import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import SessionLocal
from app.models import (
    User,
    Household,
    Membership,
    Document,
    ExtractedField,
    EncryptionKey,
    IntegrityRecord,
    Asset,
    AssetDocument,
    SharingGrant,
    ConsentRecord,
    Reminder,
    Notification,
    Invitation,
    AuditLog,
)
from app.security.passwords import hash_password

def clean_database():
    db = SessionLocal()
    try:
        # 1. Find the owner
        owner = db.query(User).filter(User.full_name == "Bhuvan R").first()
        if not owner:
            owner = db.query(User).filter(User.email.like("%owner%")).first()
        
        if not owner:
            print("ERROR: Owner user not found!")
            return

        print(f"Found Owner: id={owner.id}, name={owner.full_name}, current_email={owner.email}")
        
        # Update owner email & password to a clean, authentic credential
        owner_email = "owner@docnest.com"
        owner_password = "OwnerVault@2026!"
        owner.email = owner_email
        owner.hashed_password = hash_password(owner_password)
        db.flush()

        # Update household name
        household = db.query(Household).filter(Household.owner_id == owner.id).first()
        if household:
            household.name = "Bhuvan Family Vault"
            print(f"Household updated to: {household.name} (id={household.id})")

        # 2. Delete all other households not owned by owner
        other_households = db.query(Household).filter(Household.owner_id != owner.id).all()
        for oh in other_households:
            print(f"Removing other household: {oh.name} ({oh.id})")
            db.query(Membership).filter(Membership.household_id == oh.id).delete()
            db.query(Document).filter(Document.household_id == oh.id).delete()
            db.query(Asset).filter(Asset.household_id == oh.id).delete()
            db.delete(oh)
        db.flush()

        # 3. Delete all other memberships in owner's household
        other_memberships = db.query(Membership).filter(
            Membership.household_id == household.id,
            Membership.user_id != owner.id
        ).all()
        for m in other_memberships:
            print(f"Removing membership for user_id={m.user_id}, role={m.role}")
            db.delete(m)
        db.flush()

        # 4. Delete all other users
        other_users = db.query(User).filter(User.id != owner.id).all()
        for u in other_users:
            print(f"Deleting user: {u.full_name} ({u.email})")
            # Delete any grants / consents / notifications / reminders for this user
            db.query(SharingGrant).filter((SharingGrant.grantor_id == u.id) | (SharingGrant.grantee_id == u.id)).delete()
            db.query(ConsentRecord).filter((ConsentRecord.grantor_id == u.id) | (ConsentRecord.grantee_id == u.id)).delete()
            db.query(Notification).filter(Notification.user_id == u.id).delete()
            db.query(Reminder).filter(Reminder.user_id == u.id).delete()
            db.query(Invitation).filter(Invitation.invited_by == u.id).delete()
            db.delete(u)
        db.flush()

        # 5. Remove synthetic example documents
        synthetic_docs = db.query(Document).filter(
            (Document.file_name.like("%synthetic%")) | (Document.title.like("%synthetic%"))
        ).all()
        for sdoc in synthetic_docs:
            print(f"Removing synthetic document: {sdoc.title} ({sdoc.file_name})")
            db.query(AssetDocument).filter(AssetDocument.document_id == sdoc.id).delete()
            db.query(SharingGrant).filter(SharingGrant.document_id == sdoc.id).delete()
            db.query(ConsentRecord).filter(ConsentRecord.document_id == sdoc.id).delete()
            db.query(Reminder).filter(Reminder.document_id == sdoc.id).delete()
            db.query(ExtractedField).filter(ExtractedField.document_id == sdoc.id).delete()
            db.query(EncryptionKey).filter(EncryptionKey.document_id == sdoc.id).delete()
            db.query(IntegrityRecord).filter(IntegrityRecord.document_id == sdoc.id).delete()
            
            # Remove file from disk if exists
            if sdoc.storage_relpath:
                file_path = BACKEND_ROOT / "storage" / sdoc.storage_relpath
                if file_path.exists():
                    try:
                        file_path.unlink()
                        print(f"  Deleted file on disk: {file_path}")
                    except Exception as e:
                        print(f"  Could not delete file {file_path}: {e}")
            db.delete(sdoc)
        db.flush()

        # 6. Remove synthetic/seeded assets
        demo_assets = db.query(Asset).filter(
            (Asset.name == "Family Scooter") | (Asset.description.like("%Honda Activa%"))
        ).all()
        for da in demo_assets:
            print(f"Removing demo asset: {da.name}")
            db.query(AssetDocument).filter(AssetDocument.asset_id == da.id).delete()
            db.query(Reminder).filter(Reminder.asset_id == da.id).delete()
            db.delete(da)
        db.flush()

        # 7. Clean up audit logs of deleted users or other households
        db.query(AuditLog).filter(
            (AuditLog.household_id != household.id) |
            (AuditLog.actor_id != owner.id)
        ).delete()

        db.commit()
        print("\n==========================================")
        print("DATABASE CLEANUP COMPLETE!")
        print(f"Owner Email:    {owner_email}")
        print(f"Owner Password: {owner_password}")
        print(f"Owner ID:       {owner.id}")
        print(f"Owner Name:     {owner.full_name}")
        print(f"Household:      {household.name} ({household.id})")
        print("==========================================")

    except Exception as e:
        db.rollback()
        print("ERROR:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
