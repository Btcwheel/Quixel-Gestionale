"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  FolderKanban,
  Cpu,
  MessageSquare,
  Rocket,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Copy,
  Clock,
  Link2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, alertsApi } from "@/lib/api-endpoints";
import { cn, timeAgo } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import type { Alert } from "@/types";

/* ------------------------------------------------------------------ */
/*  Sample data – falls back to these when the API is unavailable.     */
/*  (Replace with real API calls when the backend is ready.)           */
/* ------------------------------------------------------------------ */
const sampleActivityData = [
  { date: "Mon", chats: 24, deployments: 3 },
  { date: "Tue", chats: 38, deployments: 5 },
  { date: "Wed", chats: 52, deployments: 8 },
  { date: "Thu", chats: 41, deployments: 6 },
  { date: "Fri", chats: 65, deployments: 10 },
  { date: "Sat", chats: 28, deployments: 2 },
  { date: "Sun", chats: 15, deployments: 1 },
];

const sampleAlerts = [
  { id: "1", severity: "critical" as const, title: "AI Account credits low", message: "OpenAI Account #3 has less than 10% credits remaining", created_at: new Date().toISOString(), is_resolved: false },
  { id: "2", severity: "warning" as const, title: "Sync failed", message: "GitHub sync failed for project 'SaaS Platform'", created_at: new Date(Date.now() - 3600000).toISOString(), is_resolved: false },
  { id: "3", severity: "info" as const, title: "New deployment", message: "Project 'Marketing Site' deployed to production", created_at: new Date(Date.now() - 7200000).toISOString(), is_resolved: false },
];

