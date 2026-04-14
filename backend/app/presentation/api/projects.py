"""Projects API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import Project, AdminUser
from app.domain.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, MessageResponse,
    ProjectAnalytics
)
from app.application.services.project_service import ProjectService

router = APIRouter()


@router.get("/", response_model=dict)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    client_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all projects with pagination and filtering."""
    service = ProjectService(db)
    
    filters = {}
    if client_id:
        filters["client_id"] = client_id
    if status:
        filters["status"] = status
    
    projects, total = service.get_many(
        page=page,
        page_size=page_size,
        filters=filters if filters else None,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    # Enrich with client names and resource counts
    result = []
    for project in projects:
        details = service.get_with_details(project.id)
        result.append(details or project.model_dump())
    
    return {
        "items": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new project."""
    service = ProjectService(db)
    project = service.create(project_in)
    return service.get_with_details(project.id) or project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get a project by ID."""
    service = ProjectService(db)
    project = service.get_with_details(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update a project."""
    service = ProjectService(db)
    project = service.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updated = service.update(project, project_in)
    return service.get_with_details(updated.id) or updated


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete a project."""
    service = ProjectService(db)
    if not service.delete(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/analytics", response_model=ProjectAnalytics)
async def get_project_analytics(
    project_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get project analytics."""
    service = ProjectService(db)
    analytics = service.get_analytics(project_id, days=days)
    if not analytics:
        raise HTTPException(status_code=404, detail="Project not found")
    return analytics
