"""Clients API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import Client, AdminUser
from app.domain.schemas import (
    ClientCreate, ClientUpdate, ClientResponse, MessageResponse,
    PaginatedResponse
)
from app.application.services.client_service import ClientService

router = APIRouter()


@router.get("/", response_model=dict)
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all clients with pagination and filtering."""
    service = ClientService(db)
    
    filters = {}
    if is_active is not None:
        filters["is_active"] = is_active
    
    clients, total = service.get_many_with_count(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return {
        "items": clients,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=ClientResponse)
async def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new client."""
    service = ClientService(db)
    client = service.create(client_in)
    return service.get_with_project_count(client.id)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get a client by ID."""
    service = ClientService(db)
    client = service.get_with_project_count(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update a client."""
    service = ClientService(db)
    client = service.get_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    updated = service.update(client, client_in)
    return service.get_with_project_count(updated.id)


@router.delete("/{client_id}", response_model=MessageResponse)
async def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete a client."""
    service = ClientService(db)
    if not service.delete(client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted successfully"}
