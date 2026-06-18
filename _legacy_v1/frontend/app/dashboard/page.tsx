"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FolderKanban,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, alertsApi, projectsApi } from "@/lib/api-endpoints";
import { cn, timeAgo, formatCurrency } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import type { Alert, Project } from "@/types";
import Link from "next/link";

/* ── Sample fallback ──────────────────────────────────────────────────────── */

const sampleActivity = [
  { date: "Lun", chats: 24, deployments: 3 },
  { date: "Mar", chats: 38, deployments: 5 },
  { date: "Mer", chats: 52, deployments: 8 },
  { date: "Gio", chats: 41, deployments: 6 },
  { date: "Ven", chats: 65, deployments: 10 },
  { date: "Sab", chats: 28, deployments: 2 },
  { date: "Dom", chats: 15, deployments: 1 },
];

const sampleAlerts: Alert[] = [
  { id: "1", severity: "critical", title: "AI Account credits low", message: "OpenAI Account #3 ha meno del 10% di crediti", created_at: new Date().toISOString(), is_resolved: false },
  { id: "2", severity: "warning",  title: "Sync fallita",           message: "GitHub sync fallita per 'SaaS Platform'",           created_at: new Date(Date.now() - 3600000).toISOString(), is_resolved: false },
  { id: "3", severity: "info",     title: "Nuovo deployment",       message: "Progetto 'Marketing Site' deployato in produzione", created_at: new Date(Date.now() - 7200000).toISOString(), is_resolved: false },
];

