"""API Keys management API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.infrastructure.security.auth import encrypt_secret
from app.domain.models import APIKey, AdminUser
from app.domain.schemas import MessageResponse
from pydantic import BaseModel, Field

router = APIRouter()


class APIKeyCreate(BaseModel):
    """Schema for creating an API key."""
    name: str = Field(max_length=255)
    key: str = Field(min_length=1, description="The raw API key value")
    provider: str = Field(max_length=100, description="e.g. github, supabase, vercel")
    scopes: Optional[list[str]] = None
    expires_at: Optional[str] = None


class APIKeyResponse(BaseModel):
    """Schema for API key response (never returns the raw key)."""
    id: str
    name: str
    provider: str
    scopes: Optional[list[str]]
    expires_at: Optional[str]
    is_active: bool
    last_rotated_at: Optional[str]
    created_at: str


@router.get("/", response_model=dict)
async def list_api_keys(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    provider: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all API keys (encrypted values never returned)."""
    query = select(APIKey)
    count_query = select(APIKey.id)

    if provider:
        query = query.where(APIKey.provider == provider)
        count_query = count_query.where(APIKey.provider == provider)

    total = db.exec(count_query).count()

    skip = (page - 1) * page_size
    query = query.order_by(APIKey.created_at.desc()).offset(skip).limit(page_size)

    keys = list(db.exec(query).all())

    return {
        "items": [
            {
                "id": k.id,
                "name": k.name,
                "provider": k.provider,
                "scopes": k.scopes,
                "expires_at": k.expires_at.isoformat() if k.expires_at else None,
                "is_active": k.is_active,
                "last_rotated_at": k.last_rotated_at.isoformat() if k.last_rotated_at else None,
                "created_at": k.created_at.isoformat(),
            }
            for k in keys
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=APIKeyResponse)
async def create_api_key(
    key_in: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Store a new API key (encrypted)."""
    from datetime import datetime

    api_key = APIKey(
        name=key_in.name,
        key_encrypted=encrypt_secret(key_in.key),
        provider=key_in.provider,
        scopes=key_in.scopes,
        is_active=True,
    )

    if key_in.expires_at:
        api_key.expires_at = datetime.fromisoformat(key_in.expires_at)

    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return {
        "id": api_key.id,
        "name": api_key.name,
        "provider": api_key.provider,
        "scopes": api_key.scopes,
        "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
        "is_active": api_key.is_active,
        "last_rotated_at": api_key.last_rotated_at.isoformat() if api_key.last_rotated_at else None,
        "created_at": api_key.created_at.isoformat(),
    }


@router.put("/{key_id}/toggle", response_model=MessageResponse)
async def toggle_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Toggle an API key active/inactive."""
    api_key = db.get(APIKey, key_id)
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key.is_active = not api_key.is_active
    db.add(api_key)
    db.commit()

    return {"message": f"API key {'activated' if api_key.is_active else 'deactivated'}"}


@router.delete("/{key_id}", response_model=MessageResponse)
async def delete_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete an API key."""
    api_key = db.get(APIKey, key_id)
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    db.delete(api_key)
    db.commit()

    return {"message": "API key deleted successfully"}
