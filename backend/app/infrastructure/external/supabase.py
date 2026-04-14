"""Supabase API integration service."""

from typing import Optional, List, Dict, Any
from datetime import datetime

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings


class SupabaseClient:
    """Client for Supabase Management API operations."""
    
    BASE_URL = "https://api.supabase.com/v1"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError))
    )
    async def get_project(self, project_ref: str) -> Dict[str, Any]:
        """Get project details."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/projects/{project_ref}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def list_projects(self) -> List[Dict[str, Any]]:
        """List all projects."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/projects",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_project_health(self, project_ref: str) -> Dict[str, Any]:
        """Get project health status."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/projects/{project_ref}/health",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_database_backups(self, project_ref: str) -> List[Dict[str, Any]]:
        """Get database backups for a project."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/projects/{project_ref}/backups",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def sync_project(self, resource: ExternalResource) -> Dict[str, Any]:
        """Sync project data and return status."""
        project_ref = resource.external_id
        region = resource.supabase_region or "unknown"
        
        # Get project details
        project_data = await self.get_project(project_ref)
        
        # Get health status
        try:
            health = await self.get_project_health(project_ref)
        except Exception:
            health = {}
        
        # Get backups
        try:
            backups = await self.get_database_backups(project_ref)
        except Exception:
            backups = []
        
        return {
            "project_data": project_data,
            "health_status": health.get("status", "unknown"),
            "backup_count": len(backups),
            "region": region,
            "organization_id": project_data.get("organization_id"),
            "created_at": project_data.get("created_at"),
        }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature from Supabase."""
        from app.infrastructure.security.auth import verify_webhook_signature
        if not settings.SUPABASE_WEBHOOK_SECRET:
            return False
        return verify_webhook_signature(
            payload,
            signature,
            settings.SUPABASE_WEBHOOK_SECRET,
            "sha256"
        )


# Import ExternalResource for type hints
from app.domain.models import ExternalResource
