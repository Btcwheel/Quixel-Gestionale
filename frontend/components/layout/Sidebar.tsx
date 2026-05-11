"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  BrainCircuit,
  MessageSquare,
  FileText,
  Plug2,
  Bell,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/ai-pool", label: "AI Pool", icon: BrainCircuit },
  { href: "/chat-logs", label: "Chat Logs", icon: MessageSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/integrations", label: "Integrations", icon: Plug2 },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: 3 },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shadow-glow"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
          Quixel
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[17px] w-[17px] shrink-0 transition-colors duration-150",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {"badge" in item && item.badge && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
            pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings
            className={cn(
              "h-[17px] w-[17px] shrink-0",
              pathname === "/settings" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span>Settings</span>
        </Link>

        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground leading-tight">Admin</p>
            <p className="truncate text-xs text-muted-foreground leading-tight">quixel</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
