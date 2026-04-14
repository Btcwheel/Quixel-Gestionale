"""Alerts API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import Alert, AdminUser
from app.domain.schemas import (
    AlertCreate, AlertResponse, MessageResponse, AlertResolveUpdate
)

router = APIRouter()


@router.get("/", response_model=dict)
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    project_id: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all alerts with pagination and filtering."""
    query = select(Alert)
    count_query = select(Alert.id)
    
    # Apply filters
    if project_id:
        query = query.where(Alert.project_id == project_id)
        count_query = count_query.where(Alert.project_id == project_id)
    if alert_type:
        query = query.where(Alert.alert_type == alert_type)
        count_query = count_query.where(Alert.alert_type == alert_type)
    if severity:
        query = query.where(Alert.severity == severity)
        count_query = count_query.where(Alert.severity == severity)
    if is_resolved is not None:
        query = query.where(Alert.is_resolved == is_resolved)
        count_query = count_query.where(Alert.is_resolved == is_resolved)
    
    # Get total count
    total = db.exec(count_query).count()
    
    # Apply sorting
    if sort_by and hasattr(Alert, sort_by):
        column = getattr(Alert, sort_by)
        query = query.order_by(column.desc() if sort_order == "desc" else column.asc())
    
    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size)
    
    alerts = list(db.exec(query).all())
    
    return {
        "items": [alert.model_dump() for alert in alerts],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=AlertResponse)
async def create_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new alert."""
    alert = Alert.model_validate(alert_in)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get an alert by ID."""
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: str,
    resolve_data: AlertResolveUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Resolve an alert."""
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    from datetime import datetime
    alert.is_resolved = resolve_data.is_resolved
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = resolve_data.resolved_by or current_user.username
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", response_model=MessageResponse)
async def delete_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete an alert."""
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}
