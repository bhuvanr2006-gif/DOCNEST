from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Document, EncryptionKey, ExtractedField, SharingGrant, User
from app.ocr.pipeline import parse_date, process_document, validate_upload
from app.schemas import DocumentOut, DocumentUpdate, FieldOut, VerifyOut
from app.security.crypto import encrypt_and_store, generate_dek, load_and_decrypt, sha256_bytes, wrap_dek
from app.services.access import (
    active_grant,
    can_download_document,
    membership_for,
    require_document_modify,
    require_document_read,
    require_membership,
)
from app.services.audit import log_event
from app.services.integrity import attach_integrity, verify_document
from app.services.reminders import expiry_status, sync_document_reminders

router = APIRouter(prefix="/api/documents", tags=["documents"])


def _to_out(doc: Document, include_text: bool = False, duplicate_of: str | None = None) -> DocumentOut:
    data = DocumentOut.model_validate(doc)
    data.expiry_status = expiry_status(doc.expiry_date)
    data.fields = [
        FieldOut(
            id=f.id,
            field_name=f.field_name,
            extracted_value=f.extracted_value,
            corrected_value=f.corrected_value,
            confidence=f.confidence,
            source=f.source,
        )
        for f in doc.fields
    ]
    data.duplicate_of = duplicate_of
    if include_text:
        data.ocr_text = doc.ocr_text
    else:
        data.ocr_text = None
    return data


def _effective(field: ExtractedField) -> str | None:
    return field.corrected_value if field.corrected_value is not None else field.extracted_value


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    household_id: str = Form(...),
    title: str = Form(...),
    category: str | None = Form(None),
    notes: str | None = Form(None),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = require_membership(db, user, household_id)
    if member.role == "guest":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Guest verifiers cannot upload documents.")
    settings = get_settings()
    data = await file.read()
    try:
        validate_upload(file.filename or "upload.bin", file.content_type, data, settings.max_upload_mb * 1024 * 1024)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    ocr = process_document(file.filename or "upload.bin", data)
    digest = sha256_bytes(data)
    duplicate = (
        db.query(Document)
        .filter(
            Document.household_id == household_id,
            Document.sha256 == digest,
            Document.deleted_at.is_(None),
        )
        .first()
    )

    dek = generate_dek()
    wrapped, nonce = wrap_dek(dek)
    doc = Document(
        household_id=household_id,
        owner_user_id=user.id,
        title=title,
        category=(category or ocr.category or "other").lower(),
        file_name=file.filename or "document",
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(data),
        storage_relpath="",
        sha256=digest,
        ocr_status="completed" if ocr.text else "needs_review",
        ocr_text=ocr.text or None,
        ocr_confidence=ocr.confidence,
        quality_score=ocr.quality_score,
        quality_notes="; ".join(ocr.quality_notes) if ocr.quality_notes else None,
        notes=notes,
        integrity_mode=settings.integrity_mode,
    )
    db.add(doc)
    db.flush()
    rel = Path("documents") / household_id / f"{doc.id}.enc"
    doc.storage_relpath = rel.as_posix()
    encrypt_and_store(data, settings.storage_path / rel, wrapped, nonce)
    db.add(EncryptionKey(document_id=doc.id, wrapped_key=wrapped, wrap_nonce=nonce))

    for item in ocr.fields:
        field = ExtractedField(
            document_id=doc.id,
            field_name=item.name,
            extracted_value=item.value,
            confidence=item.confidence,
            source="ocr" if item.value else "ocr",
        )
        db.add(field)
        if item.name == "issue_date":
            doc.issue_date = parse_date(item.value)
        if item.name == "expiry_date":
            doc.expiry_date = parse_date(item.value)

    attach_integrity(db, doc, digest)
    sync_document_reminders(db, doc)
    log_event(
        db,
        action="document.upload",
        resource_type="document",
        resource_id=doc.id,
        actor_id=user.id,
        household_id=household_id,
        details=doc.category,
    )
    db.commit()
    db.refresh(doc)
    return _to_out(doc, include_text=True, duplicate_of=duplicate.id if duplicate else None)


@router.get("", response_model=list[DocumentOut])
def list_documents(
    household_id: str,
    q: str | None = None,
    category: str | None = None,
    member_id: str | None = None,
    sort: str = "created_at",
    archived: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = require_membership(db, user, household_id)
    query = db.query(Document).filter(
        Document.household_id == household_id,
        Document.deleted_at.is_(None),
        Document.archived == archived,
    )
    if category:
        query = query.filter(Document.category == category)
    if member_id:
        query = query.filter(Document.owner_user_id == member_id)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Document.title.ilike(like), Document.category.ilike(like), Document.notes.ilike(like)))
    sort_map = {
        "created_at": Document.created_at.desc(),
        "title": Document.title.asc(),
        "expiry_date": Document.expiry_date.asc(),
    }
    query = query.order_by(sort_map.get(sort, Document.created_at.desc()))
    docs = query.all()
    visible = []
    for doc in docs:
        from app.services.access import can_read_document

        allowed, _ = can_read_document(db, user, doc)
        if allowed:
            visible.append(_to_out(doc))
    if member.role == "guest":
        visible = [item for item in visible]
    return visible


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc or doc.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    require_document_read(db, user, doc)
    log_event(
        db,
        action="document.read",
        resource_type="document",
        resource_id=doc.id,
        actor_id=user.id,
        household_id=doc.household_id,
    )
    db.commit()
    return _to_out(doc, include_text=True)


