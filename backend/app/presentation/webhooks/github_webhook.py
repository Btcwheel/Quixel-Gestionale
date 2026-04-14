"""GitHub webhook receiver."""

from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlmodel import Session
from datetime import datetime

from app.infrastructure.database.session import get_db
from app.domain.models import WebhookEvent, ExternalResource, SyncLog
from app.domain.enums import WebhookProvider, SyncStatus
from app.infrastructure.external.github import GitHubClient

router = APIRouter()


@router.post("/")
async def github_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive GitHub webhook events."""
    # Get payload
    body = await request.body()
    event_type = request.headers.get("X-GitHub-Event", "unknown")
    signature = request.headers.get("X-Hub-Signature-256", "")
    
    # Verify signature
    github_client = GitHubClient("")  # Token not needed for verification
    if not github_client.verify_webhook_signature(body, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )
    
    # Parse payload
    import json
    payload = json.loads(body)
    
    # Store webhook event
    webhook_event = WebhookEvent(
        provider=WebhookProvider.GITHUB,
        event_type=event_type,
        external_id=payload.get("repository", {}).get("id", "unknown"),
        payload=payload,
        signature=signature,
        is_verified=True
    )
    db.add(webhook_event)
    db.commit()
    
    # Process event based on type
    if event_type == "push":
        await process_push_event(payload, db)
    elif event_type == "pull_request":
        await process_pr_event(payload, db)
    
    return {"status": "ok", "event": event_type}


async def process_push_event(payload: dict, db: Session):
    """Process GitHub push webhook event."""
    repo_full_name = payload.get("repository", {}).get("full_name")
    if not repo_full_name:
        return

    # Find matching external resource
    from sqlmodel import select
    resource = db.exec(
        select(ExternalResource).where(
            ExternalResource.github_full_name == repo_full_name
        )
    ).first()

    if not resource:
        return

    # Create sync log
    sync_log = SyncLog(
        resource_id=resource.id,
        provider=WebhookProvider.GITHUB,
        status=SyncStatus.SUCCESS,
        action="push",
        triggered_by="webhook",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        extra_metadata={
            "ref": payload.get("ref"),
            "commits": len(payload.get("commits", [])),
            "pusher": payload.get("pusher", {}).get("name")
        }
    )
    db.add(sync_log)

    # Update resource last_sync
    resource.last_sync_at = datetime.utcnow()
    resource.last_sync_status = SyncStatus.SUCCESS

    db.add(resource)
    db.commit()


async def process_pr_event(payload: dict, db: Session):
    """Process GitHub pull request webhook event."""
    from sqlmodel import select

    repo_full_name = payload.get("repository", {}).get("full_name")
    if not repo_full_name:
        return

    action = payload.get("action")
    pr_number = payload.get("pull_request", {}).get("number")
    pr_title = payload.get("pull_request", {}).get("title")

    # Find matching external resource
    resource = db.exec(
        select(ExternalResource).where(
            ExternalResource.github_full_name == repo_full_name
        )
    ).first()

    if not resource:
        return

    # Create sync log for PR event
    sync_log = SyncLog(
        resource_id=resource.id,
        provider=WebhookProvider.GITHUB,
        status=SyncStatus.SUCCESS,
        action=f"pr_{action}",
        triggered_by="webhook",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        extra_metadata={
            "pr_number": pr_number,
            "pr_title": pr_title,
            "action": action,
        }
    )
    db.add(sync_log)
    db.commit()
