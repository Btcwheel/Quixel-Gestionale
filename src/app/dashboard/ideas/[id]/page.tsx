import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { IdeaChat } from "./IdeaChat"
import { IdeaHeader } from "./IdeaHeader"

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [{ data: idea }, { data: allAIAccounts }] = await Promise.all([
    supabase.from('ideas').select('id, title, content, category, created_at').eq('id', id).single(),
    supabase.from('ai_accounts').select('id, account_name, model_name').order('created_at', { ascending: false }),
  ])

  if (!idea) notFound()

  const aiAccounts = (allAIAccounts ?? []) as { id: string; account_name: string; model_name: string }[]
  const defaultAccountId = aiAccounts[0]?.id ?? null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <IdeaHeader idea={idea} />
      <IdeaChat idea={idea} aiAccounts={aiAccounts} defaultAccountId={defaultAccountId} />
    </div>
  )
}
