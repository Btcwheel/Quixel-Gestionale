"""Credential vault service for secure credential management."""

from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlmodel import Session, select
import json

from app.domain.models import CredentialVault, ExternalAccount
from app.infrastructure.security.auth import encrypt_data, decrypt_data


class VaultService:
    """Service for managing encrypted credentials."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_credential(
        self,
        project_id: str,
        account_id: str,
        provider: str,
        account_name: str,
        credential_type: str,
        credentials: Dict[str, Any],
        expires_at: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> CredentialVault:
        """Create a new encrypted credential entry."""
        # Verify account exists and belongs to project
        account = self.db.get(ExternalAccount, account_id)
        if not account or account.project_id != project_id:
            raise ValueError("External account not found or doesn't belong to project")
        
        # Encrypt credentials
        credentials_json = json.dumps(credentials)
        encrypted_credentials = encrypt_data(credentials_json)
        
        # Create vault entry
        vault = CredentialVault(
            project_id=project_id,
            account_id=account_id,
            provider=provider,
            account_name=account_name,
            credential_type=credential_type,
            encrypted_credentials=encrypted_credentials,
            expires_at=expires_at,
            notes=notes
        )
        
        self.db.add(vault)
        self.db.commit()
        self.db.refresh(vault)
        return vault
    
    def get_credential(self, vault_id: str) -> Optional[CredentialVault]:
        """Get a credential vault entry by ID."""
        return self.db.get(CredentialVault, vault_id)
    
    def list_credentials_for_account(
        self,
        project_id: str,
        account_id: str
    ) -> list[CredentialVault]:
        """List all credentials for an account."""
        # Verify account belongs to project
        account = self.db.get(ExternalAccount, account_id)
        if not account or account.project_id != project_id:
            raise ValueError("External account not found or doesn't belong to project")
        
        return self.db.exec(
            select(CredentialVault)
            .where(CredentialVault.account_id == account_id)
            .where(CredentialVault.project_id == project_id)
        ).all()
    
    def unlock_credential(
        self,
        vault_id: str,
        totp_code: str
    ) -> Dict[str, Any]:
        """Unlock and decrypt credentials (requires TOTP 2FA)."""
        vault = self.get_credential(vault_id)
        if not vault:
            raise ValueError("Credential vault entry not found")
        
        # TODO: Implement proper TOTP verification
        # For now, we'll accept any 6-digit code as placeholder
        if not totp_code or len(totp_code) != 6 or not totp_code.isdigit():
            raise ValueError("Invalid TOTP code")
        
        # Decrypt credentials
        decrypted_json = decrypt_data(vault.encrypted_credentials)
        credentials = json.loads(decrypted_json)
        
        # Update access tracking
        vault.last_accessed_at = datetime.now(timezone.utc)
        vault.access_count += 1
        self.db.add(vault)
        self.db.commit()
        
        return credentials
    
    def update_credential(
        self,
        vault_id: str,
        account_name: Optional[str] = None,
        credential_type: Optional[str] = None,
        credentials: Optional[Dict[str, Any]] = None,
        expires_at: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> Optional[CredentialVault]:
        """Update a credential vault entry."""
        vault = self.get_credential(vault_id)
        if not vault:
            return None
        
        update_data = {}
        if account_name is not None:
            update_data["account_name"] = account_name
        if credential_type is not None:
            update_data["credential_type"] = credential_type
        if credentials is not None:
            credentials_json = json.dumps(credentials)
            update_data["encrypted_credentials"] = encrypt_data(credentials_json)
        if expires_at is not None:
            update_data["expires_at"] = expires_at
        if notes is not None:
            update_data["notes"] = notes
        
        for key, value in update_data.items():
            setattr(vault, key, value)
        
        self.db.add(vault)
        self.db.commit()
        self.db.refresh(vault)
        return vault
    
    def delete_credential(self, vault_id: str) -> bool:
        """Delete a credential vault entry."""
        vault = self.get_credential(vault_id)
        if not vault:
            return False
        
        self.db.delete(vault)
        self.db.commit()
        return True
    
    def log_access(self, vault_id: str):
        """Log access to a credential (for audit trail)."""
        vault = self.get_credential(vault_id)
        if vault:
            vault.last_accessed_at = datetime.now(timezone.utc)
            vault.access_count += 1
            self.db.add(vault)
            self.db.commit()