"""Project Documents API routes."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.infrastructure.database.session import get_db
from app.infrastructure.security.dependencies import get_current_user
from app.domain.models import ProjectDocument, AdminUser
from app.domain.schemas import (
    ProjectDocumentCreate, ProjectDocumentUpdate, ProjectDocumentResponse, MessageResponse
)

router = APIRouter()


@router.get("/", response_model=dict)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    project_id: Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """List all project documents with pagination and filtering."""
    query = select(ProjectDocument)
    count_query = select(ProjectDocument.id)

    # Apply filters
    if project_id:
        query = query.where(ProjectDocument.project_id == project_id)
        count_query = count_query.where(ProjectDocument.project_id == project_id)
    if document_type:
        query = query.where(ProjectDocument.document_type == document_type)
        count_query = count_query.where(ProjectDocument.document_type == document_type)

    # Get total count
    total = db.exec(count_query).count()

    # Apply pagination
    skip = (page - 1) * page_size
    query = query.offset(skip).limit(page_size).order_by(ProjectDocument.created_at.desc())

    docs = list(db.exec(query).all())

    return {
        "items": [doc.model_dump() for doc in docs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=ProjectDocumentResponse)
async def create_document(
    doc_in: ProjectDocumentCreate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Create a new project document (PDR, MD, etc.)."""
    doc = ProjectDocument.model_validate(doc_in)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{doc_id}", response_model=ProjectDocumentResponse)
async def get_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Get a document by ID."""
    doc = db.get(ProjectDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/public/{doc_id}", response_model=ProjectDocumentResponse)
async def get_public_document(
    doc_id: str,
    db: Session = Depends(get_db)
):
    """Get a public document by ID (no auth required)."""
    doc = db.get(ProjectDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.is_public:
        raise HTTPException(status_code=403, detail="Document is not public")
    return doc


@router.put("/{doc_id}", response_model=ProjectDocumentResponse)
async def update_document(
    doc_id: str,
    doc_in: ProjectDocumentUpdate,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Update a project document."""
    doc = db.get(ProjectDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    update_data = doc_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(doc, key, value)

    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{doc_id}", response_model=MessageResponse)
async def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """Delete a project document."""
    doc = db.get(ProjectDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
