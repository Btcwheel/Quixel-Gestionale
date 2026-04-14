"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, timeAgo } from "@/lib/utils";
import { alertsApi } from "@/lib/api-endpoints";
import { AlertTriangle, Bell, CheckCircle, Info } from "lucide-react";
import { useState } from "react";

const sampleAlerts = [
  { id: "1", severity: "critical", title: "AI Account credits critically low", message: "OpenAI Account #3 has less than 5% credits remaining. Top up immediately to avoid service disruption.", created_at: new Date().toISOString(), is_resolved: false },
  { id: "2", severity: "critical", title: "Database connection timeout", message: "Supabase project 'saas-db' experienced repeated connection timeouts for the last 30 minutes.", created_at: new Date(Date.now() - 1800000).toISOString(), is_resolved: false },
  { id: "3", severity: "warning", title: "GitHub sync failed", message: "Automatic sync failed for repository 'globalmedia/marketing-site'. Webhook may be misconfigured.", created_at: new Date(Date.now() - 3600000).toISOString(), is_resolved: false },
  { id: "4", severity: "warning", title: "Rate limit approaching", message: "Anthropic #1 account is approaching rate limit threshold. Current usage at 85% of hourly limit.", created_at: new Date(Date.now() - 7200000).toISOString(), is_resolved: false },
  { id: "5", severity: "info", title: "New deployment successful", message: "Project 'SaaS Platform' successfully deployed to production environment on Vercel.", created_at: new Date(Date.now() - 10800000).toISOString(), is_resolved: false },
  { id: "6", severity: "info", title: "Project milestone reached", message: "Project 'Health Portal' has reached 50% completion based on task tracking.", created_at: new Date(Date.now() - 14400000).toISOString(), is_resolved: false },
  { id: "7", severity: "warning", title: "Unused AI account detected", message: "Cohere #1 account has not been used in the last 7 days. Consider redistributing load.", created_at: new Date(Date.now() - 86400000).toISOString(), is_resolved: true },
  { id: "8", severity: "info", title: "Client onboarding complete", message: "All projects for client 'TechStart Inc' have been successfully set up and are active.", created_at: new Date(Date.now() - 172800000).toISOString(), is_resolved: true },
];

function AlertIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <AlertTriangle className="h-5 w-5 text-red-500" />;
  if (severity === "warning") return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  return <Info className="h-5 w-5 text-blue-500" />;
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set(sampleAlerts.filter(a => a.is_resolved).map(a => a.id)));

  const handleResolve = async (id: string) => {
    try {
      await alertsApi.resolve(id);
      setResolvedIds(prev => new Set(prev).add(id));
    } catch (error) {
      console.error("Error resolving alert:", error);
      alert("Errore nel risolvere l'alert");
    }
  };

  const filteredAlerts = sampleAlerts.filter((alert) => {
    const isResolved = resolvedIds.has(alert.id);
    if (filter === "active") return !isResolved;
    if (filter === "resolved") return isResolved;
    return true;
  }).map(alert => ({
    ...alert,
    is_resolved: resolvedIds.has(alert.id)
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
            <p className="text-muted-foreground">System notifications and warnings.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active ({sampleAlerts.filter((a) => !a.is_resolved).length})
            </Button>
            <Button
              variant={filter === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("resolved")}
            >
              Resolved ({sampleAlerts.filter((a) => a.is_resolved).length})
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-500">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sampleAlerts.filter((a) => a.severity === "critical" && !a.is_resolved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-500">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sampleAlerts.filter((a) => a.severity === "warning" && !a.is_resolved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-500">Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sampleAlerts.filter((a) => a.severity === "info" && !a.is_resolved).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={alert.is_resolved ? "opacity-60" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {alert.is_resolved ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertIcon severity={alert.severity} />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge className={getStatusColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        {timeAgo(alert.created_at)}
                      </div>
                      {alert.is_resolved && (
                        <div className="flex items-center gap-1 text-green-500">
                          <CheckCircle className="h-3 w-3" />
                          Resolved
                        </div>
                      )}
                    </div>
                  </div>
                  {!alert.is_resolved && (
                    <Button variant="outline" size="sm" onClick={() => handleResolve(alert.id)}>
                      Resolve
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
