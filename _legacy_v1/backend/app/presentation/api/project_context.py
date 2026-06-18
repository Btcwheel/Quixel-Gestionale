"""Project context and plan management API routes."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import AdminUser, Project, ProjectPlan, ProjectDiscussion, ChatLog
from app.domain.schemas import (
    ProjectPlanGenerateRequest, ProjectPlanUpdateRequest, ProjectPlanResponse,
    ProjectContextResponse, MessageResponse
)
from app.application.services.plan_aggregator import PlanAggregatorService
from app.application.services.context_service import ContextService
from app.application.services.obsidian_service import ObsidianService


router = APIRouter(prefix="/projects/{project_id}", tags=["project-context"])


@router.post("/plan/generate", response_model=ProjectPlanResponse)
async def generate_project_plan(
    project_id: str,
    plan_request: ProjectPlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Generate a project plan from discussions and/or chats."""
    # Verify project exists and user has access
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Generate plan using service
    plan_service = PlanAggregatorService(db)
    
    if plan_request.discussion_ids or plan_request.chat_ids:
        # Generate from specific discussions/chats
        if plan_request.discussion_ids:
            plan = plan_service.aggregate_discussions(
                project_id=project_id,
                discussion_ids=plan_request.discussion_ids,
                title=plan_request.title
            )
        else:
            plan = plan_service.aggregate_chats(
                project_id=project_id,
                chat_ids=plan_request.chat_ids,
                title=plan_request.title
            )
    else:
        # Generate from all discussions
        plan = plan_service.aggregate_discussions(
            project_id=project_id,
            title=plan_request.title
        )
    
    return plan


@router.get("/plan", response_model=List[ProjectPlanResponse])
async def list_project_plans(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all plans for a project."""
    # Verify project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    plans = db.exec(
        select(ProjectPlan)
        .where(ProjectPlan.project_id == project_id)
        .order_by(ProjectPlan.created_at.desc())
    ).all()
    
    return plans


@router.get("/plan/{plan_id}", response_model=ProjectPlanResponse)
async def get_project_plan(
    project_id: str,
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get a specific project plan by ID."""
    # Verify project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    plan = db.get(ProjectPlan, plan_id)
    if not plan or plan.project_id != project_id:
        raise HTTPException(status_code=404, detail="Project plan not found")
    
    return plan


@router.put("/plan/{plan_id}", response_model=ProjectPlanResponse)
async def update_project_plan(
    project_id: str,
    plan_id: str,
    plan_update: ProjectPlanUpdateRequest,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update a project plan."""
    # Verify project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    plan = db.get(ProjectPlan, plan_id)
    if not plan or plan.project_id != project_id:
        raise HTTPException(status_code=404, detail="Project plan not found")
    
    # Update plan
    update_data = plan_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plan, key, value)
    
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return plan


@router.post("/plan/{plan_id}/approve", response_model=ProjectPlanResponse)
async def approve_project_plan(
    project_id: str,
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Approve a project plan."""
    # Verify project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    plan = db.get(ProjectPlan, plan_id)
    if not plan or plan.project_id != project_id:
        raise HTTPException(status_code=404, detail="Project plan not found")
    
    # Approve plan
    plan.status = "approved"
    plan.approved_at = datetime.now(timezone.utc)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return plan


@router.post("/plan/{plan_id}/archive", response_model=ProjectPlanResponse)
async def archive_project_plan(
    project_id: str,
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Archive a project plan."""
    # Verify project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    plan = db.get(ProjectPlan, plan_id)
    if not plan or plan.project_id != project_id:
        raise HTTPException(status_code=404, detail="Project plan not found")
    
    # Archive plan
    plan.status = "archived"
    db.add(plan)
    db.commit()
    db.refresh(plan)
    
    return plan


@router.get("/context", response_model=ProjectContextResponse)
async def get_project_context(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get comprehensive project context for recovery."""
    # Verify project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get context using service
    context_service = ContextService(db)
    context = context_service.get_project_context(project_id)
    
    return context


@router.get("/context/llm", response_model=dict)
async def get_project_context_for_llm(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get project context formatted for LLM consumption."""
    # Verify project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get context using service
    context_service = ContextService(db)
    context_text = context_service.format_context_for_llm(project_id)
    
    return {"context": context_text}


@router.post("/obsidian/sync", response_model=MessageResponse)
async def sync_to_obsidian(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Sync project data to Obsidian vault."""
    # Verify project exists
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Sync to Obsidian
    obsidian_service = ObsidianService()
    success = obsidian_service.sync_project_to_obsidian(project)
    
    if success:
        return {"message": "Project synced to Obsidian successfully"}
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to sync project to Obsidian"
        )


# Import datetime at the top
from datetime import datetime, timezone