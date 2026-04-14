"""FastAPI dependencies for authentication and authorization."""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.infrastructure.database.session import get_db
from app.infrastructure.security.auth import decode_access_token
from app.domain.models import AdminUser

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> AdminUser:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(token)
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except ValueError:
        raise credentials_exception
    
    user = db.query(AdminUser).filter(AdminUser.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


async def require_admin(
    current_user: AdminUser = Depends(get_current_user)
) -> AdminUser:
    """Require admin privileges (all users are admins in this system)."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user