const sampleChats = [
  { id: "chat_abc123", conversation_id: "conv_xyz789", title: "Project Architecture Discussion", model: "gpt-4", created_at: new Date().toISOString(), message_count: 12 },
  { id: "chat_def456", conversation_id: "conv_uvw456", title: "API Design Review", model: "claude-2", created_at: new Date(Date.now() - 1800000).toISOString(), message_count: 8 },
  { id: "chat_ghi789", conversation_id: "conv_rst123", title: "Code Refactoring", model: "gpt-3.5-turbo", created_at: new Date(Date.now() - 3600000).toISOString(), message_count: 15 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function copyChatLink(conversationId: string) {
  const url = `${window.location.origin}/chat/${conversationId}`;
  navigator.clipboard.writeText(url);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return { greeting: "Good night", emoji: "" };
  if (hour < 12) return { greeting: "Good morning", emoji: "" };
  if (hour < 18) return { greeting: "Good afternoon", emoji: "" };
  return { greeting: "Good evening", emoji: "" };
}

function getModelIconBg(model: string): string {
  const m = model.toLowerCase();
  if (m.includes("gpt-4")) return "bg-emerald-500/10 text-emerald-500";
  if (m.includes("gpt")) return "bg-green-500/10 text-green-500";
  if (m.includes("claude")) return "bg-amber-500/10 text-amber-500";
  if (m.includes("llama")) return "bg-blue-500/10 text-blue-500";
  if (m.includes("mistral")) return "bg-violet-500/10 text-violet-500";
  return "bg-primary/10 text-primary";
}

function getModelInitials(model: string): string {
  const m = model.toLowerCase();
  if (m.includes("gpt-4")) return "G4";
  if (m.includes("gpt")) return "GPT";
  if (m.includes("claude")) return "Cl";
  if (m.includes("llama")) return "Ll";
  if (m.includes("mistral")) return "Mi";
  return model.slice(0, 2).toUpperCase();
}

function getAlertSemanticClasses(severity: string) {
  switch (severity) {
    case "critical":
      return {
        border: "border-l-error",
        bg: "bg-error-muted/30",
        icon: "text-error",
        badge: "bg-error-muted text-error-foreground border-error/30",
      };
    case "warning":
      return {
        border: "border-l-warning",
        bg: "bg-warning-muted/30",
        icon: "text-warning",
        badge: "bg-warning-muted text-warning-foreground border-warning/30",
      };
    case "info":
    default:
      return {
        border: "border-l-info",
        bg: "bg-info-muted/30",
        icon: "text-info",
        badge: "bg-info-muted text-info-foreground border-info/30",
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Custom Chart Tooltip                                               */
/* ------------------------------------------------------------------ */
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color: string; stroke: string }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{payload[0].name}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({
  title,
  value,
  icon: Icon,
  change,
  color = "text-primary",
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: { value: number; positive: boolean };
  color?: string;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={cn(
        "animate-slide-up opacity-0 transition-all duration-500 ease-out-expo",
        visible && "opacity-100",
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <Card className="group relative overflow-hidden rounded-xl border bg-gradient-card shadow-sm transition-all duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-glow">
        {/* Subtle warm overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-warm-overlay opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {/* Colored icon background */}
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15", color.replace("text-", "bg-").replace("500", "100").replace("400", "100").replace("600", "100"))}>
            <Icon className={cn("h-4 w-4 transition-colors duration-300", color)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="font-display text-3xl font-bold tracking-tight">{value}</div>
          {change && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {change.positive ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-error" />
              )}
              <span className={cn("font-medium", change.positive ? "text-success" : "text-error")}>
                {change.value}%
              </span>
              <span>from last week</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Alert Item                                                */
/* ------------------------------------------------------------------ */
function AlertItem({ alert, index }: { alert: Alert; index: number }) {
  const [visible, setVisible] = useState(false);
  const semantic = getAlertSemanticClasses(alert.severity);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 80);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={cn(
        "animate-slide-up opacity-0 rounded-md border-l-4 p-3 transition-all duration-500 ease-out-expo",
        semantic.border,
        semantic.bg,
        visible && "opacity-100",
      )}
      style={{ animationDelay: `${100 + index * 80}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn("mt-0.5 h-4 w-4 flex-shrink-0", semantic.icon)} />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{alert.title}</p>
          <p className="text-xs text-muted-foreground">{alert.message}</p>
          <p className="text-xs text-muted-foreground">{timeAgo(alert.created_at)}</p>
        </div>
        <Badge className={cn("text-xs capitalize", semantic.badge)} variant="outline">
          {alert.severity}
        </Badge>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat Item with hover-reveal buttons                                */
/* ------------------------------------------------------------------ */
function ChatItem({ chat, index }: { chat: typeof sampleChats[number]; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 100);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={cn(
        "animate-slide-up opacity-0 group relative overflow-hidden rounded-lg border border-transparent p-4 transition-all duration-500 ease-out-expo",
        "hover:border-border hover:bg-gradient-card hover:shadow-sm",
        visible && "opacity-100",
      )}
      style={{ animationDelay: `${100 + index * 100}ms`, animationFillMode: "forwards" }}
    >
      {/* Warm overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-warm-overlay opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-center gap-4">
        {/* Model avatar */}
        <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold", getModelIconBg(chat.model))}>
          {getModelInitials(chat.model)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold">{chat.title}</h4>
            <Badge variant="outline" className="text-xs shrink-0">
              {chat.model}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {chat.message_count} messages
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(chat.created_at)}
            </span>
          </div>
        </div>

        {/* Hover-reveal action buttons */}
        <div className="flex shrink-0 items-center gap-2 opacity-0 translate-x-2 transition-all duration-300 ease-out-expo group-hover:opacity-100 group-hover:translate-x-0">
          <a
            href={`/chat/${chat.conversation_id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-glow"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
          <button
            onClick={() => copyChatLink(chat.conversation_id)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
            title="Copy link"
          >
            <Link2 className="h-3 w-3" />
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Page                                                */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { greeting } = getGreeting();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartAnimated, setChartAnimated] = useState(false);

  // Try to fetch real data, fall back to sample when API unavailable
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await dashboardApi.stats();
      return res.data;
    },
    retry: false,
  });

  const { data: alerts } = useQuery({
    queryKey: ["alerts", false],
    queryFn: async () => {
      const res = await alertsApi.list(false);
      return res.data;
    },
    retry: false,
  });

  const { data: activityData } = useQuery({
    queryKey: ["dashboard-activity", 7],
    queryFn: async () => {
      const res = await dashboardApi.activity(7);
      return res.data;
    },
    retry: false,
  });

  // Observe chart visibility for entrance animation
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChartAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const displayStats = stats || {
    total_clients: 12,
    active_projects: 28,
    total_projects: 45,
    ai_accounts_active: 18,
    total_chats_today: 156,
    total_deployments: 89,
    unresolved_alerts: (alerts?.length || 3),
  };

  const displayAlerts = alerts?.length ? alerts : sampleAlerts;
  const displayActivity = activityData || sampleActivityData;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                {greeting}
              </span>
            </h2>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your projects and AI usage.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={cn("mr-2 h-4 w-4 transition-transform", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* ---------- Stats Grid ---------- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Clients"
            value={displayStats.total_clients}
            icon={Building2}
            change={{ value: 12, positive: true }}
            color="text-info"
            delay={0}
          />
          <StatCard
            title="Active Projects"
            value={displayStats.active_projects}
            icon={FolderKanban}
            change={{ value: 8, positive: true }}
            color="text-success"
            delay={100}
          />
          <StatCard
            title="AI Accounts Active"
            value={displayStats.ai_accounts_active}
            icon={Cpu}
            color="text-purple-500"
            delay={200}
          />
          <StatCard
            title="Chats Today"
            value={displayStats.total_chats_today}
            icon={MessageSquare}
            change={{ value: 23, positive: true }}
            color="text-primary"
            delay={300}
          />
        </div>

        {/* ---------- Charts Row ---------- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Activity Chart */}
          <Card className="col-span-4 overflow-hidden border bg-gradient-card shadow-sm" ref={chartRef}>
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayActivity}>
                  <defs>
                    {/* Gradient fill under the chats line */}
                    <linearGradient id="chatsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    {/* Gradient fill under the deployments line */}
                    <linearGradient id="deployGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" strokeOpacity={0.4} />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  {/* Gradient area fills */}
                  <Area
                    type="monotone"
                    dataKey="chats"
                    stroke="none"
                    fill="url(#chatsGrad)"
                    isAnimationActive={chartAnimated}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={200}
                  />
                  <Area
                    type="monotone"
                    dataKey="deployments"
                    stroke="none"
                    fill="url(#deployGrad)"
                    isAnimationActive={chartAnimated}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={400}
                  />
                  {/* Lines that draw in on load */}
                  <Line
                    type="monotone"
                    dataKey="chats"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
                    activeDot={{ r: 5 }}
                    name="AI Chats"
                    isAnimationActive={chartAnimated}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={200}
                  />
                  <Line
                    type="monotone"
                    dataKey="deployments"
                    stroke="hsl(var(--accent-muted))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--accent))", strokeWidth: 2, stroke: "hsl(var(--card))" }}
                    activeDot={{ r: 5 }}
                    name="Deployments"
                    isAnimationActive={chartAnimated}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    animationBegin={400}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="col-span-3 overflow-hidden border bg-gradient-card shadow-sm">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayAlerts.slice(0, 5).map((alert, i) => (
                  <AlertItem key={alert.id} alert={alert} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------- Recent Chats ---------- */}
        <Card className="overflow-hidden border bg-gradient-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent AI Chats</CardTitle>
              <a href="/chat-logs" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                View All
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleChats.map((chat, i) => (
                <ChatItem key={chat.id} chat={chat} index={i} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ---------- Quick Stats ---------- */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group overflow-hidden rounded-xl border bg-gradient-card shadow-sm transition-all duration-300 ease-out-expo hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Total Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Rocket className="h-5 w-5 text-success" />
                </div>
                <span className="font-display text-2xl font-bold">{displayStats.total_deployments}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>
          <Card className="group overflow-hidden rounded-xl border bg-gradient-card shadow-sm transition-all duration-300 ease-out-expo hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <FolderKanban className="h-5 w-5 text-info" />
                </div>
                <span className="font-display text-2xl font-bold">{displayStats.total_projects}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {displayStats.active_projects} active
              </p>
            </CardContent>
          </Card>
          <Card className="group overflow-hidden rounded-xl border bg-gradient-card shadow-sm transition-all duration-300 ease-out-expo hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Unresolved Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <span className="font-display text-2xl font-bold">{displayStats.unresolved_alerts}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
