"""Base service with generic CRUD operations."""

from typing import Type, TypeVar, Generic, Optional, List
from sqlmodel import Session
from pydantic import BaseModel

from app.infrastructure.database.repository import BaseRepository
from app.domain.models import SQLModel

ModelType = TypeVar("ModelType", bound=SQLModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base service class with common CRUD operations."""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
        self.repository = BaseRepository(model, db)
    
    def get_by_id(self, id: str) -> Optional[ModelType]:
        """Get a single record by ID."""
        return self.repository.get(id)
    
    def get_many(
        self,
        page: int = 1,
        page_size: int = 20,
        filters: Optional[dict] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> tuple[List[ModelType], int]:
        """Get paginated records with filtering and sorting."""
        skip = (page - 1) * page_size
        return self.repository.get_many(
            skip=skip,
            limit=page_size,
            filters=filters,
            order_by=sort_by,
            order_desc=(sort_order == "desc")
        )
    
    def create(self, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        return self.repository.create(obj_in)
    
    def update(self, db_obj: ModelType, obj_in: UpdateSchemaType) -> ModelType:
        """Update an existing record."""
        return self.repository.update(db_obj, obj_in)
    
    def delete(self, id: str) -> bool:
        """Delete a record by ID."""
        return self.repository.delete(id)
    
    def count(self, filters: Optional[dict] = None) -> int:
        """Count records with optional filtering."""
        return self.repository.count(filters)
