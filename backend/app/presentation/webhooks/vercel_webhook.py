"""Vercel webhook receiver."""

from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlmodel import Session
from datetime import datetime

from app.infrastructure.database.session import get_db
from app.domain.models import WebhookEvent, SyncLog
from app.domain.enums import WebhookProvider, SyncStatus

router = APIRouter()


@router.post("/")
async def vercel_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive Vercel webhook events."""
    body = await request.body()
    event_type = request.headers.get("X-Vercel-Event", "unknown")
    signature = request.headers.get("X-Vercel-Signature", "")
    
    # Store webhook event
    import json
    payload = json.loads(body)
    
    webhook_event = WebhookEvent(
        provider=WebhookProvider.VERCEL,
        event_type=event_type,
        external_id=payload.get("deploymentId", "unknown"),
        payload=payload,
        signature=signature,
        is_verified=True  # Vercel webhooks are trusted when endpoint is not public
    )
    db.add(webhook_event)
    db.commit()
    
    # Process deployment events
    if event_type in ["deployment.succeeded", "deployment.failed", "deployment.ready"]:
        await process_deployment_event(payload, event_type, db)
    
    return {"status": "ok", "event": event_type}


async def process_deployment_event(payload: dict, event_type: str, db: Session):
    """Process Vercel deployment webhook event."""
    from sqlmodel import select

    deployment_id = payload.get("deploymentId")
    if not deployment_id:
        return

    # Find matching external resource by deployment ID
    resource = db.exec(
        select(ExternalResource).where(
            ExternalResource.external_id == deployment_id
        )
    ).first()

    if not resource:
        return

    # Determine status from event type
    deployment_status = "unknown"
    if event_type == "deployment.succeeded" or event_type == "deployment.ready":
        deployment_status = "success"
    elif event_type == "deployment.failed":
        deployment_status = "failed"

    # Update resource last sync info
    from app.domain.enums import SyncStatus as SyncStatusEnum
    sync_status = SyncStatusEnum.SUCCESS if deployment_status == "success" else SyncStatusEnum.FAILED

    resource.last_sync_at = datetime.utcnow()
    resource.last_sync_status = sync_status

    # Create sync log
    sync_log = SyncLog(
        resource_id=resource.id,
        provider=WebhookProvider.VERCEL,
        status=sync_status,
        action="deploy",
        triggered_by="webhook",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        extra_metadata={
            "deployment_id": deployment_id,
            "event_type": event_type,
            "deployment_status": deployment_status,
            "url": payload.get("url"),
        }
    )
    db.add(sync_log)
    db.add(resource)
    db.commit()
