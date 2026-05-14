import { Box, Settings, Users, LayoutDashboard, CreditCard, KeyRound, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-[100dvh] w-full bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border/40 bg-background sm:flex">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/40">
          <Link className="flex items-center gap-2 font-bold" href="/">
            <Box className="h-6 w-6 text-primary" />
            <span className="text-xl tracking-tight">Quixel</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-4 text-sm font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>
            <Link
              href="/dashboard/clients"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
              <Users className="h-4 w-4" />
              Clienti
            </Link>
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
              <Box className="h-4 w-4" />
              Progetti
            </Link>
            <Link
              href="/dashboard/ideas"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
              <Lightbulb className="h-4 w-4" />
              Idee
            </Link>
            <Link
              href="/dashboard/vault"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
              <KeyRound className="h-4 w-4" />
              Vault
            </Link>
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
              <CreditCard className="h-4 w-4" />
              Fatturazione
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
              Impostazioni
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-border/40">
          <div className="flex items-center gap-3 rounded-lg p-3 bg-card border border-border/50 shadow-sm">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {initials}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold truncate">{email}</span>
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex flex-1 flex-col sm:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/95 backdrop-blur px-4 sm:px-6">
          <div className="w-full flex justify-between items-center">
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <form action={logoutAction}>
              <Button variant="outline" size="sm" type="submit">
                Esci
              </Button>
            </form>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
