from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    household_name: str = "My Household"
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    timezone: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    timezone: Optional[str] = None


class CredentialsUpdate(BaseModel):
    current_password: str
    new_email: Optional[EmailStr] = None
    new_password: Optional[str] = Field(None, min_length=8)



class MembershipOut(BaseModel):
    id: str
    user_id: str
    email: EmailStr
    full_name: str
    role: str
    status: str
    created_at: datetime


class HouseholdOut(BaseModel):
    id: str
    name: str
    owner_id: str
    created_at: datetime
    role: Optional[str] = None

    model_config = {"from_attributes": True}


class InviteIn(BaseModel):
    email: EmailStr
    role: str = Field(pattern="^(adult|dependent|guest)$")


class InviteAcceptIn(BaseModel):
    token: str


class RoleUpdateIn(BaseModel):
    role: str = Field(pattern="^(owner|adult|dependent|guest)$")


class FieldOut(BaseModel):
    id: Optional[str] = None
    field_name: str
    extracted_value: Optional[str] = None
    corrected_value: Optional[str] = None
    confidence: Optional[float] = None
    source: str = "ocr"

    model_config = {"from_attributes": True}


class FieldCorrection(BaseModel):
    field_name: str
    corrected_value: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    archived: Optional[bool] = None
    fields: Optional[list[FieldCorrection]] = None


class DocumentOut(BaseModel):
    id: str
    household_id: str
    owner_user_id: str
    title: str
    category: str
    file_name: str
    mime_type: str
    file_size: int
    sha256: str
    ocr_status: str
    ocr_confidence: Optional[float] = None
    quality_score: Optional[float] = None
    quality_notes: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    archived: bool
    integrity_mode: str
    created_at: datetime
    updated_at: datetime
    expiry_status: Optional[str] = None
    duplicate_of: Optional[str] = None
    fields: list[FieldOut] = []
    ocr_text: Optional[str] = None

    model_config = {"from_attributes": True}


class AssetIn(BaseModel):
    name: str
    asset_type: str
    description: Optional[str] = None
    purchase_date: Optional[date] = None
    value_amount: Optional[float] = None
    warranty_date: Optional[date] = None
    notes: Optional[str] = None
    document_ids: list[str] = []


class AssetOut(BaseModel):
    id: str
    household_id: str
    name: str
    asset_type: str
    description: Optional[str] = None
    purchase_date: Optional[date] = None
    value_amount: Optional[float] = None
    warranty_date: Optional[date] = None
    notes: Optional[str] = None
    document_ids: list[str] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ShareIn(BaseModel):
    grantee_email: EmailStr
    permission: str = Field(pattern="^(view|download)$")
    expires_at: Optional[datetime] = None
    scope: str = "document"


class GrantOut(BaseModel):
    id: str
    document_id: str
    household_id: str
    grantor_id: str
    grantee_id: str
    permission: str
    starts_at: datetime
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    consent_id: Optional[str] = None
    created_at: datetime
    document_title: Optional[str] = None
    grantee_email: Optional[str] = None

    model_config = {"from_attributes": True}


class ConsentOut(BaseModel):
    id: str
    household_id: str
    document_id: Optional[str] = None
    grantor_id: str
    grantee_id: str
    scope: str
    permission: str
    starts_at: datetime
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditOut(BaseModel):
    id: str
    household_id: Optional[str] = None
    actor_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReminderOut(BaseModel):
    id: str
    title: str
    window_days: int
    target_date: date
    status: str
    document_id: Optional[str] = None
    asset_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: str
    title: str
    body: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardOut(BaseModel):
    total_documents: int
    by_category: dict[str, int]
    recent_documents: list[DocumentOut]
    upcoming_expirations: list[DocumentOut]
    expired_documents: list[DocumentOut]
    assets_count: int
    recent_shares: list[GrantOut]
    recent_audit: list[AuditOut]


class VerifyOut(BaseModel):
    status: str
    message: str
    mode: str
    sha256: Optional[str] = None
    computed_sha256: Optional[str] = None
    blockchain: Optional[dict] = None
