"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "Clients",
  "/projects": "Projects",
  "/ai-pool": "AI Pool",
  "/chat-logs": "Chat Logs",
  "/documents": "Documents",
  "/integrations": "Integrations",
  "/alerts": "Alerts",
  "/settings": "Settings",
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key)) return title;
  }
  return "Gestionale Quixel";
}

export function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/60 px-6 backdrop-blur-sm">
      <h1 className="font-display text-[17px] font-semibold text-foreground tracking-tight">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-all duration-150 hover:border-border/80 hover:bg-muted hover:text-foreground">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 flex h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>

        {/* Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          A
        </div>
      </div>
    </header>
  );
}
