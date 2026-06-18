"""CLI for AI & SaaS Project Tracker management."""

import typer
from typing import Optional
from datetime import datetime
import httpx
import json

app = typer.Typer(
    name="gestionale-cli",
    help="CLI for managing AI & SaaS Project Tracker",
    add_completion=False,
)

# Default API URL
API_BASE = "http://localhost:8000/api/v1"


def get_headers(token: Optional[str] = None) -> dict:
    """Get headers with optional auth token."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


# ============================================
# Auth
# ============================================

@app.command()
def login(
    username: str = typer.Option(..., "--username", "-u", prompt=True),
    password: str = typer.Option(..., "--password", "-p", prompt=True, hide_input=True),
    api_url: str = typer.Option(API_BASE, "--api-url", help="API base URL"),
):
    """Login and get access token."""
    with httpx.Client() as client:
        response = client.post(
            f"{api_url}/auth/login",
            data={"username": username, "password": password},
        )
        
        if response.status_code == 200:
            data = response.json()
            typer.echo(f"✅ Login successful!")
            typer.echo(f"Token: {data['access_token']}")
            typer.echo(f"Expires in: {data['expires_in']} seconds")
        else:
            typer.echo(f"❌ Login failed: {response.text}", err=True)
            raise typer.Exit(code=1)


# ============================================
# Sync Commands
# ============================================

@app.command()
def sync(
    resource_id: Optional[str] = typer.Option(None, "--resource-id", help="Sync specific resource"),
    project_id: Optional[str] = typer.Option(None, "--project-id", help="Sync all resources for project"),
    sync_type: Optional[str] = typer.Option(None, "--type", help="Sync type: github, supabase, vercel, all"),
    token: str = typer.Option(..., "--token", "-t", prompt=True, hide_input=True),
    api_url: str = typer.Option(API_BASE, "--api-url", help="API base URL"),
):
    """Trigger manual sync for resources."""
    with httpx.Client() as client:
        response = client.post(
            f"{api_url}/resources/sync",
            json={
                "resource_id": resource_id,
                "project_id": project_id,
                "sync_type": sync_type or "all",
            },
            headers=get_headers(token),
        )
        
        if response.status_code == 200:
            typer.echo("✅ Sync task queued successfully!")
        else:
            typer.echo(f"❌ Sync failed: {response.text}", err=True)
            raise typer.Exit(code=1)


@app.command()
def sync_status(
    resource_id: str = typer.Option(..., "--resource-id", "-r"),
    token: str = typer.Option(..., "--token", "-t", prompt=True, hide_input=True),
    api_url: str = typer.Option(API_BASE, "--api-url", help="API base URL"),
):
    """Check sync status for a resource."""
    with httpx.Client() as client:
        response = client.get(
            f"{api_url}/resources/{resource_id}/sync-logs",
            headers=get_headers(token),
        )
        
        if response.status_code == 200:
            data = response.json()
            typer.echo(f"📊 Sync Logs for Resource {resource_id}")
            typer.echo(f"Total logs: {data['total']}")
            typer.echo("-" * 50)
            
            for log in data['items'][:10]:
                status_icon = "✅" if log['status'] == 'success' else "❌"
                typer.echo(f"{status_icon} {log['action']} - {log['status']} ({log['started_at']})")
        else:
            typer.echo(f"❌ Failed to get sync status: {response.text}", err=True)
            raise typer.Exit(code=1)


# ============================================
# Alert Commands
# ============================================

@app.command()
def alerts(
    unresolved: bool = typer.Option(True, "--unresolved/--all", help="Show only unresolved alerts"),
    token: str = typer.Option(..., "--token", "-t", prompt=True, hide_input=True),
    api_url: str = typer.Option(API_BASE, "--api-url", help="API base URL"),
):
    """List alerts."""
    with httpx.Client() as client:
        params = {"is_resolved": False} if unresolved else {}
        response = client.get(
            f"{api_url}/alerts",
            params=params,
            headers=get_headers(token),
        )
        
        if response.status_code == 200:
            data = response.json()
            typer.echo(f"🚨 Alerts ({'Unresolved' if unresolved else 'All'})")
            typer.echo(f"Total: {data['total']}")
            typer.echo("-" * 50)
            
            for alert in data['items'][:20]:
                severity_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🔵"}.get(
                    alert['severity'], "⚪"
                )
                status = "✅" if alert['is_resolved'] else "⏳"
                typer.echo(f"{severity_icon} {status} {alert['title']}")
                typer.echo(f"   {alert['message']}")
                typer.echo(f"   {alert['created_at']}")
                typer.echo()
        else:
            typer.echo(f"❌ Failed to get alerts: {response.text}", err=True)
            raise typer.Exit(code=1)


@app.command()
def resolve_alert(
    alert_id: str = typer.Argument(..., help="Alert ID to resolve"),
    token: str = typer.Option(..., "--token", "-t", prompt=True, hide_input=True),
    api_url: str = typer.Option(API_BASE, "--api-url", help="API base URL"),
):
    """Resolve an alert."""
    with httpx.Client() as client:
        response = client.put(
            f"{api_url}/alerts/{alert_id}/resolve",
            json={"is_resolved": True},
            headers=get_headers(token),
        )
        
        if response.status_code == 200:
            typer.echo(f"✅ Alert {alert_id} resolved successfully!")
        else:
            typer.echo(f"❌ Failed to resolve alert: {response.text}", err=True)
            raise typer.Exit(code=1)


# ============================================
# Export Commands
# ============================================

@app.command()
def export(
    export_type: str = typer.Argument(..., help="Export type: clients, projects, ai-accounts, chat-logs"),
    format: str = typer.Option("json", "--format", "-f", help="Export format: json, csv"),
    output: str = typer.Option("export.json", "--output", "-o", help="Output file path"),
    token: str = typer.Option(..., "--token", "-t", prompt=True, hide_input=True),
    api_url: str = typer.Option(API_BASE, "--api-url", help="API base URL"),
):
    """Export data to JSON or CSV."""
    typer.echo(f"📤 Exporting {export_type} to {format} format...")
    
    # Map export types to endpoints
    endpoints = {
        "clients": "/clients",
        "projects": "/projects",
        "ai-accounts": "/ai-accounts",
        "chat-logs": "/chat-logs",
    }
    
    endpoint = endpoints.get(export_type)
    if not endpoint:
        typer.echo(f"❌ Invalid export type: {export_type}", err=True)
        raise typer.Exit(code=1)
    
    with httpx.Client() as client:
        response = client.get(
            f"{api_url}{endpoint}",
            params={"page_size": 1000},
            headers=get_headers(token),
        )
        
        if response.status_code == 200:
            data = response.json()
            
            with open(output, 'w') as f:
                if format == "json":
                    json.dump(data, f, indent=2, default=str)
                else:
                    # Simple CSV export
                    f.write("TODO: Implement CSV export\n")
            
            typer.echo(f"✅ Exported {data['total']} items to {output}")
        else:
            typer.echo(f"❌ Export failed: {response.text}", err=True)
            raise typer.Exit(code=1)


# ============================================
# Health Check
# ============================================

@app.command()
def health(api_url: str = typer.Option("http://localhost:8000", "--api-url", help="API base URL")):
    """Check API health."""
    with httpx.Client() as client:
        try:
            response = client.get(f"{api_url}/health", timeout=5.0)
            
            if response.status_code == 200:
                data = response.json()
                typer.echo(f"✅ API is healthy!")
                typer.echo(f"Version: {data.get('version', 'unknown')}")
                typer.echo(f"Status: {data.get('status', 'unknown')}")
            else:
                typer.echo(f"❌ API returned status {response.status_code}", err=True)
                raise typer.Exit(code=1)
        except httpx.ConnectError:
            typer.echo(f"❌ Cannot connect to API at {api_url}", err=True)
            raise typer.Exit(code=1)


# ============================================
# Token Rotation
# ============================================

@app.command()
def rotate_token(
    account_id: str = typer.Argument(..., help="AI account ID"),
    new_token: str = typer.Option(..., "--new-token", "-n", prompt=True, hide_input=True),
    token: str = typer.Option(..., "--token", "-t", prompt=True, hide_input=True),
    api_url: str = typer.Option(API_BASE, "--api-url", help="API base URL"),
):
    """Rotate API token for an AI account."""
    with httpx.Client() as client:
        response = client.put(
            f"{api_url}/ai-accounts/{account_id}",
            json={"api_key": new_token},
            headers=get_headers(token),
        )
        
        if response.status_code == 200:
            typer.echo(f"✅ Token rotated successfully for account {account_id}")
        else:
            typer.echo(f"❌ Token rotation failed: {response.text}", err=True)
            raise typer.Exit(code=1)


# ============================================
# Dashboard Stats
# ============================================

@app.command()
def stats(
    token: str = typer.Option(..., "--token", "-t", prompt=True, hide_input=True),
    api_url: str = typer.Option(API_BASE, "--api-url", help="API base URL"),
):
    """Get dashboard statistics."""
    with httpx.Client() as client:
        response = client.get(
            f"{api_url}/dashboard/stats",
            headers=get_headers(token),
        )
        
        if response.status_code == 200:
            data = response.json()
            typer.echo("📊 Dashboard Statistics")
            typer.echo("=" * 50)
            typer.echo(f"Total Clients: {data['total_clients']}")
            typer.echo(f"Active Projects: {data['active_projects']}")
            typer.echo(f"AI Accounts Active: {data['ai_accounts_active']}")
            typer.echo(f"Total AI Credits: {data['total_ai_credits_remaining']:.2f}")
            typer.echo(f"Chats Today: {data['total_chats_today']}")
            typer.echo(f"Deployments Today: {data['total_deployments_today']}")
            typer.echo(f"Unresolved Alerts: {data['unresolved_alerts']}")
        else:
            typer.echo(f"❌ Failed to get stats: {response.text}", err=True)
            raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
