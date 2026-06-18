import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, FolderGit2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  webapp: 'Web App', website: 'Sito Web', mobile: 'Mobile', saas: 'SaaS', tool: 'Tool',
}

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  idea:     { label: '💡 Idea',           color: 'bg-slate-500/15 text-slate-400' },
  building: { label: '🔨 Building',       color: 'bg-blue-500/15 text-blue-400' },
  mvp:      { label: '🚀 MVP',            color: 'bg-violet-500/15 text-violet-400' },
  live:     { label: '✅ Live',           color: 'bg-emerald-500/15 text-emerald-500' },
  paused:   { label: '⏸ Pausa',          color: 'bg-amber-500/15 text-amber-400' },
  archived: { label: '📦 Archiviato',    color: 'bg-muted text-muted-foreground' },
}

const MON_CONFIG: Record<string, { label: string; color: string }> = {
  experimental: { label: '🧪 Exp',    color: 'bg-muted text-muted-foreground' },
  free:         { label: '🆓 Free',   color: 'bg-slate-500/15 text-slate-400' },
  freemium:     { label: '⚡ Freemium', color: 'bg-cyan-500/15 text-cyan-400' },
  paid:         { label: '💰 Paid',   color: 'bg-emerald-500/15 text-emerald-500' },
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  
  // Fetch projects from Supabase with client details
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Progetti</h2>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuovo Progetto
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm overflow-hidden border-t-[3px] border-t-blue-500">
        <div className="p-4 border-b border-border/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
            <input
              type="search"
              placeholder="Cerca progetto..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 pl-8"
            />
          </div>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b [&_tr]:border-border/50 bg-blue-500/10">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-blue-400">Nome Progetto</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-blue-400">Tipo</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-blue-400">Fase</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-blue-400">Modello</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-blue-400 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {(!projects || projects.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderGit2 className="h-8 w-8 opacity-50" />
                      <p>Nessun progetto trovato nel database.</p>
                      <p className="text-xs">Clicca &quot;Nuovo Progetto&quot; per iniziare un nuovo lavoro.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b border-border/50 transition-colors hover:bg-blue-500/5">
                    <td className="p-4 align-middle">
                      <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline text-primary">
                        {project.name}
                      </Link>
                      {project.client?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5">{project.client.name}</p>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {TYPE_LABELS[project.project_type] ?? project.project_type ?? '-'}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      {(() => {
                        const s = STAGE_CONFIG[project.stage] ?? { label: project.stage ?? '-', color: 'bg-muted text-muted-foreground' }
                        return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span>
                      })()}
                    </td>
                    <td className="p-4 align-middle">
                      {(() => {
                        const m = MON_CONFIG[project.monetization] ?? { label: project.monetization ?? '-', color: 'bg-muted text-muted-foreground' }
                        return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${m.color}`}>{m.label}</span>
                      })()}
                    </td>
                    <td className="p-4 align-middle">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
