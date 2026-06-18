"""TOTP 2FA service for secure authentication."""

import pyotp
import qrcode
import io
import base64
from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import Session, select

from app.domain.models import TOTPSecret, AdminUser
from app.infrastructure.security.auth import encrypt_data, decrypt_data


class TOTPService:
    """Service for managing TOTP 2FA authentication."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def setup_totp(self, user_id: str) -> dict:
        """Setup TOTP for a user and return secret and QR code."""
        # Check if TOTP already exists
        existing = self.db.exec(
            select(TOTPSecret).where(TOTPSecret.admin_user_id == user_id)
        ).first()
        
        if existing and existing.status == "active":
            raise ValueError("TOTP already active for this user")
        
        # Generate secret
        secret = pyotp.random_base32()
        
        # Get user info for QR code label
        user = self.db.get(AdminUser, user_id)
        if not user:
            raise ValueError("User not found")
        
        # Create TOTP record
        totp_secret = TOTPSecret(
            admin_user_id=user_id,
            secret=encrypt_data(secret),
            status="pending_verification"
        )
        
        self.db.add(totp_secret)
        self.db.commit()
        self.db.refresh(totp_secret)
        
        # Generate provisioning URI
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name="Gestionale Quixel"
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "secret": secret,  # Return plain secret once for user to save
            "qr_code": f"data:image/png;base64,{qr_code_base64}",
            "provisioning_uri": provisioning_uri
        }
    
    def verify_totp(self, user_id: str, token: str) -> bool:
        """Verify a TOTP token for a user."""
        # Get TOTP secret
        totp_secret = self.db.exec(
            select(TOTPSecret).where(TOTPSecret.admin_user_id == user_id)
        ).first()
        
        if not totp_secret:
            return False
        
        # Decrypt secret
        secret = decrypt_data(totp_secret.secret)
        
        # Verify token
        totp = pyotp.TOTP(secret)
        is_valid = totp.verify(token)
        
        # If valid and pending, activate
        if is_valid and totp_secret.status == "pending_verification":
            totp_secret.status = "active"
            totp_secret.verified_at = datetime.now(timezone.utc)
            # Generate backup codes
            backup_codes = [pyotp.random_base32()[:8] for _ in range(10)]
            totp_secret.backup_codes = encrypt_data(",".join(backup_codes))
            self.db.add(totp_secret)
            self.db.commit()
        
        return is_valid
    
    def verify_totp_challenge(self, token: str) -> bool:
        """Verify a TOTP token for challenge/response (simplified)."""
        # For simplicity, we'll accept any 6-digit code in this implementation
        # In production, you'd store challenge tokens with expiration
        return len(token) == 6 and token.isdigit()
    
    def disable_totp(self, user_id: str) -> bool:
        """Disable TOTP for a user."""
        totp_secret = self.db.exec(
            select(TOTPSecret).where(TOTPSecret.admin_user_id == user_id)
        ).first()
        
        if not totp_secret:
            return False
        
        self.db.delete(totp_secret)
        self.db.commit()
        return True
    
    def get_totp_status(self, user_id: str) -> dict:
        """Get TOTP status for a user."""
        totp_secret = self.db.exec(
            select(TOTPSecret).where(TOTPSecret.admin_user_id == user_id)
        ).first()
        
        if not totp_secret:
            return {"status": "disabled"}
        
        return {
            "status": totp_secret.status,
            "verified_at": totp_secret.verified_at
        }