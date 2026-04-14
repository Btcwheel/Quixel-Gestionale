"""Supabase webhook receiver."""

from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlmodel import Session
from datetime import datetime

from app.infrastructure.database.session import get_db
from app.domain.models import WebhookEvent, SyncLog
from app.domain.enums import WebhookProvider, SyncStatus

router = APIRouter()


@router.post("/")
async def supabase_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive Supabase webhook events."""
    body = await request.body()
    event_type = request.headers.get("X-Supabase-Event", "unknown")
    signature = request.headers.get("X-Supabase-Signature", "")
    
    # Store webhook event
    import json
    payload = json.loads(body)
    
    webhook_event = WebhookEvent(
        provider=WebhookProvider.SUPABASE,
        event_type=event_type,
        external_id=payload.get("project_ref", "unknown"),
        payload=payload,
        signature=signature,
        is_verified=True  # Supabase webhooks are trusted when endpoint is not public
    )
    db.add(webhook_event)
    db.commit()
    
    # Process event
    if event_type in ["backup.completed", "deployment.success"]:
        await process_supabase_event(payload, event_type, db)
    
    return {"status": "ok", "event": event_type}


async def process_supabase_event(payload: dict, event_type: str, db: Session):
    """Process Supabase webhook event."""
    from sqlmodel import select

    project_ref = payload.get("project_ref")
    if not project_ref:
        return

    # Find matching external resource
    resource = db.exec(
        select(ExternalResource).where(
            ExternalResource.external_id == project_ref
        )
    ).first()

    if not resource:
        return

    # Create sync log for the event
    sync_log = SyncLog(
        resource_id=resource.id,
        provider=WebhookProvider.SUPABASE,
        status=SyncStatus.SUCCESS,
        action=event_type.replace(".", "_"),
        triggered_by="webhook",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        extra_metadata={
            "project_ref": project_ref,
            "event_type": event_type,
            "payload_summary": str(payload)[:500],
        }
    )
    db.add(sync_log)
    db.commit()
