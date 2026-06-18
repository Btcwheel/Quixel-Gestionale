"""Authentication API routes."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.infrastructure.database.session import get_db
from app.infrastructure.security.auth import (
    verify_password, hash_password, create_access_token
)
from app.domain.models import AdminUser
from app.domain.schemas import (
    LoginRequest, LoginResponse, PasswordChange, MessageResponse,
    TOTPSetupResponse, TOTPVerifyRequest
)
from app.core.config import settings
from app.infrastructure.security.dependencies import get_current_user
from app.application.services.totp_service import TOTPService

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    # Find user by username or email
    user = db.exec(
        select(AdminUser).where(
            (AdminUser.username == form_data.username) |
            (AdminUser.email == form_data.username)
        )
    ).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    user.failed_login_attempts = 0
    db.add(user)
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
        extra_claims={"username": user.username}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user password."""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.password_hash = hash_password(password_data.new_password)
    db.add(current_user)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.get("/me", response_model=dict)
async def get_current_user_info(
    current_user: AdminUser = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "last_login_at": current_user.last_login_at,
        "created_at": current_user.created_at
    }


@router.post("/2fa/setup", response_model=TOTPSetupResponse)
async def setup_2fa(
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Setup TOTP 2FA for current user. Returns secret and QR code."""
    totp_service = TOTPService(db)
    try:
        result = totp_service.setup_totp(current_user.id)
        return TOTPSetupResponse(secret=result["secret"], qr_uri=result["provisioning_uri"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/2fa/verify", response_model=MessageResponse)
async def verify_2fa(
    verify_request: TOTPVerifyRequest,
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify TOTP 2FA code and activate 2FA."""
    totp_service = TOTPService(db)
    is_valid = totp_service.verify_totp(current_user.id, verify_request.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    return {"message": "2FA activated successfully"}


@router.get("/2fa/status", response_model=dict)
async def get_2fa_status(
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current 2FA status for the authenticated user."""
    totp_service = TOTPService(db)
    return totp_service.get_totp_status(current_user.id)


@router.post("/2fa/disable", response_model=MessageResponse)
async def disable_2fa(
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disable 2FA for current user."""
    totp_service = TOTPService(db)
    success = totp_service.disable_totp(current_user.id)
    if not success:
        raise HTTPException(status_code=400, detail="2FA is not configured")
    return {"message": "2FA disabled successfully"}


@router.post("/init", response_model=dict)
async def init_admin_user(db: Session = Depends(get_db)):
    """Initialize admin user (first-time setup only)."""
    # Check if admin already exists
    existing = db.exec(
        select(AdminUser).where(AdminUser.username == settings.ADMIN_USERNAME)
    ).first()
    
    if existing:
        return {"message": "Admin user already exists", "created": False}
    
    # Create admin user
    admin = AdminUser(
        username=settings.ADMIN_USERNAME,
        email=settings.ADMIN_EMAIL,
        password_hash=hash_password(settings.ADMIN_PASSWORD),
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    return {"message": "Admin user created", "created": True, "user_id": admin.id}
