"""GitHub API integration service."""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.domain.enums import SyncStatus, WebhookProvider
from app.domain.models import ExternalResource, SyncLog


class GitHubClient:
    """Client for GitHub API operations with retry and rate limiting."""
    
    BASE_URL = "https://api.github.com"
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json",
        }
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.HTTPStatusError))
    )
    async def get_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        """Get repository details."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_commits(
        self,
        owner: str,
        repo: str,
        since: Optional[datetime] = None,
        per_page: int = 30
    ) -> List[Dict[str, Any]]:
        """Get repository commits."""
        params = {"per_page": per_page}
        if since:
            params["since"] = since.isoformat()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/commits",
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_branches(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Get repository branches."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/branches",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_pull_requests(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Get repository pull requests."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/pulls",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_contributors(self, owner: str, repo: str) -> List[Dict[str, Any]]:
        """Get repository contributors."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/contributors",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def sync_repository(self, resource: ExternalResource) -> Dict[str, Any]:
        """Sync repository data and return stats."""
        if not resource.github_full_name:
            raise ValueError("github_full_name is required (format: owner/repo)")
        
        owner, repo = resource.github_full_name.split("/")
        
        # Get repo details
        repo_data = await self.get_repository(owner, repo)
        
        # Get recent commits (last 7 days)
        since = datetime.utcnow() - timedelta(days=7)
        commits = await self.get_commits(owner, repo, since=since)
        
        # Get branches
        branches = await self.get_branches(owner, repo)
        
        # Get open PRs
        pull_requests = await self.get_pull_requests(owner, repo)
        
        return {
            "repo_data": repo_data,
            "recent_commits": len(commits),
            "branch_count": len(branches),
            "open_pr_count": len(pull_requests),
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "last_push": repo_data.get("pushed_at"),
        }
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature from GitHub."""
        from app.infrastructure.security.auth import verify_webhook_signature
        if not settings.GITHUB_WEBHOOK_SECRET:
            # Allow unverified webhooks in development (no secret configured)
            return True
        return verify_webhook_signature(
            payload,
            signature,
            settings.GITHUB_WEBHOOK_SECRET,
            "sha256"
        )
