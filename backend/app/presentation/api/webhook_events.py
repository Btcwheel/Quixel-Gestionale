"""Webhook Events audit API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import WebhookEvent, AdminUser

router = APIRouter()


@router.get("/", response_model=dict)
async def list_webhook_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    provider: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    verified: Optional[bool] = Query(None),
    processed: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List received webhook events for auditing."""
    query = select(WebhookEvent)
    count_query = select(WebhookEvent.id)

    if provider:
        query = query.where(WebhookEvent.provider == provider)
        count_query = count_query.where(WebhookEvent.provider == provider)
    if event_type:
        query = query.where(WebhookEvent.event_type == event_type)
        count_query = count_query.where(WebhookEvent.event_type == event_type)
    if verified is not None:
        query = query.where(WebhookEvent.is_verified == verified)
        count_query = count_query.where(WebhookEvent.is_verified == verified)
    if processed is not None:
        query = query.where(WebhookEvent.processed == processed)
        count_query = count_query.where(WebhookEvent.processed == processed)

    total = db.exec(count_query).count()

    skip = (page - 1) * page_size
    query = query.order_by(WebhookEvent.received_at.desc()).offset(skip).limit(page_size)

    events = list(db.exec(query).all())

    return {
        "items": [
            {
                "id": e.id,
                "provider": e.provider,
                "event_type": e.event_type,
                "external_id": e.external_id,
                "is_verified": e.is_verified,
                "processed": e.processed,
                "processed_at": e.processed_at.isoformat() if e.processed_at else None,
                "error_message": e.error_message,
                "received_at": e.received_at.isoformat(),
            }
            for e in events
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
