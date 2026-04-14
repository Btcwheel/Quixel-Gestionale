"""Database session management and configuration."""

from typing import Generator
from sqlmodel import SQLModel, create_engine, Session, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
    echo=settings.DEBUG,  # Log SQL queries in debug mode
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)


def create_db_and_tables():
    """Create all database tables (use only for initial setup/migrations)."""
    SQLModel.metadata.create_all(engine)


def seed_default_data():
    """Create default admin user if it doesn't exist, or update credentials if defaults changed."""
    from app.domain.models import AdminUser
    from app.infrastructure.security.auth import hash_password, verify_password

    db = SessionLocal()
    try:
        existing = db.exec(
            select(AdminUser).where(AdminUser.username == settings.ADMIN_USERNAME)
        ).first()

        if not existing:
            admin = AdminUser(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                is_active=True,
            )
            db.add(admin)
            db.commit()
            print(f"[OK] Default admin user created: {settings.ADMIN_USERNAME}")
        else:
            # Update password if it doesn't match current default (migration)
            if not verify_password(settings.ADMIN_PASSWORD, existing.password_hash):
                existing.password_hash = hash_password(settings.ADMIN_PASSWORD)
                existing.email = settings.ADMIN_EMAIL
                existing.is_active = True
                db.add(existing)
                db.commit()
                print(f"[OK] Default admin credentials updated: {settings.ADMIN_USERNAME}")
            else:
                print("[OK] Default admin user already exists")
    finally:
        db.close()


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_context():
    """Context manager for database sessions (non-FastAPI use)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
