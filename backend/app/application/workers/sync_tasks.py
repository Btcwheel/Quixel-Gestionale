"""Celery worker for async tasks (sync, alerts, etc.)."""

from celery import Celery
from datetime import datetime
from sqlmodel import Session, select, cast, String

from app.core.config import settings
from app.infrastructure.database.session import SessionLocal
from app.domain.models import ExternalResource, SyncLog, AIAccount, Alert
from app.domain.enums import SyncStatus, WebhookProvider, AlertType, AlertSeverity
from app.infrastructure.external.github import GitHubClient
from app.infrastructure.external.supabase import SupabaseClient
from app.infrastructure.external.vercel import VercelClient
from app.infrastructure.security.auth import decrypt_secret

# Celery app
celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.application.workers.sync_tasks",
    ]
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)


# ============================================
# Sync Tasks
# ============================================

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def sync_github_resource(self, resource_id: str):
    """Sync a GitHub repository resource."""
    db = SessionLocal()
    try:
        from app.domain.models import ExternalResource
        resource = db.get(ExternalResource, resource_id)
        if not resource:
            return {"status": "error", "message": "Resource not found"}
        
        # Create sync log
        sync_log = SyncLog(
            resource_id=resource_id,
            provider=WebhookProvider.GITHUB,
            status=SyncStatus.IN_PROGRESS,
            action="sync",
            triggered_by="scheduled",
            started_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()
        
        # Get GitHub token from API keys
        from app.domain.models import APIKey
        api_key = db.exec(
            select(APIKey).where(APIKey.provider == "github", APIKey.is_active == True)
        ).first()
        
        if not api_key:
            raise Exception("No GitHub API key found")
        
        client = GitHubClient(decrypt_secret(api_key.key_encrypted))
        result = client.sync_repository(resource)
        
        # Update sync log
        sync_log.status = SyncStatus.SUCCESS
        sync_log.completed_at = datetime.utcnow()
        sync_log.duration_seconds = int((sync_log.completed_at - sync_log.started_at).total_seconds())
        sync_log.extra_metadata = result

        # Update resource
        resource.last_sync_at = datetime.utcnow()
        resource.last_sync_status = SyncStatus.SUCCESS

        db.commit()
        return {"status": "success", "result": result}

    except Exception as exc:
        # Update sync log with error
        sync_log.status = SyncStatus.FAILED
        sync_log.completed_at = datetime.utcnow()
        sync_log.duration_seconds = int((sync_log.completed_at - sync_log.started_at).total_seconds())
        sync_log.error_message = str(exc)
        db.commit()

        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def sync_supabase_resource(self, resource_id: str):
    """Sync a Supabase project resource."""
    db = SessionLocal()
    try:
        from app.domain.models import ExternalResource, APIKey
        resource = db.get(ExternalResource, resource_id)
        if not resource:
            return {"status": "error", "message": "Resource not found"}

        # Create sync log
        sync_log = SyncLog(
            resource_id=resource_id,
            provider=WebhookProvider.SUPABASE,
            status=SyncStatus.IN_PROGRESS,
            action="sync",
            triggered_by="scheduled",
            started_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()

        # Get Supabase token
        api_key = db.exec(
            select(APIKey).where(APIKey.provider == "supabase", APIKey.is_active == True)
        ).first()

        if not api_key:
            raise Exception("No Supabase API key found")

        client = SupabaseClient(decrypt_secret(api_key.key_encrypted))
        result = client.sync_project(resource)

        # Update sync log
        sync_log.status = SyncStatus.SUCCESS
        sync_log.completed_at = datetime.utcnow()
        sync_log.duration_seconds = int((sync_log.completed_at - sync_log.started_at).total_seconds())
        sync_log.extra_metadata = result

        # Update resource
        resource.last_sync_at = datetime.utcnow()
        resource.last_sync_status = SyncStatus.SUCCESS

        db.commit()
        return {"status": "success", "result": result}

    except Exception as exc:
        sync_log.status = SyncStatus.FAILED
        sync_log.completed_at = datetime.utcnow()
        sync_log.duration_seconds = int((sync_log.completed_at - sync_log.started_at).total_seconds())
        sync_log.error_message = str(exc)
        db.commit()
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def sync_vercel_resource(self, resource_id: str):
    """Sync a Vercel deployment resource."""
    db = SessionLocal()
    try:
        from app.domain.models import ExternalResource, APIKey
        resource = db.get(ExternalResource, resource_id)
        if not resource:
            return {"status": "error", "message": "Resource not found"}

        # Create sync log
        sync_log = SyncLog(
            resource_id=resource_id,
            provider=WebhookProvider.VERCEL,
            status=SyncStatus.IN_PROGRESS,
            action="sync",
            triggered_by="scheduled",
            started_at=datetime.utcnow()
        )
        db.add(sync_log)
        db.commit()

        # Get Vercel token
        api_key = db.exec(
            select(APIKey).where(APIKey.provider == "vercel", APIKey.is_active == True)
        ).first()

        if not api_key:
            raise Exception("No Vercel API key found")

        client = VercelClient(decrypt_secret(api_key.key_encrypted))
        result = client.sync_deployment(resource)

        # Update sync log
        sync_log.status = SyncStatus.SUCCESS
        sync_log.completed_at = datetime.utcnow()
        sync_log.duration_seconds = int((sync_log.completed_at - sync_log.started_at).total_seconds())
        sync_log.extra_metadata = result
        
        # Update resource
        resource.last_sync_at = datetime.utcnow()
        resource.last_sync_status = SyncStatus.SUCCESS

        db.commit()
        return {"status": "success", "result": result}

    except Exception as exc:
        sync_log.status = SyncStatus.FAILED
        sync_log.completed_at = datetime.utcnow()
        sync_log.duration_seconds = int((sync_log.completed_at - sync_log.started_at).total_seconds())
        sync_log.error_message = str(exc)
        db.commit()
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    finally:
        db.close()


# ============================================
# Alert Tasks
# ============================================

@celery_app.task
def check_ai_credits_alerts():
    """Check all AI accounts for low credits and create alerts."""
    db = SessionLocal()
    try:
        accounts = db.exec(select(AIAccount).where(AIAccount.is_active == True)).all()

        for account in accounts:
            if account.total_credits > 0:
                remaining_percent = (account.remaining_credits / account.total_credits) * 100

                if remaining_percent <= 10:  # Critical threshold
                    # Check for existing unresolved alert
                    existing_alert = db.exec(
                        select(Alert).where(
                            Alert.alert_type == AlertType.CREDIT_LOW,
                            Alert.extra_metadata["account_id"].cast(String) == account.id,
                            Alert.is_resolved == False
                        )
                    ).first()
                    if not existing_alert:
                        alert = Alert(
                            alert_type=AlertType.CREDIT_LOW,
                            severity=AlertSeverity.CRITICAL,
                            title=f"CRITICAL: {account.account_name} credits at {remaining_percent:.1f}%",
                            message=f"Account {account.account_name} has only {account.remaining_credits:.2f} credits remaining ({remaining_percent:.1f}%)",
                            extra_metadata={
                                "account_id": account.id,
                                "remaining_percent": remaining_percent
                            }
                        )
                        db.add(alert)
                elif remaining_percent <= 20:  # Warning threshold
                    # Check for existing unresolved alert
                    existing_alert = db.exec(
                        select(Alert).where(
                            Alert.alert_type == AlertType.CREDIT_LOW,
                            Alert.extra_metadata["account_id"].cast(String) == account.id,
                            Alert.is_resolved == False
                        )
                    ).first()
                    if not existing_alert:
                        alert = Alert(
                            alert_type=AlertType.CREDIT_LOW,
                            severity=AlertSeverity.HIGH,
                            title=f"WARNING: {account.account_name} credits at {remaining_percent:.1f}%",
                            message=f"Account {account.account_name} has {account.remaining_credits:.2f} credits remaining ({remaining_percent:.1f}%)",
                            extra_metadata={
                                "account_id": account.id,
                                "remaining_percent": remaining_percent
                            }
                        )
                        db.add(alert)

        db.commit()
        return {"status": "success", "checked": len(accounts)}

    except Exception as exc:
        return {"status": "error", "message": str(exc)}
    finally:
        db.close()


@celery_app.task
def sync_all_github_resources():
    """Sync all GitHub resources."""
    db = SessionLocal()
    try:
        resources = db.exec(
            select(ExternalResource).where(
                ExternalResource.resource_type == "github_repo",
                ExternalResource.is_active == True
            )
        ).all()
        
        for resource in resources:
            sync_github_resource.delay(resource.id)
        
        return {"status": "success", "queued": len(resources)}
    finally:
        db.close()


@celery_app.task
def sync_all_supabase_resources():
    """Sync all Supabase resources."""
    db = SessionLocal()
    try:
        resources = db.exec(
            select(ExternalResource).where(
                ExternalResource.resource_type == "supabase_project",
                ExternalResource.is_active == True
            )
        ).all()
        
        for resource in resources:
            sync_supabase_resource.delay(resource.id)
        
        return {"status": "success", "queued": len(resources)}
    finally:
        db.close()


@celery_app.task
def sync_all_vercel_resources():
    """Sync all Vercel resources."""
    db = SessionLocal()
    try:
        resources = db.exec(
            select(ExternalResource).where(
                ExternalResource.resource_type == "vercel_deployment",
                ExternalResource.is_active == True
            )
        ).all()
        
        for resource in resources:
            sync_vercel_resource.delay(resource.id)
        
        return {"status": "success", "queued": len(resources)}
    finally:
        db.close()
