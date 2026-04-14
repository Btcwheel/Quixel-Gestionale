"""Project service for business logic."""

from typing import Optional, List
from datetime import datetime, timedelta
from sqlmodel import Session, select, func

from app.application.services.base import BaseService
from app.domain.models import Project, ExternalResource, AIAccount, ChatLog
from app.domain.schemas import ProjectCreate, ProjectUpdate


class ProjectService(BaseService[Project, ProjectCreate, ProjectUpdate]):
    """Service for Project operations."""
    
    def __init__(self, db: Session):
        super().__init__(Project, db)
    
    def create(self, obj_in: ProjectCreate) -> Project:
        """Create a new project."""
        return super().create(obj_in)
    
    def get_with_details(self, id: str) -> Optional[dict]:
        """Get project with related counts and details."""
        project = self.get_by_id(id)
        if not project:
            return None
        
        # Get external resource count
        resource_count = self.db.exec(
            select(func.count(ExternalResource.id)).where(
                ExternalResource.project_id == id,
                ExternalResource.is_active == True
            )
        ).one()
        
        # Get client name
        from app.domain.models import Client
        client = self.db.get(Client, project.client_id)
        
        return {
            **project.model_dump(),
            "client_name": client.name if client else None,
            "external_resource_count": resource_count
        }
    
    def get_analytics(self, id: str, days: int = 30) -> Optional[dict]:
        """Get project analytics for the last N days."""
        project = self.get_by_id(id)
        if not project:
            return None
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Chat statistics
        chat_count = self.db.exec(
            select(func.count(ChatLog.id)).where(
                ChatLog.project_id == id,
                ChatLog.created_at >= cutoff_date
            )
        ).one()
        
        total_tokens = self.db.exec(
            select(func.sum(ChatLog.tokens_used)).where(
                ChatLog.project_id == id,
                ChatLog.created_at >= cutoff_date
            )
        ).one() or 0
        
        total_cost = self.db.exec(
            select(func.sum(ChatLog.cost_credits)).where(
                ChatLog.project_id == id,
                ChatLog.created_at >= cutoff_date
            )
        ).one() or 0.0
        
        # Average rating
        avg_rating = self.db.exec(
            select(func.avg(ChatLog.rating)).where(
                ChatLog.project_id == id,
                ChatLog.rating.isnot(None),
                ChatLog.created_at >= cutoff_date
            )
        ).one()
        
        return {
            "project_id": id,
            "project_name": project.name,
            "period_days": days,
            "total_chats": chat_count,
            "total_tokens_used": total_tokens,
            "total_cost_credits": total_cost,
            "avg_chat_rating": float(avg_rating) if avg_rating else None,
            "github_activity_score": project.github_activity_score,
            "vercel_deploy_count": project.vercel_deploy_count,
            "last_sync_at": project.last_sync_at
        }
