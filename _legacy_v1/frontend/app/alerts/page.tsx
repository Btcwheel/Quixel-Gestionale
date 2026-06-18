"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, timeAgo } from "@/lib/utils";
import { alertsApi } from "@/lib/api-endpoints";
import { AlertTriangle, Bell, CheckCircle, Info } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type AlertRow = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  created_at: string;
  is_resolved: boolean;
};

const fallbackAlerts: AlertRow[] = [
  { id: "1", severity: "critical", title: "AI Account credits critically low", message: "OpenAI Account #3 has less than 5% credits remaining.", created_at: new Date().toISOString(), is_resolved: false },
  { id: "2", severity: "warning", title: "GitHub sync failed", message: "Automatic sync failed for repository 'globalmedia/marketing-site'.", created_at: new Date(Date.now() - 3600000).toISOString(), is_resolved: false },
  { id: "3", severity: "info", title: "New deployment successful", message: "Project 'SaaS Platform' deployed to production on Vercel.", created_at: new Date(Date.now() - 10800000).toISOString(), is_resolved: false },
];

function AlertIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <AlertTriangle className="h-5 w-5 text-red-500" />;
  if (severity === "warning") return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  return <Info className="h-5 w-5 text-blue-500" />;
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const { data, isError, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const res = await alertsApi.list(undefined, 1, 100);
      return res.data?.items as AlertRow[];
    },
    retry: false,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (error: any) => {
      console.error("Error resolving alert:", error);
      alert("Errore nel risolvere l'alert");
    },
  });

  const alerts = isError && !data ? fallbackAlerts : data ?? [];
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "active") return !alert.is_resolved;
    if (filter === "resolved") return alert.is_resolved;
    return true;
  });

  const handleResolve = async (id: string) => {
    resolveMutation.mutate(id);
  };

  const activeCount = alerts.filter((a) => !a.is_resolved).length;
  const resolvedCount = alerts.filter((a) => a.is_resolved).length;

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
              Active ({activeCount})
            </Button>
            <Button
              variant={filter === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("resolved")}
            >
              Resolved ({resolvedCount})
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

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-500">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alerts.filter((a) => a.severity === "critical" && !a.is_resolved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-yellow-500">Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alerts.filter((a) => a.severity === "warning" && !a.is_resolved).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-500">Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alerts.filter((a) => a.severity === "info" && !a.is_resolved).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {isLoading && !data && <p className="text-sm text-muted-foreground">Caricamento alert...</p>}
          {isError && !data && <p className="text-sm text-muted-foreground">Uso dati di fallback locale.</p>}
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
                      <Badge className={getStatusColor(alert.severity)}>{alert.severity}</Badge>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolveMutation.isPending}
                    >
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
