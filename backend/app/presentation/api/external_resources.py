"""External Resources API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import ExternalResource, SyncLog, AdminUser
from app.domain.schemas import (
    ExternalResourceCreate, ExternalResourceUpdate, ExternalResourceResponse,
    MessageResponse, SyncLogResponse, SyncTriggerRequest
)
from app.domain.enums import ExternalResourceType, SyncStatus

router = APIRouter()


@router.get("/", response_model=dict)
async def list_external_resources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    project_id: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all external resources with pagination and filtering."""
    query = select(ExternalResource)
    count_query = select(ExternalResource.id)

    # Apply filters
    if project_id:
        query = query.where(ExternalResource.project_id == project_id)
        count_query = count_query.where(ExternalResource.project_id == project_id)
    if resource_type:
        query = query.where(ExternalResource.resource_type == resource_type)
        count_query = count_query.where(ExternalResource.resource_type == resource_type)
    if is_active is not None:
        query = query.where(ExternalResource.is_active == is_active)
        count_query = count_query.where(ExternalResource.is_active == is_active)

    # Get total count
    total = db.exec(count_query).count()

    # Apply sorting
    if sort_by and hasattr(ExternalResource, sort_by):
        column = getattr(ExternalResource, sort_by)
        query = query.order_by(column.desc() if sort_order == "desc" else column.asc())

    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)

    resources = list(db.exec(query).all())

    return {
        "items": [resource.model_dump() for resource in resources],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=ExternalResourceResponse)
async def create_external_resource(
    resource_in: ExternalResourceCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new external resource."""
    resource = ExternalResource.model_validate(resource_in)
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.get("/{resource_id}", response_model=ExternalResourceResponse)
async def get_external_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get an external resource by ID."""
    resource = db.get(ExternalResource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="External resource not found")
    return resource


@router.put("/{resource_id}", response_model=ExternalResourceResponse)
async def update_external_resource(
    resource_id: str,
    resource_in: ExternalResourceUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update an external resource."""
    resource = db.get(ExternalResource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="External resource not found")

    obj_data = resource_in.model_dump(exclude_unset=True)
    for key, value in obj_data.items():
        setattr(resource, key, value)

    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.delete("/{resource_id}", response_model=MessageResponse)
async def delete_external_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete an external resource (soft delete)."""
    resource = db.get(ExternalResource, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="External resource not found")
    resource.is_active = False
    db.add(resource)
    db.commit()
    return {"message": "External resource deleted successfully"}


@router.post("/sync", response_model=MessageResponse)
async def trigger_sync(
    sync_request: SyncTriggerRequest,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Trigger manual sync for resource(s)."""
    from app.application.workers.sync_tasks import (
        sync_github_resource,
        sync_supabase_resource,
        sync_vercel_resource,
    )

    if sync_request.resource_id:
        # Sync a specific resource
        resource = db.get(ExternalResource, sync_request.resource_id)
        if not resource:
            raise HTTPException(status_code=404, detail="External resource not found")
        if not resource.is_active:
            raise HTTPException(status_code=400, detail="Resource is not active")

        # Route to the correct sync task based on resource type
        resource_type = resource.resource_type.value if hasattr(resource.resource_type, 'value') else resource.resource_type
        if resource_type == "github_repo":
            sync_github_resource.delay(resource.id)
        elif resource_type == "supabase_project":
            sync_supabase_resource.delay(resource.id)
        elif resource_type == "vercel_deployment":
            sync_vercel_resource.delay(resource.id)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported resource type: {resource_type}")

        return {"message": f"Sync task queued for resource {resource.id}"}

    # Sync all resources of a given type
    sync_type = sync_request.type or "all"
    queued = 0

    if sync_type in ("all", "github"):
        from app.application.workers.sync_tasks import sync_all_github_resources
        sync_all_github_resources.delay()
        queued += 1

    if sync_type in ("all", "supabase"):
        from app.application.workers.sync_tasks import sync_all_supabase_resources
        sync_all_supabase_resources.delay()
        queued += 1

    if sync_type in ("all", "vercel"):
        from app.application.workers.sync_tasks import sync_all_vercel_resources
        sync_all_vercel_resources.delay()
        queued += 1

    return {"message": f"{queued} sync task(s) queued"}


@router.get("/{resource_id}/sync-logs", response_model=dict)
async def get_resource_sync_logs(
    resource_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get sync logs for a resource."""
    query = select(SyncLog).where(SyncLog.resource_id == resource_id)
    count_query = select(SyncLog.id).where(SyncLog.resource_id == resource_id)

    total = db.exec(count_query).count()

    skip = (page - 1) * page_size
    query = query.order_by(SyncLog.started_at.desc()).offset(skip).limit(page_size)

    logs = list(db.exec(query).all())

    return {
        "items": [log.model_dump() for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
