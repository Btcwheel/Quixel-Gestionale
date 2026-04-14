"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  clients: "Clients",
  projects: "Projects",
  "ai-pool": "AI Pool Management",
  "chat-logs": "Chat Logs",
  integrations: "Integrations",
  alerts: "Alerts",
  settings: "Settings",
  login: "Login",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPage = pathname?.split("/")[1] || "";
  const title = pageTitles[currentPage] || "Gestionale";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Admin</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
