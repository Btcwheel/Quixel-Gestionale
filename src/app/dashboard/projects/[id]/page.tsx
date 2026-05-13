import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, GitBranch, Globe, BrainCircuit, Activity,
  Settings, FolderGit2, Calendar, Euro, Users
} from "lucide-react"
import Link from "next/link"
import { ChatPanel } from "./ChatPanel"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(name, email),
      external_accounts(*),
      project_ai_pool_assignments(
        is_primary,
        ai_account:ai_accounts(account_name, provider, model_name, remaining_credits)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !project) {
    notFound()
  }

  const githubAccounts = project.external_accounts?.filter((acc: any) => acc.provider === 'github') || []
  const vercelAccounts = project.external_accounts?.filter((acc: any) => acc.provider === 'vercel') || []
  const aiPools = project.project_ai_pool_assignments || []

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" /> {project.client?.name || 'Cliente non associato'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" /> Gestisci
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <FolderGit2 className="h-5 w-5 text-primary" /> Info Progetto
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Stato</span>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                  {project.status.toUpperCase()}
                </span>
              </div>
              {project.budget && (
                <div>
                  <span className="text-muted-foreground flex items-center gap-2 mb-1">
                    <Euro className="h-4 w-4" /> Budget
                  </span>
                  <span className="font-medium">€ {project.budget.toLocaleString()}</span>
                </div>
              )}
              {project.description && (
                <div>
                  <span className="text-muted-foreground block mb-1">Descrizione</span>
                  <p className="text-foreground">{project.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Integrations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Pools Section */}
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-purple-500" /> AI Pools & LLM
              </h3>
              <Button variant="secondary" size="sm">Collega AI</Button>
            </div>
            {aiPools.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg text-center border border-dashed border-border/50">
                Nessuna intelligenza artificiale collegata a questo progetto.
              </div>
            ) : (
              <div className="grid gap-3">
                {aiPools.map((pool: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <BrainCircuit className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{pool.ai_account?.account_name}</p>
                        <p className="text-xs text-muted-foreground">{pool.ai_account?.model_name}</p>
                      </div>
                    </div>
                    {pool.is_primary && (
                      <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">Principale</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GitHub / Git Integrations */}
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-foreground" /> Repository GitHub
              </h3>
              <Button variant="secondary" size="sm">Collega Repo</Button>
            </div>
            {githubAccounts.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg text-center border border-dashed border-border/50">
                Nessun repository GitHub collegato.
              </div>
            ) : (
              <div className="grid gap-3">
                {githubAccounts.map((repo: any) => (
                  <div key={repo.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background">
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-5 w-5" />
                      <div>
                        <p className="font-medium text-sm">{repo.github_full_name}</p>
                        <a href={repo.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Vedi su GitHub</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hosting / Vercel Integrations */}
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" /> Deploy & Hosting (Vercel)
              </h3>
              <Button variant="secondary" size="sm">Collega Hosting</Button>
            </div>
            {vercelAccounts.length === 0 ? (
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg text-center border border-dashed border-border/50">
                Nessun ambiente di hosting collegato.
              </div>
            ) : (
              <div className="grid gap-3">
                {vercelAccounts.map((hosting: any) => (
                  <div key={hosting.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="font-medium text-sm">{hosting.name}</p>
                        <a href={hosting.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">{hosting.url}</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* AI Chat Panel */}
      <div className="mt-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-purple-500" /> Assistente AI del Progetto
        </h3>
        <ChatPanel projectId={project.id} />
      </div>

    </div>
  )
}
