"""Service for project discussions."""

from typing import Optional, List
from sqlmodel import Session

from app.domain.models import ProjectDiscussion
from app.domain.schemas import (
    ProjectDiscussionCreate, ProjectDiscussionUpdate, DiscussionExtractRequest
)
from app.application.services.base import BaseService


class DiscussionService(BaseService[ProjectDiscussion, ProjectDiscussionCreate, ProjectDiscussionUpdate]):
    """Service for managing project discussions."""

    def get_by_project(
        self,
        project_id: str,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None
    ) -> tuple[List[ProjectDiscussion], int]:
        """Get discussions for a specific project."""
        filters = {"project_id": project_id}
        
        if search:
            filters["title"] = {"ilike": f"%{search}%"}
        
        return self.get_many(
            page=page,
            page_size=page_size,
            filters=filters,
            sort_by="created_at",
            sort_order="desc"
        )

    def search_in_project(
        self,
        project_id: str,
        query: str
    ) -> List[ProjectDiscussion]:
        """Search within a project's discussions."""
        from sqlmodel import or_, col
        
        return self.db.exec(
            or_(
                ProjectDiscussion.title.ilike(f"%{query}%"),
                ProjectDiscussion.insights.ilike(f"%{query}%"),
                ProjectDiscussion.code_snippets.ilike(f"%{query}%"),
                ProjectDiscussion.decisions.ilike(f"%{query}%"),
                ProjectDiscussion.action_items.ilike(f"%{query}%"),
            ),
            ProjectDiscussion.project_id == project_id
        ).all()