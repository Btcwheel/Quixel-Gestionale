"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Github, Database, Rocket, RefreshCw, ExternalLink, CheckCircle, XCircle, AlertCircle, Plus, Trash2, Key
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { resourcesApi, apiKeysApi } from "@/lib/api-endpoints";
import type { ExternalResource, ExternalResourceCreate, APIKey } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; text: string }> = {
    success: { icon: CheckCircle, color: "text-green-500", text: "Synced" },
    synced: { icon: CheckCircle, color: "text-green-500", text: "Synced" },
    healthy: { icon: CheckCircle, color: "text-green-500", text: "Healthy" },
    ready: { icon: CheckCircle, color: "text-green-500", text: "Ready" },
    failed: { icon: XCircle, color: "text-red-500", text: "Failed" },
    in_progress: { icon: RefreshCw, color: "text-yellow-500", text: "Syncing" },
    building: { icon: RefreshCw, color: "text-yellow-500", text: "Building" },
    error: { icon: AlertCircle, color: "text-red-500", text: "Error" },
    pending: { icon: AlertCircle, color: "text-gray-500", text: "Pending" },
  };
  const { icon: Icon, color, text } = config[status] || config.error;
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${color}`}>
      <Icon className="h-3 w-3" />
      {text}
    </Badge>
  );
}

function AddResourceDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void;
}) {
  const [resource, setResource] = useState<ExternalResourceCreate>({
    project_id: "",
    resource_type: "github_repo",
    external_id: "",
    name: "",
    url: "",
    owner: "",
    github_full_name: "",
    supabase_region: "us-east-1",
    vercel_target: "production",
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!resource.name || !resource.url) return;
    setLoading(true);
    try {
      await resourcesApi.create({
        ...resource,
        external_id: resource.external_id || resource.github_full_name || resource.url,
      });
      onAdded();
      onOpenChange(false);
      setResource({
        project_id: "",
        resource_type: "github_repo",
        external_id: "",
        name: "",
        url: "",
        owner: "",
        github_full_name: "",
        supabase_region: "us-east-1",
        vercel_target: "production",
      });
    } catch (error) {
      console.error("Error creating resource:", error);
      alert("Errore nella creazione della risorsa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Integration Resource</DialogTitle>
          <DialogDescription>Connect a GitHub repo, Supabase project, or Vercel deployment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={resource.resource_type}
              onValueChange={(v) =>
                setResource({
                  ...resource,
                  resource_type: v as ExternalResourceCreate["resource_type"],
                })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="github_repo">GitHub Repository</SelectItem>
                <SelectItem value="supabase_project">Supabase Project</SelectItem>
                <SelectItem value="vercel_deployment">Vercel Deployment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={resource.name}
              onChange={(e) => setResource({ ...resource, name: e.target.value })}
              placeholder="my-project"
            />
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={resource.url}
              onChange={(e) => setResource({ ...resource, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          {resource.resource_type === "github_repo" && (
            <div className="space-y-2">
              <Label>Repository (owner/repo)</Label>
              <Input
                value={resource.github_full_name}
                onChange={(e) => setResource({ ...resource, github_full_name: e.target.value })}
                placeholder="owner/repository"
              />
            </div>
          )}
          {resource.resource_type === "supabase_project" && (
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={resource.supabase_region}
                onValueChange={(v) => setResource({ ...resource, supabase_region: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East 1</SelectItem>
                  <SelectItem value="us-west-2">US West 2</SelectItem>
                  <SelectItem value="eu-west-1">EU West 1</SelectItem>
                  <SelectItem value="eu-west-2">EU West 2</SelectItem>
                  <SelectItem value="ap-southeast-1">AP Southeast 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {resource.resource_type === "vercel_deployment" && (
            <div className="space-y-2">
              <Label>Target</Label>
              <Select
                value={resource.vercel_target}
                onValueChange={(v) => setResource({ ...resource, vercel_target: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="preview">Preview</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" /> Add Resource
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function IntegrationsPage() {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: resourcesData, refetch } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const res = await resourcesApi.list(1, 100);
      return res.data?.items || [];
    },
    retry: false,
  });

  const { data: apiKeysData, refetch: refetchKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await apiKeysApi.list(1, 100);
      return res.data?.items || [];
    },
    retry: false,
  });

  const resources = resourcesData || [];
  const apiKeys = apiKeysData || [];

  const githubResources = resources.filter(
    (r) => r.resource_type === "github_repo"
  );
  const supabaseResources = resources.filter(
    (r) => r.resource_type === "supabase_project"
  );
  const vercelResources = resources.filter(
    (r) => r.resource_type === "vercel_deployment"
  );

  const githubConnected = apiKeys.some((k: APIKey) => k.provider === "github" && k.is_active);
  const supabaseConnected = apiKeys.some((k: APIKey) => k.provider === "supabase" && k.is_active);
  const vercelConnected = apiKeys.some((k: APIKey) => k.provider === "vercel" && k.is_active);

  const handleSync = async (resourceId: string, type: string) => {
    setSyncing(resourceId);
    try {
      await resourcesApi.sync(resourceId, type);
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setTimeout(() => setSyncing(null), 2000);
    }
  };

  const handleSyncAll = async (type: string) => {
    setSyncing(`all-${type}`);
    try {
      await resourcesApi.sync(undefined, type);
    } catch (error) {
      console.error("Sync all error:", error);
    } finally {
      setTimeout(() => setSyncing(null), 3000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
            <p className="text-muted-foreground">Connect and manage external services.</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Resource
          </Button>
        </div>

        {/* Connection Status */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Github className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <CardTitle className="text-base">GitHub</CardTitle>
                    <CardDescription>{githubConnected ? "Connected" : "Not connected"}</CardDescription>
                  </div>
                </div>
                <Badge className={githubConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {githubConnected ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleSyncAll("github")}
                disabled={syncing === "all-github" || !githubConnected}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing === "all-github" ? "animate-spin" : ""}`} />
                {syncing === "all-github" ? "Syncing..." : "Sync All"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <Database className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Supabase</CardTitle>
                    <CardDescription>{supabaseConnected ? "Connected" : "Not connected"}</CardDescription>
                  </div>
                </div>
                <Badge className={supabaseConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {supabaseConnected ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleSyncAll("supabase")}
                disabled={syncing === "all-supabase" || !supabaseConnected}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing === "all-supabase" ? "animate-spin" : ""}`} />
                {syncing === "all-supabase" ? "Syncing..." : "Sync All"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Rocket className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Vercel</CardTitle>
                    <CardDescription>{vercelConnected ? "Connected" : "Not connected"}</CardDescription>
                  </div>
                </div>
                <Badge className={vercelConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {vercelConnected ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleSyncAll("vercel")}
                disabled={syncing === "all-vercel" || !vercelConnected}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing === "all-vercel" ? "animate-spin" : ""}`} />
                {syncing === "all-vercel" ? "Syncing..." : "Sync All"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="github">
          <TabsList>
            <TabsTrigger value="github">
              <Github className="mr-2 h-4 w-4" />
              GitHub ({githubResources.length})
            </TabsTrigger>
            <TabsTrigger value="supabase">
              <Database className="mr-2 h-4 w-4" />
              Supabase ({supabaseResources.length})
            </TabsTrigger>
            <TabsTrigger value="vercel">
              <Rocket className="mr-2 h-4 w-4" />
              Vercel ({vercelResources.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connected Repositories</CardTitle>
                <CardDescription>GitHub repositories linked to your projects.</CardDescription>
              </CardHeader>
              <CardContent>
                {githubResources.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No GitHub repositories connected. Add one above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {githubResources.map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <Github className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {resource.github_full_name || resource.url}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <StatusBadge status={resource.last_sync_status || "pending"} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSync(resource.id, "github")}
                            disabled={syncing === resource.id}
                          >
                            <RefreshCw className={`mr-1 h-3 w-3 ${syncing === resource.id ? "animate-spin" : ""}`} />
                            Sync
                          </Button>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supabase" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Supabase Projects</CardTitle>
                <CardDescription>Database projects and their sync status.</CardDescription>
              </CardHeader>
              <CardContent>
                {supabaseResources.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No Supabase projects connected. Add one above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {supabaseResources.map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <Database className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {resource.supabase_region} • {resource.url}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <StatusBadge status={resource.last_sync_status || "pending"} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSync(resource.id, "supabase")}
                            disabled={syncing === resource.id}
                          >
                            <RefreshCw className={`mr-1 h-3 w-3 ${syncing === resource.id ? "animate-spin" : ""}`} />
                            Sync
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vercel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vercel Deployments</CardTitle>
                <CardDescription>Current deployments across projects.</CardDescription>
              </CardHeader>
              <CardContent>
                {vercelResources.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No Vercel deployments connected. Add one above.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {vercelResources.map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <Rocket className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {resource.url}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">{resource.vercel_target}</Badge>
                          <StatusBadge status={resource.last_sync_status || "pending"} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSync(resource.id, "vercel")}
                            disabled={syncing === resource.id}
                          >
                            <RefreshCw className={`mr-1 h-3 w-3 ${syncing === resource.id ? "animate-spin" : ""}`} />
                            Sync
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* API Keys Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys Configuration
            </CardTitle>
            <CardDescription>
              API keys are required for GitHub, Supabase, and Vercel integrations. Configure them in Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { provider: "github", icon: Github, label: "GitHub" },
                { provider: "supabase", icon: Database, label: "Supabase" },
                { provider: "vercel", icon: Rocket, label: "Vercel" },
              ].map(({ provider, icon: Icon, label }) => {
                const keys = apiKeys.filter((k: APIKey) => k.provider === provider);
                const activeKey = keys.find((k: APIKey) => k.is_active);
                return (
                  <div key={provider} className="flex items-center gap-3 rounded-lg border p-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">
                        {activeKey ? `${activeKey.name} (Active)` : keys.length > 0 ? `${keys.length} keys (inactive)` : "No keys configured"}
                      </div>
                    </div>
                    <Badge className={activeKey ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {activeKey ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <AddResourceDialog open={addOpen} onOpenChange={setAddOpen} onAdded={refetch} />
      </div>
    </DashboardLayout>
  );
}
