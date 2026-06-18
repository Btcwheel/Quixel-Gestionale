"""Discussions API routes."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import ProjectDiscussion, Project
from app.domain.schemas import (
    ProjectDiscussionCreate, ProjectDiscussionUpdate, ProjectDiscussionResponse,
    DiscussionExtractRequest, DiscussionExtractResponse, MessageResponse,
    PaginatedResponse
)
from app.application.services.discussion_service import DiscussionService
from app.application.services.ai_extractor import extract_insights_from_discussion

router = APIRouter()


@router.get("/by-project/{project_id}", response_model=PaginatedResponse[ProjectDiscussionResponse])
async def list_project_discussions(
    project_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """List discussions for a specific project."""
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    service = DiscussionService(ProjectDiscussion, db)
    discussions, total = service.get_by_project(
        project_id=project_id,
        page=page,
        page_size=page_size,
        search=search
    )
    
    return {
        "items": [ProjectDiscussionResponse.model_validate(d) for d in discussions],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=ProjectDiscussionResponse)
async def create_discussion(
    discussion_in: ProjectDiscussionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Create a new discussion for a project."""
    project = db.get(Project, discussion_in.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    discussion = ProjectDiscussion(
        project_id=discussion_in.project_id,
        provider=discussion_in.provider,
        model_used=discussion_in.model_used,
        title=discussion_in.title,
        raw_content=discussion_in.raw_content,
        tags=discussion_in.tags
    )
    db.add(discussion)
    db.commit()
    db.refresh(discussion)
    
    return discussion


@router.post("/extract", response_model=DiscussionExtractResponse)
async def extract_discussion_insights(
    request: DiscussionExtractRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Extract insights from raw chat content."""
    result = await extract_insights_from_discussion(request.raw_content, request.provider)
    return result


@router.get("/{discussion_id}", response_model=ProjectDiscussionResponse)
async def get_discussion(
    discussion_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get a discussion by ID."""
    discussion = db.get(ProjectDiscussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    return discussion


@router.put("/{discussion_id}", response_model=ProjectDiscussionResponse)
async def update_discussion(
    discussion_id: str,
    discussion_in: ProjectDiscussionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Update a discussion."""
    discussion = db.get(ProjectDiscussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    if discussion_in.title is not None:
        discussion.title = discussion_in.title
    if discussion_in.insights is not None:
        discussion.insights = discussion_in.insights
    if discussion_in.code_snippets is not None:
        discussion.code_snippets = discussion_in.code_snippets
    if discussion_in.decisions is not None:
        discussion.decisions = discussion_in.decisions
    if discussion_in.action_items is not None:
        discussion.action_items = discussion_in.action_items
    if discussion_in.tags is not None:
        discussion.tags = discussion_in.tags
    
    db.add(discussion)
    db.commit()
    db.refresh(discussion)
    
    return discussion


@router.delete("/{discussion_id}", response_model=MessageResponse)
async def delete_discussion(
    discussion_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Delete a discussion."""
    discussion = db.get(ProjectDiscussion, discussion_id)
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")
    
    db.delete(discussion)
    db.commit()
    
    return {"message": "Discussion deleted successfully"}


@router.get("/by-project/{project_id}/search", response_model=List[ProjectDiscussionResponse])
async def search_discussions(
    project_id: str,
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Search within a project's discussions."""
    service = DiscussionService(ProjectDiscussion, db)
    results = service.search_in_project(project_id, q)
    return [ProjectDiscussionResponse.model_validate(d) for d in results]