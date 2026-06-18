import { createClient } from "@/lib/supabase/server"
import { AlertTriangle, Box, Clock, Users } from "lucide-react"
import Link from "next/link"

const STATUS_LABEL: Record<string, string> = {
  planning: "Pianificazione",
  active: "Attivo",
  completed: "Completato",
  paused: "In pausa",
}

const STATUS_BADGE: Record<string, string> = {
  planning: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  completed: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  paused: "bg-slate-500/15 text-slate-400 border-slate-500/20",
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, progress, is_stuck, next_action, is_personal, client:clients(name)')
    .order('is_stuck', { ascending: false })
    .order('updated_at', { ascending: false })

  const all = projects ?? []
  const stuck = all.filter(p => p.is_stuck)
  const personal = all.filter(p => p.is_personal)
  const clientProjects = all.filter(p => !p.is_personal)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Panoramica</h2>
        <p className="mt-1 text-sm text-muted-foreground/80">Stato generale dei progetti e attività.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Box className="h-4 w-4" />}
          value={all.length}
          label="Progetti totali"
          gradient="from-blue-500 to-blue-600"
          glow="blue"
        />
        <KpiCard
          icon={<AlertTriangle className="h-4 w-4" />}
          value={stuck.length}
          label="Impantanati"
          gradient="from-rose-500 to-rose-600"
          glow="rose"
        />
        <KpiCard
          icon={<Clock className="h-4 w-4" />}
          value={personal.length}
          label="Progetti personali"
          gradient="from-violet-500 to-violet-600"
          glow="violet"
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          value={clientProjects.length}
          label="Progetti clienti"
          gradient="from-emerald-500 to-emerald-600"
          glow="emerald"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Box className="h-4 w-4 text-blue-400" />
            Tutti i Progetti
          </h3>
          <Link href="/dashboard/projects" className="text-xs font-medium text-primary hover:underline">
            Gestisci &rarr;
          </Link>
        </div>
        <div className="divide-y divide-border/40">
          {all.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Nessun progetto ancora.{" "}
              <Link href="/dashboard/projects/new" className="font-medium text-primary hover:underline">
                Crea il primo progetto
              </Link>
            </div>
          ) : (
            all.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-muted/30"
              >
                <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${project.is_stuck ? "bg-rose-500 shadow-sm shadow-rose-500/30" : "bg-emerald-500/60"}`} />
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="truncate text-sm font-semibold">{project.name}</span>
                  {project.is_personal && (
                    <span className="shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 ring-1 ring-violet-500/20">mio</span>
                  )}
                  {project.is_stuck && (
                    <span className="shrink-0 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 ring-1 ring-rose-500/20">bloccato</span>
                  )}
                </div>
                {project.next_action ? (
                  <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground/60 sm:block">
                    &rarr; {project.next_action}
                  </span>
                ) : null}
                <span className="hidden w-24 truncate text-right text-xs text-muted-foreground/50 sm:block">
                  {(project.client as unknown as { name: string } | null)?.name ?? "\u2014"}
                </span>
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${project.is_stuck ? "bg-rose-400/60" : "bg-primary"}`}
                      style={{ width: `${project.progress ?? 0}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-xs text-muted-foreground tabular-nums">{project.progress ?? 0}%</span>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                    STATUS_BADGE[project.status] ?? "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  value,
  label,
  gradient,
  glow,
}: {
  icon: React.ReactNode
  value: number
  label: string
  gradient: string
  glow: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all hover:shadow-lg hover:shadow-${glow}-500/10">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradient}/10 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-${glow}-500/20`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}
