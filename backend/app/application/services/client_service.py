"""Client service for business logic."""

from typing import Optional, List
from sqlmodel import Session, select, func

from app.application.services.base import BaseService
from app.domain.models import Client, Project
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
