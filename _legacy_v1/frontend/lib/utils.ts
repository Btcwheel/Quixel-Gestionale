import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(d);
}

export function getProviderIcon(provider: string): string {
  const icons: Record<string, string> = {
    openai: "🟢",
    anthropic: "🟠",
    google: "🔵",
    mistral: "🟣",
    cohere: "🔴",
    groq: "⚡",
    together: "🟡",
  };
  return icons[provider.toLowerCase()] || "⚪";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planning: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };
  return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}
