import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FullscreenChat } from "./FullscreenChat"

export default async function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id, name, description, progress, is_stuck, next_action,
      project_ai_pool_assignments(
        is_primary,
        ai_account:ai_accounts(account_name, model_name)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !project) notFound()

  const assignments = (project.project_ai_pool_assignments ?? []) as any[]
  const primary = assignments.find(a => a.is_primary) ?? assignments[0]
  const modelName = primary?.ai_account?.model_name ?? null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background flex-shrink-0">
        <Link href={`/dashboard/projects/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{project.name}</p>
          <p className="text-xs text-muted-foreground">
            {modelName ?? 'Nessun AI collegato — vai al progetto per configurarlo'}
          </p>
        </div>
        {project.next_action && (
          <p className="text-xs text-muted-foreground hidden sm:block max-w-xs truncate">
            → {project.next_action}
          </p>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden hidden sm:block">
            <div className={`h-full rounded-full ${project.is_stuck ? 'bg-red-500/60' : 'bg-primary'}`}
              style={{ width: `${project.progress ?? 0}%` }} />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">{project.progress ?? 0}%</span>
        </div>
      </div>

      <FullscreenChat projectId={id} disabled={!modelName} />
    </div>
  )
}
