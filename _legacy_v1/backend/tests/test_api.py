"""Tests for the Gestionale Quixel backend."""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlmodel import SQLModel, Session, create_engine
from unittest.mock import patch, MagicMock

from app.main import app
from app.infrastructure.database.session import get_db
from app.infrastructure.security.auth import hash_password
from app.domain.models import AdminUser


# ============================================
# Test Database Setup
# ============================================

TEST_DATABASE_URL = "sqlite:///./test_gestionale.db"

@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine."""
    engine = create_engine(TEST_DATABASE_URL, echo=False)
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)
    # Windows-safe cleanup
    import os
    import time
    time.sleep(0.5)  # Let connections close
    try:
        if os.path.exists("test_gestionale.db"):
            os.remove("test_gestionale.db")
    except PermissionError:
        pass  # Windows file lock, will be cleaned on next run


@pytest.fixture()
def test_db(test_engine):
    """Create a fresh database session for each test."""
    with Session(test_engine) as session:
        yield session
        session.rollback()
        # Clean up tables
        for table in reversed(SQLModel.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()


@pytest.fixture()
async def client(test_db):
    """Create a test client with test database."""
    def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    ac = AsyncClient(transport=transport, base_url="http://test")
    yield ac
    await ac.aclose()
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(test_db):
    """Create an admin user for authenticated tests."""
    user = AdminUser(
        username="testadmin",
        email="testadmin@example.com",
        password_hash=hash_password("testpassword123"),
        is_active=True,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


# ============================================
# Health and Root Tests
# ============================================

@pytest.mark.asyncio
async def test_health_check(client):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


@pytest.mark.asyncio
async def test_root_endpoint(client):
    """Test root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert "docs" in data


# ============================================
# Auth Tests
# ============================================

@pytest.mark.asyncio
async def test_login_success(client, admin_user):
    """Test successful login."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client, admin_user):
    """Test login with wrong password."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client):
    """Test login with non-existent user."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "nobody", "password": "password"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client, admin_user):
    """Test get current user info endpoint."""
    # First login
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpassword123"},
    )
    token = login_response.json()["access_token"]
    
    # Then get user info
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testadmin"
    assert data["email"] == "testadmin@example.com"


@pytest.mark.asyncio
async def test_get_current_user_unauthenticated(client):
    """Test get current user without auth."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password(client, admin_user):
    """Test change password."""
    # Login
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpassword123"},
    )
    token = login_response.json()["access_token"]
    
    # Change password
    response = await client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "testpassword123", "new_password": "newpassword456"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200


# ============================================
# Clients API Tests
# ============================================

@pytest.mark.asyncio
async def test_create_client(client, admin_user):
    """Test creating a client."""
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpassword123"},
    )
    token = login_response.json()["access_token"]
    
    response = await client.post(
        "/api/v1/clients/",
        json={"name": "Test Client", "email": "test@client.com"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Client"
    assert data["email"] == "test@client.com"


@pytest.mark.asyncio
async def test_list_clients(client, admin_user):
    """Test listing clients."""
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpassword123"},
    )
    token = login_response.json()["access_token"]
    
    response = await client.get(
        "/api/v1/clients/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data


@pytest.mark.asyncio
async def test_clients_requires_auth(client):
    """Test that clients API requires authentication."""
    response = await client.get("/api/v1/clients/")
    assert response.status_code == 401


# ============================================
# Projects API Tests
# ============================================

@pytest.mark.asyncio
async def test_create_project(client, admin_user, test_db):
    """Test creating a project."""
    # First create a client
    from app.domain.models import Client
    c = Client(name="Test Client", is_active=True)
    test_db.add(c)
    test_db.commit()
    test_db.refresh(c)
    
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpassword123"},
    )
    token = login_response.json()["access_token"]
    
    response = await client.post(
        "/api/v1/projects/",
        json={"name": "Test Project", "client_id": c.id, "description": "A test project"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["client_id"] == c.id


@pytest.mark.asyncio
async def test_list_projects(client, admin_user):
    """Test listing projects."""
    login_response = await client.post(
        "/api/v1/auth/login",
        data={"username": "testadmin", "password": "testpassword123"},
    )
    token = login_response.json()["access_token"]
    
    response = await client.get(
        "/api/v1/projects/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


# ============================================
# Dashboard API Tests
# ============================================

@pytest.mark.asyncio
async def test_dashboard_stats_requires_auth(client):
    """Test dashboard stats requires auth."""
    response = await client.get("/api/v1/dashboard/stats")
    assert response.status_code == 401


# ============================================
# Alerts API Tests
# ============================================

@pytest.mark.asyncio
async def test_alerts_requires_auth(client):
    """Test alerts API requires auth."""
    response = await client.get("/api/v1/alerts")
    assert response.status_code == 401


# ============================================
# AI Accounts API Tests
# ============================================

@pytest.mark.asyncio
async def test_ai_accounts_requires_auth(client):
    """Test AI accounts API requires auth."""
    response = await client.get("/api/v1/ai-accounts/")
    assert response.status_code == 401


# ============================================
# Security Tests
# ============================================

@pytest.mark.asyncio
async def test_protected_routes_require_auth(client):
    """Test that all protected routes require authentication."""
    protected_routes = [
        ("/api/v1/clients/", "GET"),
        ("/api/v1/projects/", "GET"),
        ("/api/v1/ai-accounts/", "GET"),
        ("/api/v1/chat-logs/", "GET"),
        ("/api/v1/documents/", "GET"),
        ("/api/v1/resources/", "GET"),
        ("/api/v1/alerts", "GET"),
        ("/api/v1/dashboard/stats", "GET"),
    ]
    
    for path, method in protected_routes:
        if method == "GET":
            response = await client.get(path)
            assert response.status_code == 401, f"Route {path} should require auth"


# ============================================
# Password Hashing Tests
# ============================================

def test_password_hashing():
    """Test password hashing and verification."""
    from app.infrastructure.security.auth import hash_password, verify_password
    
    password = "my_secure_password"
    hashed = hash_password(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)


def test_different_hashes_for_same_password():
    """Test that same password produces different hashes (salt)."""
    from app.infrastructure.security.auth import hash_password
    
    h1 = hash_password("same_password")
    h2 = hash_password("same_password")
    
    assert h1 != h2  # Different salts


def test_jwt_token_creation():
    """Test JWT token creation."""
    from app.infrastructure.security.auth import create_access_token
    from app.core.config import settings
    
    token = create_access_token(subject="test-user-id")
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0
