import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FullscreenChat } from "./FullscreenChat"

export default async function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [{ data: project, error }, { data: allAIAccounts }, { data: ideas }] = await Promise.all([
    supabase
      .from('projects')
      .select(`
        id, name, description, progress, is_stuck, next_action, status,
        client:clients(name),
        project_ai_pool_assignments(
          is_primary,
          ai_account:ai_accounts(id, account_name, model_name)
        )
      `)
      .eq('id', id)
      .single(),
    supabase.from('ai_accounts').select('id, account_name, model_name').order('created_at', { ascending: false }),
    supabase.from('ideas').select('id, title, status').eq('project_id', id).order('created_at', { ascending: false }).limit(5),
  ])

  if (error || !project) notFound()

  const assignments = (project.project_ai_pool_assignments ?? []) as unknown as Array<{ is_primary: boolean; ai_account: { id: string; account_name: string; model_name: string } | null }>
  const primary = assignments.find(a => a.is_primary) ?? assignments[0]
  const primaryAccount = primary?.ai_account ?? null

  // All active AI accounts for model switcher
  const aiAccounts = (allAIAccounts ?? []) as { id: string; account_name: string; model_name: string }[]

  // Get or create chat session
  let { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) {
    const { data: newSession } = await supabase
      .from('chat_sessions')
      .insert({ project_id: id, user_id: user.id, title: project.name })
      .select('id')
      .single()
    session = newSession
  }

  // Load existing messages
  const { data: savedMessages } = session
    ? await supabase
        .from('chat_messages')
        .select('id, role, parts, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })
    : { data: [] }

  const initialMessages = (savedMessages ?? []).map((m: { id: string; role: string; parts: unknown }) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    parts: m.parts as Array<{ type: string; text?: string }>,
  }))

  const projectSummary = {
    name: project.name,
    description: project.description ?? null,
    status: project.status ?? null,
    progress: project.progress ?? 0,
    is_stuck: project.is_stuck ?? false,
    next_action: project.next_action ?? null,
    client: (project.client as unknown as { name: string } | null)?.name ?? null,
    ideas: (ideas ?? []) as { id: string; title: string; status: string }[],
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background flex-shrink-0 border-l-[3px] border-l-blue-500">
        <Link href={`/dashboard/projects/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{project.name}</p>
          <p className="text-xs text-muted-foreground">
            {primaryAccount?.model_name ?? 'Nessun AI collegato — vai al progetto per configurarlo'}
          </p>
        </div>
        {project.next_action && (
          <p className="text-xs text-muted-foreground hidden sm:block max-w-xs truncate">
            → {project.next_action}
          </p>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden hidden sm:block">
            <div className={`h-full rounded-full ${project.is_stuck ? 'bg-rose-500/60' : 'bg-gradient-to-r from-blue-500 to-blue-400'}`}
              style={{ width: `${project.progress ?? 0}%` }} />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">{project.progress ?? 0}%</span>
        </div>
      </div>

      <FullscreenChat
        projectId={id}
        sessionId={session?.id ?? null}
        disabled={aiAccounts.length === 0}
        initialMessages={initialMessages}
        aiAccounts={aiAccounts}
        defaultAccountId={primaryAccount?.id ?? null}
        projectSummary={projectSummary}
      />
    </div>
  )
}
