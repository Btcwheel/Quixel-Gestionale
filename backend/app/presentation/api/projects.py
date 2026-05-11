"""Projects API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from sqlalchemy import or_

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import Project, AdminUser
from app.domain.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, MessageResponse,
    ProjectAnalytics
)
from app.domain.enums import ProjectStatus
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
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all projects with pagination and filtering."""
    query = select(Project)
    count_query = select(func.count()).select_from(Project)

    if client_id:
        query = query.where(Project.client_id == client_id)
        count_query = count_query.where(Project.client_id == client_id)
    if status:
        try:
            status_enum = ProjectStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid project status: {status}")
        query = query.where(Project.status == status_enum)
        count_query = count_query.where(Project.status == status_enum)
    if search:
        like = f"%{search}%"
        search_filter = or_(Project.name.ilike(like), Project.description.ilike(like))
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = db.exec(count_query).one()

    if sort_by and hasattr(Project, sort_by):
        column = getattr(Project, sort_by)
        query = query.order_by(column.desc() if sort_order == "desc" else column.asc())

    skip = (page - 1) * page_size
    projects = list(db.exec(query.offset(skip).limit(page_size)).all())

    service = ProjectService(db)
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
