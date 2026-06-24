import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, GitBranch, Globe, Activity, FolderGit2, Euro, Users, AlertTriangle, MessageSquare } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { AIPoolPanel } from "./AIPoolPanel"

const MaintenancePanel = dynamic(() => import('@/components/MaintenancePanel').then(m => ({ default: m.MaintenancePanel })))

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project, error }, { data: allAIAccounts }] = await Promise.all([
    supabase
      .from('projects')
      .select(`
        *,
        client:clients(name, email),
        external_accounts(*),
        project_ai_pool_assignments(
          ai_account_id, is_primary,
          ai_account:ai_accounts(id, account_name, model_name)
        )
      `)
      .eq('id', id)
      .single(),
    supabase.from('ai_accounts').select('id, account_name, model_name').order('created_at', { ascending: false })
  ])

  if (error || !project) notFound()

  const githubAccounts = project.external_accounts?.filter((a: { provider: string }) => a.provider === 'github') ?? []
  const vercelAccounts = project.external_accounts?.filter((a: { provider: string }) => a.provider === 'vercel') ?? []
  const assignments = (project.project_ai_pool_assignments ?? []) as unknown as Array<{ ai_account_id: string; is_primary: boolean; ai_account: { id: string; account_name: string; model_name: string } }>

  const STATUS_COLOR: Record<string, string> = {
    planning: 'bg-blue-500/15 text-blue-400',
    active: 'bg-emerald-500/15 text-emerald-400',
    completed: 'bg-purple-500/15 text-purple-400',
    paused: 'bg-yellow-500/15 text-yellow-400',
  }

  const primaryModel = assignments[0]?.ai_account?.model_name ?? 'nessun AI collegato'

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 border-l-[3px] border-l-blue-500 pl-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight truncate">{project.name}</h2>
            {project.is_stuck && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-medium flex-shrink-0">
                <AlertTriangle className="h-3 w-3" /> impantanato
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {(project.client as unknown as { name: string } | null)?.name ?? 'Nessun cliente'}
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[project.status] ?? 'bg-muted text-muted-foreground'}`}>
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm border-t-[3px] border-t-blue-500">
            <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm">
              <FolderGit2 className="h-4 w-4 text-blue-400" /> Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Avanzamento</span>
                  <span className="font-medium tabular-nums">{project.progress ?? 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${project.is_stuck ? 'bg-rose-500/60' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`}
                    style={{ width: `${project.progress ?? 0}%` }}
                  />
                </div>
              </div>
              {project.next_action && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">Prossima azione</span>
                  <p className="text-sm font-medium">{"→ " + project.next_action}</p>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Euro className="h-3.5 w-3.5" /> Budget
                  </span>
                  <span className="font-medium tabular-nums">{"€ " + project.budget.toLocaleString()}</span>
                </div>
              )}
              {project.description && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">Descrizione</span>
                  <p className="text-sm">{project.description}</p>
                </div>
              )}
              {project.notes && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">Note</span>
                  <p className="text-sm text-muted-foreground">{project.notes}</p>
                </div>
              )}
            </div>
          </div>

          <AIPoolPanel
            projectId={project.id}
            assignments={assignments}
            allAccounts={allAIAccounts ?? []}
          />
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm border-t-[3px] border-t-blue-500">
            <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
              <GitBranch className="h-4 w-4 text-blue-400" /> Repository GitHub
            </h3>
            {githubAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border/50 rounded-lg">
                Nessun repository collegato.
              </p>
            ) : (
              <div className="space-y-2">
                {githubAccounts.map((r: { id: string; name: string; github_full_name?: string; url?: string }) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background">
                    <GitBranch className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{r.github_full_name ?? r.name}</p>
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">{r.url}</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm border-t-[3px] border-t-blue-500">
            <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
              <Globe className="h-4 w-4 text-blue-400" /> Vercel / Hosting
            </h3>
            {vercelAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border/50 rounded-lg">
                Nessun deploy collegato.
              </p>
            ) : (
              <div className="space-y-2">
                {vercelAccounts.map((v: { id: string; name: string; url?: string }) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background">
                    <Activity className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{v.name}</p>
                      <a href={v.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">{v.url}</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <MaintenancePanel projectId={project.id} />

          <Link href={`/dashboard/projects/${project.id}/chat`}
            className="flex items-center gap-3 p-5 rounded-xl border border-border/50 bg-card shadow-sm hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group border-t-[3px] border-t-blue-500">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center text-blue-400 flex-shrink-0 ring-1 ring-blue-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors">Apri Chat AI</p>
              <p className="text-xs text-muted-foreground truncate">{primaryModel}</p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
