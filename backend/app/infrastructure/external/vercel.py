"""Vercel API integration service."""

from typing import Optional, List, Dict, Any
from datetime import datetime

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings


class VercelClient:
    """Client for Vercel API operations."""
    
    BASE_URL = "https://api.vercel.com"
    
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
    async def get_deployment(self, deployment_id: str, team_id: Optional[str] = None) -> Dict[str, Any]:
        """Get deployment details."""
        params = {"teamId": team_id} if team_id else {}
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/v13/deployments/{deployment_id}",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def list_deployments(
        self,
        project_id: str,
        team_id: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """List deployments for a project."""
        params = {"projectId": project_id, "limit": limit}
        if team_id:
            params["teamId"] = team_id
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/v6/deployments",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json().get("deployments", [])
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_project(self, project_id: str, team_id: Optional[str] = None) -> Dict[str, Any]:
        """Get project details."""
        params = {"teamId": team_id} if team_id else {}
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/v9/projects/{project_id}",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def list_projects(self, team_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all projects."""
        params = {"teamId": team_id} if team_id else {}
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/v9/projects",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_deployment_status(
        self,
        deployment_id: str,
        team_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get deployment build status."""
        deployment = await self.get_deployment(deployment_id, team_id)
        return {
            "deployment_id": deployment_id,
            "state": deployment.get("state"),  # READY, BUILDING, ERROR, etc.
            "target": deployment.get("target"),  # production, preview, development
            "url": deployment.get("url"),
            "created_at": deployment.get("created"),
            "meta": deployment.get("meta"),
        }
    
    async def sync_deployment(self, resource: ExternalResource) -> Dict[str, Any]:
        """Sync deployment data and return status."""
        deployment_id = resource.external_id
        
        # Get deployment details
        deployment_data = await self.get_deployment(deployment_id)
        
        # Get deployment status
        status = await self.get_deployment_status(deployment_id)
        
        return {
            "deployment_data": deployment_data,
            "status": status,
            "project_id": deployment_data.get("projectId"),
            "target": deployment_data.get("target"),
            "url": deployment_data.get("url"),
            "state": deployment_data.get("state"),
            "created_at": deployment_data.get("created"),
        }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature from Vercel."""
        from app.infrastructure.security.auth import verify_webhook_signature
        if not settings.VERCEL_WEBHOOK_SECRET:
            return False
        # Vercel uses different signature format
        import hmac
        import hashlib
        expected = hmac.new(
            settings.VERCEL_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(f"sha256={expected}", signature)
