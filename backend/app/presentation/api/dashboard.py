"""Dashboard API routes - aggregated statistics and analytics."""

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func
from datetime import datetime, timedelta

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import (
    Client, Project, AIAccount, ChatLog, ExternalResource,
    SyncLog, Alert, AdminUser
)
from app.domain.enums import ProjectStatus, SyncStatus

router = APIRouter()


@router.get("/stats", response_model=dict)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Client stats
    total_clients = db.exec(select(func.count(Client.id))).one()
    active_clients = db.exec(
        select(func.count(Client.id)).where(Client.is_active == True)
    ).one()
    
    # Project stats
    total_projects = db.exec(select(func.count(Project.id))).one()
    active_projects = db.exec(
        select(func.count(Project.id)).where(Project.status == ProjectStatus.ACTIVE)
    ).one()
    
    # AI account stats
    ai_accounts_active = db.exec(
        select(func.count(AIAccount.id)).where(AIAccount.is_active == True)
    ).one()
    
    total_ai_credits = db.exec(
        select(func.sum(AIAccount.remaining_credits)).where(AIAccount.is_active == True)
    ).one() or 0.0
    
    # Chat stats
    chats_today = db.exec(
        select(func.count(ChatLog.id)).where(ChatLog.created_at >= today_start)
    ).one()
    
    # Deployment stats (from external resources)
    deployments_today = db.exec(
        select(func.count(ExternalResource.id)).where(
            ExternalResource.resource_type == "vercel_deployment",
            ExternalResource.last_sync_at >= today_start
        )
    ).one()
    
    # Unresolved alerts
    unresolved_alerts = db.exec(
        select(func.count(Alert.id)).where(Alert.is_resolved == False)
    ).one()
    
    # Recent sync status (last 10)
    recent_sync = db.exec(
        select(SyncLog)
        .order_by(SyncLog.started_at.desc())
        .limit(10)
    ).all()
    
    return {
        "total_clients": total_clients,
        "active_clients": active_clients,
        "total_projects": total_projects,
        "active_projects": active_projects,
        "ai_accounts_active": ai_accounts_active,
        "total_ai_credits_remaining": float(total_ai_credits),
        "total_chats_today": chats_today,
        "total_deployments_today": deployments_today,
        "unresolved_alerts": unresolved_alerts,
        "recent_sync_status": [log.model_dump() for log in recent_sync]
    }


@router.get("/projects-by-status", response_model=dict)
async def get_projects_by_status(
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get project counts grouped by status."""
    projects = db.exec(select(Project)).all()
    
    status_counts = {}
    for project in projects:
        status = project.status.value if hasattr(project.status, 'value') else str(project.status)
        status_counts[status] = status_counts.get(status, 0) + 1
    
    return status_counts


@router.get("/ai-usage-by-provider", response_model=dict)
async def get_ai_usage_by_provider(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get AI usage aggregated by provider."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    accounts = db.exec(select(AIAccount)).all()
    
    provider_stats = {}
    for account in accounts:
        provider = account.provider.value if hasattr(account.provider, 'value') else str(account.provider)
        if provider not in provider_stats:
            provider_stats[provider] = {
                "total_requests": 0,
                "total_tokens_in": 0,
                "total_tokens_out": 0,
                "total_credits_used": 0.0,
                "account_count": 0
            }
        
        provider_stats[provider]["total_requests"] += account.total_requests
        provider_stats[provider]["total_tokens_in"] += account.total_tokens_in
        provider_stats[provider]["total_tokens_out"] += account.total_tokens_out
        provider_stats[provider]["total_credits_used"] += account.used_credits
        provider_stats[provider]["account_count"] += 1
    
    return provider_stats


@router.get("/recent-activity", response_model=dict)
async def get_recent_activity(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get recent activity across all entities."""
    # Recent projects
    recent_projects = db.exec(
        select(Project).order_by(Project.created_at.desc()).limit(limit // 3)
    ).all()
    
    # Recent chats
    recent_chats = db.exec(
        select(ChatLog).order_by(ChatLog.created_at.desc()).limit(limit // 3)
    ).all()
    
    # Recent syncs
    recent_syncs = db.exec(
        select(SyncLog).order_by(SyncLog.started_at.desc()).limit(limit // 3)
    ).all()
    
    return {
        "projects": [p.model_dump() for p in recent_projects],
        "chats": [c.model_dump() for c in recent_chats],
        "syncs": [s.model_dump() for s in recent_syncs]
    }
