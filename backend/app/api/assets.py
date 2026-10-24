from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Asset, AssetDocument, Document, User
from app.schemas import AssetIn, AssetOut
from app.services.access import can_read_document, require_membership, require_role
from app.services.audit import log_event

router = APIRouter(prefix="/api/assets", tags=["assets"])


def _out(asset: Asset) -> AssetOut:
    item = AssetOut.model_validate(asset)
    item.document_ids = [link.document_id for link in asset.links]
    return item


@router.get("", response_model=list[AssetOut])
def list_assets(household_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = require_membership(db, user, household_id)
    if member.role == "guest":
        return []
    assets = db.query(Asset).filter(Asset.household_id == household_id).order_by(Asset.created_at.desc()).all()
    return [_out(a) for a in assets]


@router.post("", response_model=AssetOut, status_code=201)
def create_asset(household_id: str, payload: AssetIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = require_membership(db, user, household_id)
    require_role(member, {"owner", "adult"})
    asset = Asset(
        household_id=household_id,
        created_by=user.id,
        name=payload.name,
        asset_type=payload.asset_type,
        description=payload.description,
        purchase_date=payload.purchase_date,
        value_amount=payload.value_amount,
        warranty_date=payload.warranty_date,
        notes=payload.notes,
    )
    db.add(asset)
    db.flush()
    for doc_id in payload.document_ids:
        doc = db.get(Document, doc_id)
        if not doc or doc.household_id != household_id or doc.deleted_at:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Linked document is invalid.")
        allowed, _ = can_read_document(db, user, doc)
        if not allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot link an inaccessible document.")
        db.add(AssetDocument(asset_id=asset.id, document_id=doc_id))
    log_event(db, action="asset.create", resource_type="asset", resource_id=asset.id, actor_id=user.id, household_id=household_id)
    db.commit()
    db.refresh(asset)
    return _out(asset)


@router.patch("/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: str, payload: AssetIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found.")
    member = require_membership(db, user, asset.household_id)
    require_role(member, {"owner", "adult"})
    asset.name = payload.name
    asset.asset_type = payload.asset_type
    asset.description = payload.description
    asset.purchase_date = payload.purchase_date
    asset.value_amount = payload.value_amount
    asset.warranty_date = payload.warranty_date
    asset.notes = payload.notes
    db.query(AssetDocument).filter(AssetDocument.asset_id == asset.id).delete()
    for doc_id in payload.document_ids:
        db.add(AssetDocument(asset_id=asset.id, document_id=doc_id))
    log_event(db, action="asset.update", resource_type="asset", resource_id=asset.id, actor_id=user.id, household_id=asset.household_id)
    db.commit()
    db.refresh(asset)
    return _out(asset)


@router.delete("/{asset_id}")
def delete_asset(asset_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Asset not found.")
    member = require_membership(db, user, asset.household_id)
    require_role(member, {"owner", "adult"})
    db.delete(asset)
    log_event(db, action="asset.delete", resource_type="asset", resource_id=asset_id, actor_id=user.id, household_id=asset.household_id)
    db.commit()
    return {"ok": True}
