from datetime import datetime

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Document, IntegrityRecord
from app.security.crypto import load_and_decrypt, sha256_bytes
from app.services.audit import log_event
from app.services.blockchain import register_digest, verify_digest


def attach_integrity(db: Session, document: Document, digest: str) -> IntegrityRecord:
    settings = get_settings()
    mode = "blockchain" if settings.blockchain_enabled and settings.integrity_mode == "blockchain" else "database"
    tx_hash = None
    registered_at = None
    if mode == "blockchain":
        result = register_digest(digest)
        if result.get("ok"):
            tx_hash = result.get("tx_hash")
            registered_at = datetime.utcnow()
        else:
            mode = "database"
    record = IntegrityRecord(
        document_id=document.id,
        sha256=digest,
        mode=mode,
        blockchain_tx_hash=tx_hash,
        blockchain_registered_at=registered_at,
    )
    document.integrity_mode = mode
    db.add(record)
    db.flush()
    return record


def verify_document(db: Session, document: Document, actor_id: str, uploaded: bytes | None = None) -> dict:
    if not document.encryption_key:
        result = {"status": "unable", "message": "Encryption key is unavailable.", "mode": document.integrity_mode}
        log_event(
            db,
            action="integrity.verify",
            resource_type="document",
            resource_id=document.id,
            actor_id=actor_id,
            household_id=document.household_id,
            details="unable",
        )
        return result

    from app.config import get_settings as gs

    path = gs().storage_path / document.storage_relpath
    try:
        plaintext = uploaded if uploaded is not None else load_and_decrypt(
            path, document.encryption_key.wrapped_key, document.encryption_key.wrap_nonce
        )
        digest = sha256_bytes(plaintext)
    except Exception:
        result = {"status": "unable", "message": "Unable to decrypt stored file.", "mode": document.integrity_mode}
        log_event(
            db,
            action="integrity.verify",
            resource_type="document",
            resource_id=document.id,
            actor_id=actor_id,
            household_id=document.household_id,
            details="unable",
        )
        return result

    stored = document.sha256
    status = "verified" if digest == stored else "mismatch"
    message = "SHA-256 digest matches the stored reference." if status == "verified" else "Digest does not match the stored reference."
    chain = None
    if document.integrity and document.integrity.mode == "blockchain" and document.integrity.blockchain_tx_hash:
        chain = verify_digest(stored)
        if not chain.get("ok"):
            chain = {"ok": False, "message": "Blockchain verification unavailable."}
    elif document.integrity_mode == "blockchain":
        chain = {"ok": False, "message": "Blockchain mode is configured but no transaction is recorded."}

    log_event(
        db,
        action="integrity.verify",
        resource_type="document",
        resource_id=document.id,
        actor_id=actor_id,
        household_id=document.household_id,
        details=status,
    )
    return {
        "status": status,
        "message": message,
        "mode": document.integrity_mode,
        "sha256": stored,
        "computed_sha256": digest,
        "blockchain": chain,
    }