@router.patch("/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: str,
    payload: DocumentUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.get(Document, document_id)
    if not doc or doc.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    require_document_modify(db, user, doc)
    if payload.title is not None:
        doc.title = payload.title
    if payload.category is not None:
        doc.category = payload.category
    if payload.issue_date is not None:
        doc.issue_date = payload.issue_date
    if payload.expiry_date is not None:
        doc.expiry_date = payload.expiry_date
    if payload.notes is not None:
        doc.notes = payload.notes
    if payload.archived is not None:
        doc.archived = payload.archived
    if payload.fields:
        existing = {f.field_name: f for f in doc.fields}
        for item in payload.fields:
            field = existing.get(item.field_name)
            if field:
                field.corrected_value = item.corrected_value
                field.source = "user"
            else:
                db.add(
                    ExtractedField(
                        document_id=doc.id,
                        field_name=item.field_name,
                        corrected_value=item.corrected_value,
                        source="user",
                    )
                )
            if item.field_name == "issue_date":
                doc.issue_date = parse_date(item.corrected_value) or doc.issue_date
            if item.field_name == "expiry_date":
                parsed = parse_date(item.corrected_value)
                if parsed:
                    doc.expiry_date = parsed
    sync_document_reminders(db, doc)
    log_event(
        db,
        action="document.update",
        resource_type="document",
        resource_id=doc.id,
        actor_id=user.id,
        household_id=doc.household_id,
    )
    db.commit()
    db.refresh(doc)
    return _to_out(doc, include_text=True)


@router.get("/{document_id}/download")
def download_document(document_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc or doc.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    require_document_read(db, user, doc)
    if not can_download_document(db, user, doc):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Download permission is not granted.")
    if not doc.encryption_key:
        raise HTTPException(status.HTTP_409_CONFLICT, "Encryption key missing.")
    settings = get_settings()
    path = settings.storage_path / doc.storage_relpath
    plaintext = load_and_decrypt(path, doc.encryption_key.wrapped_key, doc.encryption_key.wrap_nonce)
    log_event(
        db,
        action="document.download",
        resource_type="document",
        resource_id=doc.id,
        actor_id=user.id,
        household_id=doc.household_id,
    )
    db.commit()
    return Response(
        content=plaintext,
        media_type=doc.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{doc.file_name}"'},
    )


@router.post("/{document_id}/verify", response_model=VerifyOut)
def verify(document_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc or doc.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    require_document_read(db, user, doc)
    result = verify_document(db, doc, user.id)
    db.commit()
    return result


@router.post("/{document_id}/tamper-demo", response_model=VerifyOut)
def tamper_demo(document_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Development demonstration: compare stored digest against altered bytes without writing them."""
    if get_settings().docnest_env == "production":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tamper demo is disabled outside development.")
    doc = db.get(Document, document_id)
    if not doc or doc.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    require_document_modify(db, user, doc)
    altered = b"DOCNEST-TAMPER-DEMO" + sha256_bytes(b"altered").encode()
    result = verify_document(db, doc, user.id, uploaded=altered)
    db.commit()
    return result


@router.delete("/{document_id}")
def delete_document(document_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.get(Document, document_id)
    if not doc or doc.deleted_at:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    member = membership_for(db, user, doc.household_id)
    if not member or (member.role != "owner" and doc.owner_user_id != user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not authorized to delete this document.")
    settings = get_settings()
    path = settings.storage_path / doc.storage_relpath
    if path.exists():
        path.unlink()
    if doc.encryption_key:
        db.delete(doc.encryption_key)
    grants = db.query(SharingGrant).filter(SharingGrant.document_id == doc.id, SharingGrant.revoked_at.is_(None)).all()
    now = __import__("datetime").datetime.utcnow()
    for grant in grants:
        grant.revoked_at = now
    doc.deleted_at = now
    log_event(
        db,
        action="document.delete",
        resource_type="document",
        resource_id=doc.id,
        actor_id=user.id,
        household_id=doc.household_id,
        details="ciphertext_and_key_removed",
    )
    db.commit()
    note = "Local encrypted file and wrapped key removed."
    if doc.integrity and doc.integrity.blockchain_tx_hash:
        note += " On-chain digest remains immutable and cannot be erased by this application."
    return {"ok": True, "message": note}
