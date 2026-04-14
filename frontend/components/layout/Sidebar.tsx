"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Cpu,
  MessageSquare,
  Link2,
  Bell,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Building2 },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "AI Pool", href: "/ai-pool", icon: Cpu },
  { name: "Chat Logs", href: "/chat-logs", icon: MessageSquare },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Integrations", href: "/integrations", icon: Link2 },
  { name: "Alerts", href: "/alerts", icon: Bell },
];

function NavItem({
  item,
  isActive,
  index,
}: {
  item: (typeof navigation)[number];
  isActive: boolean;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={item.href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium overflow-hidden",
        "transition-all duration-300 ease-out-expo",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
      style={{
        animation: `slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) ${index * 80}ms both`,
      }}
    >
      {/* Active indicator bar on the left */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-6 w-1 rounded-r-full transition-all duration-300 ease-out-expo",
          isActive
            ? "bg-gradient-to-b from-primary to-primary-glow shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
            : "bg-transparent"
        )}
        style={{
          transform: isActive ? "translateY(-50%)" : "translateY(-50%) scaleX(0)",
          transformOrigin: "center",
        }}
      />

      {/* Background gradient for active state */}
      {isActive && (
        <span
          className="absolute inset-0 rounded-lg opacity-100 transition-opacity duration-300 ease-out-expo"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--primary) / 0.10) 0%, hsl(var(--primary) / 0.03) 60%, transparent 100%)",
          }}
        />
      )}

      {/* Hover background */}
      {!isActive && (
        <span
          className={cn(
            "absolute inset-0 rounded-lg transition-opacity duration-300 ease-out-expo",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--accent) / 0.50) 0%, hsl(var(--accent) / 0.15) 60%, transparent 100%)",
          }}
        />
      )}

      {/* Icon with subtle scale on hover */}
      <item.icon
        className={cn(
          "relative z-10 h-5 w-5 flex-shrink-0 transition-transform duration-300 ease-out-expo",
          isHovered && "scale-110"
        )}
      />

      {/* Label */}
      <span className="relative z-10">{item.name}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r relative overflow-hidden">
      {/* Subtle ambient gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          background:
            "radial-gradient(ellipse at 0% 50%, hsl(var(--primary)) 0%, transparent 70%)",
        }}
      />

      {/* Header / Logo */}
      <div className="relative flex h-16 items-center gap-2 border-b px-6 z-10">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ease-out-expo",
            "bg-gradient-primary shadow-glow"
          )}
        >
          <Cpu className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold font-display tracking-tight">
          Gestionale
        </span>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item, index) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return <NavItem key={item.name} item={item} isActive={isActive} index={index} />;
        })}
      </nav>

      {/* Footer section */}
      <div className="relative z-10 border-t px-3 py-3 space-y-1">
        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium overflow-hidden",
            "transition-all duration-300 ease-out-expo",
            pathname === "/settings"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {pathname === "/settings" && (
            <span
              className="absolute left-0 top-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-primary to-primary-glow shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
              style={{ transform: "translateY(-50%)" }}
            />
          )}
          {pathname === "/settings" && (
            <span
              className="absolute inset-0 rounded-lg"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary) / 0.10) 0%, hsl(var(--primary) / 0.03) 60%, transparent 100%)",
              }}
            />
          )}
          <Settings
            className={cn(
              "relative z-10 h-5 w-5 flex-shrink-0 transition-transform duration-300 ease-out-expo",
              "group-hover:scale-110"
            )}
          />
          <span className="relative z-10">Settings</span>
        </Link>

        {/* User profile section */}
        <div
          className={cn(
            "relative flex items-center gap-3 rounded-lg px-3 py-2.5 mt-1",
            "transition-all duration-300 ease-out-expo cursor-pointer",
            isProfileHovered && "bg-accent/50"
          )}
          onMouseEnter={() => setIsProfileHovered(true)}
          onMouseLeave={() => setIsProfileHovered(false)}
        >
          {/* Avatar with subtle glow */}
          <div
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-full font-semibold text-sm transition-all duration-300 ease-out-expo",
              "bg-gradient-primary text-primary-foreground",
              isProfileHovered && "shadow-glow scale-105"
            )}
          >
            A
          </div>

          {/* User info */}
          <div className="relative z-10 flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-foreground truncate">
              Admin
            </span>
            <span className="text-xs text-muted-foreground truncate">
              admin@gestionale.it
            </span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={cn(
              "relative z-10 flex h-7 w-7 items-center justify-center rounded-md",
              "text-muted-foreground hover:text-error hover:bg-error/10",
              "transition-all duration-300 ease-out-expo",
              "opacity-0 group-hover:opacity-100",
              isProfileHovered && "opacity-100"
            )}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
