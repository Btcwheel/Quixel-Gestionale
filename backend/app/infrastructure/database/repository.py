"""Generic repository pattern for database operations."""

from typing import Type, TypeVar, Generic, Optional, List, Any
from sqlmodel import Session, SQLModel, select, func
from sqlalchemy import Column

ModelType = TypeVar("ModelType", bound=SQLModel)


class BaseRepository(Generic[ModelType]):
    """Generic repository for database operations."""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get(self, id: str) -> Optional[ModelType]:
        """Get a single record by ID."""
        return self.db.get(self.model, id)
    
    def get_many(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict] = None,
        order_by: Optional[str] = None,
        order_desc: bool = False
    ) -> tuple[List[ModelType], int]:
        """
        Get multiple records with pagination, filtering, and sorting.
        Returns (items, total_count).
        """
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)
        
        # Apply filters
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.where(getattr(self.model, key) == value)
                    count_query = count_query.where(getattr(self.model, key) == value)
        
        # Get total count
        total = self.db.exec(count_query).one()
        
        # Apply sorting
        if order_by and hasattr(self.model, order_by):
            column = getattr(self.model, order_by)
            query = query.order_by(column.desc() if order_desc else column.asc())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        items = list(self.db.exec(query).all())
        return items, total
    
    def create(self, obj_in: SQLModel) -> ModelType:
        """Create a new record."""
        db_obj = self.model.model_validate(obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def update(self, db_obj: ModelType, obj_in: SQLModel) -> ModelType:
        """Update an existing record."""
        obj_data = obj_in.model_dump(exclude_unset=True)
        for key, value in obj_data.items():
            setattr(db_obj, key, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def delete(self, id: str) -> bool:
        """Delete a record by ID."""
        db_obj = self.get(id)
        if db_obj:
            self.db.delete(db_obj)
            self.db.commit()
            return True
        return False
    
    def count(self, filters: Optional[dict] = None) -> int:
        """Count records with optional filtering."""
        query = select(func.count()).select_from(self.model)
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    query = query.where(getattr(self.model, key) == value)
        return self.db.exec(query).one()
