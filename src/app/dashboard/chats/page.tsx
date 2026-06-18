import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ChatsHubClient } from "./ChatsHubClient"

export default async function ChatsPage({
  searchParams
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { id: activeSessionId } = await searchParams

  const [
    { data: sessions },
    { data: projects },
    { data: aiAccounts }
  ] = await Promise.all([
    supabase
      .from('chat_sessions')
      .select(`
        id, title, project_id, updated_at,
        project:projects(name, is_personal)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, is_personal')
      .order('name'),
    supabase
      .from('ai_accounts')
      .select('id, account_name, model_name')
      .order('created_at', { ascending: false })
  ])

  // Load initial messages for active session if provided
  interface DBMessage {
    id: string
    role: 'user' | 'assistant'
    parts: Array<{ type: string; text?: string }>
    created_at: string
  }

  let initialMessages: DBMessage[] = []
  if (activeSessionId) {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, role, parts, created_at')
      .eq('session_id', activeSessionId)
      .order('created_at', { ascending: true })
    initialMessages = (data ?? []) as DBMessage[]
  }

  const defaultAccountId = aiAccounts?.[0]?.id ?? null

  interface ChatSession {
    id: string
    title: string | null
    project_id: string | null
    updated_at: string
    project?: { name: string; is_personal: boolean } | null
  }

  interface AIAccount {
    id: string
    account_name: string
    model_name: string
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Centro Chat & Idee</h2>
        <p className="mt-1 text-sm text-muted-foreground/80">
          Brainstorming globale, importazione di chat storiche e cattura immediata delle idee.
        </p>
      </div>

      <ChatsHubClient
        initialSessions={(sessions ?? []) as unknown as ChatSession[]}
        projects={projects ?? []}
        aiAccounts={(aiAccounts ?? []) as unknown as AIAccount[]}
        defaultAccountId={defaultAccountId}
        initialActiveSessionId={activeSessionId ?? null}
        initialMessages={initialMessages}
      />
    </div>
  )
}
