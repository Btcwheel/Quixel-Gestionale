import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, Box, Clock, Users } from "lucide-react";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  planning: "Pianificazione",
  active: "Attivo",
  completed: "Completato",
  paused: "In pausa",
}

const STATUS_COLOR: Record<string, string> = {
  planning: "bg-blue-500/15 text-blue-400",
  active: "bg-emerald-500/15 text-emerald-400",
  completed: "bg-purple-500/15 text-purple-400",
  paused: "bg-yellow-500/15 text-yellow-400",
}

export default async function DashboardPage() {
  const supabase = await createClient();

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
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Box className="h-4 w-4" />} label="Progetti totali" value={all.length} />
        <KpiCard icon={<AlertTriangle className="h-4 w-4 text-red-400" />} label="Impantanati" value={stuck.length} accent="red" />
        <KpiCard icon={<Clock className="h-4 w-4 text-blue-400" />} label="Progetti miei" value={personal.length} accent="blue" />
        <KpiCard icon={<Users className="h-4 w-4 text-emerald-400" />} label="Progett clienti" value={clientProjects.length} accent="emerald" />
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold">Tutti i Progetti</h2>
          <Link href="/dashboard/projects" className="text-xs text-primary hover:underline">Gestisci →</Link>
        </div>
        <div className="divide-y divide-border/40">
          {all.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nessun progetto. <Link href="/dashboard/projects/new" className="text-primary hover:underline">Crea il primo</Link>
            </div>
          )}
          {all.map(project => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${project.is_stuck ? 'bg-red-500' : 'bg-emerald-500/50'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{project.name}</span>
                  {project.is_personal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">mio</span>
                  )}
                  {project.is_stuck && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 flex-shrink-0">impantanato</span>
                  )}
                </div>
                {project.next_action
                  ? <p className="text-xs text-muted-foreground truncate mt-0.5">→ {project.next_action}</p>
                  : <p className="text-xs text-muted-foreground/40 mt-0.5 italic">nessuna prossima azione</p>
                }
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block w-32 text-right truncate">
                {(project.client as any)?.name ?? '—'}
              </span>
              <div className="hidden sm:flex items-center gap-2 w-28 flex-shrink-0">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${project.is_stuck ? 'bg-red-500/60' : 'bg-primary'}`}
                    style={{ width: `${project.progress ?? 0}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{project.progress ?? 0}%</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[project.status] ?? 'bg-muted text-muted-foreground'}`}>
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: string }) {
  const border = accent === 'red' ? 'border-red-500/20' : accent === 'blue' ? 'border-blue-500/20' : accent === 'emerald' ? 'border-emerald-500/20' : 'border-border/50'
  return (
    <div className={`rounded-xl border ${border} bg-card shadow-sm p-5 flex items-center gap-4`}>
      <div className="p-2.5 rounded-lg bg-muted">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
