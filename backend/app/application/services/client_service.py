"""Client service for business logic."""

from typing import Optional, List
from sqlmodel import Session, select, func

from app.application.services.base import BaseService
from app.domain.models import (
    Client,
    Project,
    ExternalResource,
    SyncLog,
    Alert,
    ProjectDocument,
    ProjectAIPoolAssignment,
    ChatLog,
)
from app.domain.schemas import ClientCreate, ClientUpdate, ClientResponse


class ClientService(BaseService[Client, ClientCreate, ClientUpdate]):
    """Service for Client operations."""
    
    def __init__(self, db: Session):
        super().__init__(Client, db)
    
    def create(self, obj_in: ClientCreate) -> Client:
        """Create a new client."""
        return super().create(obj_in)
    
    def get_with_project_count(self, id: str) -> Optional[dict]:
        """Get client with project count."""
        client = self.get_by_id(id)
        if not client:
            return None
        
        project_count = self.db.exec(
            select(func.count(Project.id)).where(Project.client_id == id)
        ).one()
        
        return {
            **client.model_dump(),
            "project_count": project_count
        }
    
    def get_many_with_count(
        self,
        page: int = 1,
        page_size: int = 20,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> tuple[List[dict], int]:
        """Get clients with project counts."""
        clients, total = self.get_many(page, page_size, sort_by=sort_by, sort_order=sort_order)

        result = []
        for client in clients:
            project_count = self.db.exec(
                select(func.count(Project.id)).where(Project.client_id == client.id)
            ).one()
            result.append({
                **client.model_dump(),
                "project_count": project_count
            })

        return result, total

    def delete(self, id: str) -> bool:
        """Delete a client and all associated projects (cascade delete)."""
        client = self.get_by_id(id)
        if not client:
            return False

        # Delete all project-owned records explicitly to avoid FK issues.
        projects = self.db.exec(select(Project).where(Project.client_id == id)).all()
        for project in projects:
            project_resources = self.db.exec(
                select(ExternalResource).where(ExternalResource.project_id == project.id)
            ).all()
            for resource in project_resources:
                for sync_log in self.db.exec(
                    select(SyncLog).where(SyncLog.resource_id == resource.id)
                ).all():
                    self.db.delete(sync_log)
                self.db.delete(resource)

            for alert in self.db.exec(select(Alert).where(Alert.project_id == project.id)).all():
                self.db.delete(alert)

            for document in self.db.exec(select(ProjectDocument).where(ProjectDocument.project_id == project.id)).all():
                self.db.delete(document)

            for assignment in self.db.exec(
                select(ProjectAIPoolAssignment).where(ProjectAIPoolAssignment.project_id == project.id)
            ).all():
                self.db.delete(assignment)

            for chat_log in self.db.exec(select(ChatLog).where(ChatLog.project_id == project.id)).all():
                self.db.delete(chat_log)

            self.db.delete(project)
        
        # Now delete the client
        self.db.delete(client)
        self.db.commit()
        return True
