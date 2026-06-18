import { Box, Settings, Users, LayoutDashboard, CreditCard, KeyRound, Lightbulb, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { logoutAction } from "@/app/actions/auth"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, color: "text-violet-400" },
  { href: "/dashboard/clients", label: "Clienti", icon: Users, color: "text-emerald-400" },
  { href: "/dashboard/projects", label: "Progetti", icon: Box, color: "text-blue-400" },
  { href: "/dashboard/ideas", label: "Idee", icon: Lightbulb, color: "text-amber-400" },
  { href: "/dashboard/chats", label: "Chat & Idee", icon: MessageSquare, color: "text-purple-400" },
  { href: "/dashboard/vault", label: "Vault", icon: KeyRound, color: "text-rose-400" },
  { href: "/dashboard/billing", label: "Fatturazione", icon: CreditCard, color: "text-cyan-400" },
  { href: "/dashboard/settings", label: "Impostazioni", icon: Settings, color: "text-slate-400" },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ""
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-[100dvh] w-full">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar sm:flex">
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/20">
            <Box className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">Quixel</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <div className={`flex h-5 w-5 items-center justify-center ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium text-sidebar-foreground">{email}</span>
              <span className="text-[10px] text-sidebar-foreground/40">Admin</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex flex-1 flex-col sm:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border/50 bg-background/80 backdrop-blur-xl px-6">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-sm font-semibold text-muted-foreground">Dashboard</h1>
            <form action={logoutAction}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Esci
              </Button>
            </form>
          </div>
        </header>
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
