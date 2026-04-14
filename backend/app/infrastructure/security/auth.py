"""Security utilities: encryption, password hashing, JWT."""

import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, Any

import bcrypt
from jose import jwt
from cryptography.fernet import Fernet
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Fernet encryption for API keys/secrets
# Ensure the key is properly formatted for Fernet
encryption_key = settings.ENCRYPTION_KEY.encode()
if len(encryption_key) != 32:
    encryption_key = hashlib.sha256(settings.ENCRYPTION_KEY.encode()).digest()
# Fernet requires 32 url-safe base64-encoded bytes
from cryptography.fernet import Fernet
import base64
if len(settings.ENCRYPTION_KEY.encode()) == 44:  # Already base64 encoded
    fernet = Fernet(settings.ENCRYPTION_KEY.encode())
else:
    # Generate a proper key
    key_bytes = hashlib.sha256(settings.ENCRYPTION_KEY.encode()).digest()
    key_base64 = base64.urlsafe_b64encode(key_bytes).decode()
    fernet = Fernet(key_base64.encode())


# ============================================
# Password Hashing
# ============================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================
# Encryption/Decryption (for API keys)
# ============================================

def encrypt_secret(secret: str) -> str:
    """Encrypt a secret using Fernet symmetric encryption."""
    return fernet.encrypt(secret.encode()).decode()


def decrypt_secret(encrypted_secret: str) -> str:
    """Decrypt an encrypted secret."""
    return fernet.decrypt(encrypted_secret.encode()).decode()


# ============================================
# JWT Token Management
# ============================================

def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": subject,
        "exp": expire,
        "type": "access"
    }
    
    if extra_claims:
        to_encode.update(extra_claims)
    
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            raise ValueError("Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


# ============================================
# HMAC Signature Verification (for webhooks)
# ============================================

def verify_webhook_signature(
    payload: bytes,
    signature: str,
    secret: str,
    algorithm: str = "sha256"
) -> bool:
    """Verify HMAC signature for webhook authenticity."""
    expected_signature = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(
        f"{algorithm}={expected_signature}",
        signature
    )


# ============================================
# Key Generation
# ============================================

def generate_encryption_key() -> str:
    """Generate a new Fernet encryption key."""
    return Fernet.generate_key().decode()
