"""External Accounts API routes."""

import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import ExternalAccount, AdminUser, CredentialVault
from app.domain.schemas import (
    ExternalAccountCreate, ExternalAccountUpdate, ExternalAccountResponse,
    MessageResponse, CredentialVaultCreate, CredentialVaultResponse,
    CredentialVaultUnlockResponse, TOTPChallengeRequest
)
from app.domain.enums import ExternalAccountProvider
from app.infrastructure.security.auth import encrypt_data, decrypt_data
from app.application.services.vault_service import VaultService
from app.application.services.totp_service import TOTPService

router = APIRouter(prefix="/projects/{project_id}/accounts", tags=["external-accounts"])


@router.get("/", response_model=dict)
async def list_external_accounts(
    project_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    provider: Optional[ExternalAccountProvider] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all external accounts for a project with pagination and filtering."""
    query = select(ExternalAccount).where(ExternalAccount.project_id == project_id)
    count_query = select(ExternalAccount.id).where(ExternalAccount.project_id == project_id)

    # Apply filters
    if provider:
        query = query.where(ExternalAccount.provider == provider)
        count_query = count_query.where(ExternalAccount.provider == provider)
    if is_active is not None:
        query = query.where(ExternalAccount.is_active == is_active)
        count_query = count_query.where(ExternalAccount.is_active == is_active)

    # Get total count
    total = len(list(db.exec(count_query).all()))

    # Apply sorting
    if sort_by and hasattr(ExternalAccount, sort_by):
        column = getattr(ExternalAccount, sort_by)
        query = query.order_by(column.desc() if sort_order == "desc" else column.asc())

    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)

    accounts = list(db.exec(query).all())

    return {
        "items": [account.model_dump() for account in accounts],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=ExternalAccountResponse)
async def create_external_account(
    project_id: str,
    account_in: ExternalAccountCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new external account."""
    # Ensure project_id matches the path parameter
    account_data = account_in.model_dump()
    account_data["project_id"] = project_id
    if "metadata" in account_data and "extra_metadata" not in account_data:
        account_data["extra_metadata"] = account_data.pop("metadata")
    account = ExternalAccount.model_validate(account_data)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/{account_id}", response_model=ExternalAccountResponse)
async def get_external_account(
    project_id: str,
    account_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get an external account by ID."""
    account = db.get(ExternalAccount, account_id)
    if not account or account.project_id != project_id:
        raise HTTPException(status_code=404, detail="External account not found")
    return account


@router.put("/{account_id}", response_model=ExternalAccountResponse)
async def update_external_account(
    project_id: str,
    account_id: str,
    account_in: ExternalAccountUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update an external account."""
    account = db.get(ExternalAccount, account_id)
    if not account or account.project_id != project_id:
        raise HTTPException(status_code=404, detail="External account not found")

    obj_data = account_in.model_dump(exclude_unset=True)
    if "metadata" in obj_data and "extra_metadata" not in obj_data:
        obj_data["extra_metadata"] = obj_data.pop("metadata")
    for key, value in obj_data.items():
        setattr(account, key, value)

    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", response_model=MessageResponse)
async def delete_external_account(
    project_id: str,
    account_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete an external account (soft delete)."""
    account = db.get(ExternalAccount, account_id)
    if not account or account.project_id != project_id:
        raise HTTPException(status_code=404, detail="External account not found")
    account.is_active = False
    db.add(account)
    db.commit()
    return {"message": "External account deleted successfully"}


# ============================================
# Credential Vault Endpoints
# ============================================

@router.post("/{account_id}/vault", response_model=CredentialVaultResponse)
async def create_credential_vault_entry(
    project_id: str,
    account_id: str,
    vault_in: CredentialVaultCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new credential vault entry (encrypted)."""
    # Verify account belongs to project
    account = db.get(ExternalAccount, account_id)
    if not account or account.project_id != project_id:
        raise HTTPException(status_code=404, detail="External account not found")
    
    # Ensure project_id matches
    vault_data = vault_in.model_dump()
    vault_data["project_id"] = project_id
    vault_data["account_id"] = account_id
    vault_data["provider"] = account.provider
    
    # Encrypt credentials before storage
    credentials_json = json.dumps(vault_data["credentials"])
    encrypted_credentials = encrypt_data(credentials_json)
    vault_data["encrypted_credentials"] = encrypted_credentials
    # Remove plain credentials
    del vault_data["credentials"]
    
    vault = CredentialVault.model_validate(vault_data)
    db.add(vault)
    db.commit()
    db.refresh(vault)
    return vault


@router.get("/{account_id}/vault", response_model=List[CredentialVaultResponse])
async def list_credential_vault_entries(
    project_id: str,
    account_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all credential vault entries for an account (no decrypted credentials)."""
    # Verify account belongs to project
    account = db.get(ExternalAccount, account_id)
    if not account or account.project_id != project_id:
        raise HTTPException(status_code=404, detail="External account not found")
    
    vaults = db.exec(
        select(CredentialVault)
        .where(CredentialVault.account_id == account_id)
        .where(CredentialVault.project_id == project_id)
    ).all()
    
    return vaults


@router.post("/{account_id}/vault/{vault_id}/unlock", response_model=CredentialVaultUnlockResponse)
async def unlock_credential_vault_entry(
    project_id: str,
    account_id: str,
    vault_id: str,
    challenge_request: TOTPChallengeRequest,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Unlock a credential vault entry (requires 2FA)."""
    # Verify account belongs to project
    account = db.get(ExternalAccount, account_id)
    if not account or account.project_id != project_id:
        raise HTTPException(status_code=404, detail="External account not found")
    
    # Get vault entry
    vault = db.get(CredentialVault, vault_id)
    if not vault or vault.account_id != account_id or vault.project_id != project_id:
        raise HTTPException(status_code=404, detail="Credential vault entry not found")
    
    # Verify 2FA
    totp_service = TOTPService(db)
    
    # Verify the TOTP code for the current user
    if not totp_service.verify_totp(current_user.id, challenge_request.code):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    # Decrypt credentials
    decrypted_credentials_json = decrypt_data(vault.encrypted_credentials)
    decrypted_credentials = json.loads(decrypted_credentials_json)
    
    # Update access tracking
    vault.last_accessed_at = datetime.now(timezone.utc)
    vault.access_count += 1
    db.add(vault)
    db.commit()
    
    return CredentialVaultUnlockResponse(
        id=vault.id,
        project_id=vault.project_id,
        provider=vault.provider,
        account_name=vault.account_name,
        credential_type=vault.credential_type,
        credentials=decrypted_credentials,
        expires_at=vault.expires_at,
        notes=vault.notes
    )
