"""AI Accounts API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import AIAccount, AdminUser
from app.domain.schemas import (
    AIAccountCreate, AIAccountUpdate, AIAccountResponse, MessageResponse,
    AICreditUpdate, AIUsageReport
)
from app.application.services.ai_service import AIAccountService

router = APIRouter()


@router.get("/", response_model=dict)
async def list_ai_accounts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    provider: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all AI accounts with pagination and filtering."""
    service = AIAccountService(db)
    
    filters = {}
    if provider:
        filters["provider"] = provider
    if is_active is not None:
        filters["is_active"] = is_active
    
    accounts, total = service.get_many(
        page=page,
        page_size=page_size,
        filters=filters if filters else None,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return {
        "items": [account.model_dump() for account in accounts],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=AIAccountResponse)
async def create_ai_account(
    account_in: AIAccountCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new AI account."""
    service = AIAccountService(db)
    account = service.create(account_in)
    return account


@router.get("/{account_id}", response_model=AIAccountResponse)
async def get_ai_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get an AI account by ID."""
    service = AIAccountService(db)
    account = service.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="AI account not found")
    return account


@router.put("/{account_id}", response_model=AIAccountResponse)
async def update_ai_account(
    account_id: str,
    account_in: AIAccountUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update an AI account."""
    service = AIAccountService(db)
    account = service.get_by_id(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="AI account not found")
    
    # Handle API key rotation if provided
    if account_in.api_key:
        account = service.rotate_api_key(account_id, account_in.api_key)
        account_in.api_key = None  # Remove from further processing
    
    updated = service.update(account, account_in)
    return updated


@router.delete("/{account_id}", response_model=MessageResponse)
async def delete_ai_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete an AI account."""
    service = AIAccountService(db)
    if not service.delete(account_id):
        raise HTTPException(status_code=404, detail="AI account not found")
    return {"message": "AI account deleted successfully"}


@router.post("/{account_id}/credits", response_model=AIAccountResponse)
async def update_ai_credits(
    account_id: str,
    credit_data: AICreditUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update AI account credits after usage."""
    service = AIAccountService(db)
    account = service.update_credits(account_id, credit_data)
    if not account:
        raise HTTPException(status_code=404, detail="AI account not found")
    return account


@router.get("/{account_id}/usage-report", response_model=AIUsageReport)
async def get_ai_account_usage_report(
    account_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get usage report for an AI account."""
    service = AIAccountService(db)
    report = service.get_usage_report(account_id, days=days)
    if not report:
        raise HTTPException(status_code=404, detail="AI account not found")
    return report
