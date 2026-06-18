"""Clients API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from sqlalchemy import or_

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import Client, Project, AdminUser
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
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all clients with pagination and filtering."""
    query = select(Client)
    count_query = select(func.count()).select_from(Client)

    if is_active is not None:
        query = query.where(Client.is_active == is_active)
        count_query = count_query.where(Client.is_active == is_active)

    if search:
        like = f"%{search}%"
        search_filter = or_(Client.name.ilike(like), Client.email.ilike(like), Client.website.ilike(like))
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = db.exec(count_query).one()

    if sort_by and hasattr(Client, sort_by):
        column = getattr(Client, sort_by)
        query = query.order_by(column.desc() if sort_order == "desc" else column.asc())

    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)
    clients = list(db.exec(query).all())

    service = ClientService(db)
    result = []
    for client in clients:
        project_count = db.exec(select(func.count()).select_from(Project).where(Project.client_id == client.id)).one()
        result.append({**client.model_dump(), "project_count": project_count})

    return {
        "items": result,
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