const sampleProjects: Project[] = [
  { id: "1", client_id: "1", name: "SaaS Platform",    client_name: "Acme Corp",            status: "active",    budget: 50000, created_at: "2024-05-15T10:00:00Z", updated_at: "2024-05-15T10:00:00Z" },
  { id: "2", client_id: "2", name: "Mobile App",       client_name: "TechStart Inc",        status: "active",    budget: 35000, created_at: "2024-06-20T10:00:00Z", updated_at: "2024-06-20T10:00:00Z" },
  { id: "5", client_id: "5", name: "Health Portal",    client_name: "HealthTech Solutions", status: "active",    budget: 45000, created_at: "2024-07-15T10:00:00Z", updated_at: "2024-07-15T10:00:00Z" },
  { id: "4", client_id: "4", name: "API Gateway",      client_name: "FinServe Ltd",         status: "planning",  budget: 28000, created_at: "2024-08-01T10:00:00Z", updated_at: "2024-08-01T10:00:00Z" },
  { id: "3", client_id: "3", name: "Marketing Site",   client_name: "GlobalMedia",          status: "completed", budget: 12000, created_at: "2024-01-05T10:00:00Z", updated_at: "2024-01-05T10:00:00Z" },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const STATUS_CFG: Record<string, { dot: string; text: string }> = {
  active:    { dot: "bg-success",          text: "text-success" },
  planning:  { dot: "bg-warning",          text: "text-warning" },
  completed: { dot: "bg-info",             text: "text-info" },
  archived:  { dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await dashboardApi.stats()).data,
    retry: false,
  });

  const { data: alertsData } = useQuery({
    queryKey: ["alerts", false],
    queryFn: async () => (await alertsApi.list(false)).data?.items,
    retry: false,
  });

  const { data: activityData } = useQuery({
    queryKey: ["dashboard-activity", 7],
    queryFn: async () => (await dashboardApi.activity(7)).data,
    retry: false,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-recent"],
    queryFn: async () => (await projectsApi.list(1, 5)).data?.items,
    retry: false,
  });

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setChartReady(true); observer.disconnect(); } },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const alerts   = alertsData?.length   ? alertsData   : sampleAlerts;
  const activity = activityData?.length ? activityData : sampleActivity;
  const projects = projectsData?.length ? projectsData : sampleProjects;

  const totalClients     = stats?.total_clients     ?? 12;
  const activeProjects   = stats?.active_projects   ?? 28;
  const unresolvedAlerts = stats?.unresolved_alerts ?? alerts.length;
  const criticalCount    = alerts.filter((a) => a.severity === "critical" && !a.is_resolved).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Overview</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Riepilogo operativo in tempo reale.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }}
          >
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", refreshing && "animate-spin")} />
            Aggiorna
          </Button>
        </div>

        {/* KPI strip — 3 metriche core */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <Card className="border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Clienti totali</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
                  <Building2 className="h-4 w-4 text-info" />
                </div>
              </div>
              <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
                {totalClients}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="font-medium text-success">+12%</span>
                <span>questa settimana</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Progetti attivi</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                  <FolderKanban className="h-4 w-4 text-success" />
                </div>
              </div>
              <p className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
                {activeProjects}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="font-medium text-success">+8%</span>
                <span>questa settimana</span>
              </div>
            </CardContent>
          </Card>

          {/* Alert card — trattamento urgente se critici */}
          <Card className={cn(
            "border",
            criticalCount > 0 ? "border-error/40 bg-error/5" : "bg-card",
          )}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Alert non risolti</span>
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  criticalCount > 0 ? "bg-error/15" : "bg-warning/10",
                )}>
                  <AlertTriangle className={cn("h-4 w-4", criticalCount > 0 ? "text-error" : "text-warning")} />
                </div>
              </div>
              <p className={cn(
                "mt-3 font-display text-3xl font-bold tracking-tight",
                criticalCount > 0 ? "text-error" : "text-foreground",
              )}>
                {unresolvedAlerts}
              </p>
              <p className="mt-1.5 text-xs">
                {criticalCount > 0 ? (
                  <span className="font-semibold text-error">
                    {criticalCount} critico{criticalCount > 1 ? "i" : ""} — richiede attenzione
                  </span>
                ) : (
                  <span className="text-muted-foreground">Nessun alert critico</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main row: chart (hero 2/3) + alerts (1/3) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Activity chart */}
          <Card className="border bg-card lg:col-span-2">
            <CardHeader className="pb-0 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Attività settimanale
                </CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: "hsl(226 70% 66%)" }} />
                    AI Chats
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: "hsl(270 60% 55%)" }} />
                    Deploy
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-5 pt-4">
              <div ref={chartRef}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={activity} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chatsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(226 70% 66%)" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="hsl(226 70% 66%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="deployGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(270 60% 55%)" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="hsl(270 60% 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="chats"       stroke="none" fill="url(#chatsGrad)"  isAnimationActive={chartReady} />
                    <Area type="monotone" dataKey="deployments" stroke="none" fill="url(#deployGrad)" isAnimationActive={chartReady} />
                    <Line
                      type="monotone" dataKey="chats" name="AI Chats"
                      stroke="hsl(226 70% 66%)" strokeWidth={2} dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      isAnimationActive={chartReady} animationDuration={900}
                    />
                    <Line
                      type="monotone" dataKey="deployments" name="Deploy"
                      stroke="hsl(270 60% 55%)" strokeWidth={2} dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      isAnimationActive={chartReady} animationDuration={1100}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Alerts panel — gerarchia severità */}
          <Card className="border bg-card">
            <CardHeader className="pb-2 pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Alert attivi</CardTitle>
                <Link href="/alerts" className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  Vedi tutti <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-5">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-md border-l-2 px-3 py-2.5",
                    alert.severity === "critical" && "border-error bg-error/10",
                    alert.severity === "warning"  && "border-warning bg-warning/10",
                    alert.severity === "info"     && "border-info bg-info/10",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      alert.severity === "critical" && "text-error",
                      alert.severity === "warning"  && "text-warning",
                      alert.severity === "info"     && "text-info",
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-xs font-semibold leading-snug",
                        alert.severity === "critical" && "text-error",
                        alert.severity === "warning"  && "text-warning",
                        alert.severity === "info"     && "text-foreground",
                      )}>
                        {alert.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                        {alert.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(alert.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Nessun alert attivo</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent projects — cuore del gestionale */}
        <Card className="border bg-card">
          <CardHeader className="pb-0 pt-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">Progetti recenti</CardTitle>
              <Link href="/projects" className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                Vedi tutti <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="divide-y divide-border">
              {projects.slice(0, 5).map((project) => {
                const cfg = STATUS_CFG[project.status] ?? STATUS_CFG.archived;
                return (
                  <div key={project.id} className="group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/40">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", cfg.dot)} />

                    <div className="min-w-0 flex-1">
                      <Link href={`/projects/${project.id}`} className="text-sm font-medium text-foreground hover:underline">
                        {project.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{project.client_name}</p>
                    </div>

                    <span className={cn("hidden shrink-0 text-xs font-medium capitalize sm:block", cfg.text)}>
                      {project.status}
                    </span>

                    <span className="hidden shrink-0 text-sm tabular-nums text-foreground md:block">
                      {project.budget ? formatCurrency(project.budget) : "—"}
                    </span>

                    <Link href={`/projects/${project.id}`} className="shrink-0 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
