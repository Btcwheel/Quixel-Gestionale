'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveMessage(sessionId: string, message: {
  id: string
  role: 'user' | 'assistant'
  parts: Array<{ type: string; text?: string }>
}) {
  const supabase = await createClient()
  await supabase.from('chat_messages').upsert({
    id: message.id,
    session_id: sessionId,
    role: message.role,
    parts: message.parts,
  }, { onConflict: 'id' })
}

export async function createChatSession(title: string, projectId: string | null = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      title,
      project_id: projectId,
      user_id: user.id
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/chats')
  return data
}

export async function deleteChatSession(id: string) {
  const supabase = await createClient()
  await supabase.from('chat_sessions').delete().eq('id', id)
  revalidatePath('/dashboard/chats')
}

export async function importChat(
  title: string,
  messages: Array<{ role: 'user' | 'assistant'; text: string }>,
  projectId: string | null = null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  // 1. Create session
  const { data: session, error: sessionErr } = await supabase
    .from('chat_sessions')
    .insert({
      title,
      project_id: projectId,
      user_id: user.id
    })
    .select()
    .single()

  if (sessionErr || !session) {
    throw new Error(sessionErr?.message ?? 'Errore creazione sessione')
  }

  // 2. Insert messages
  if (messages.length > 0) {
    const dbMessages = messages.map((m, index) => {
      // Create artificial timestamps sequentially to preserve order
      const createdAt = new Date(Date.now() - (messages.length - index) * 1000).toISOString()
      return {
        id: crypto.randomUUID(),
        session_id: session.id,
        role: m.role,
        parts: [{ type: 'text', text: m.text }],
        created_at: createdAt
      }
    })

    const { error: msgErr } = await supabase.from('chat_messages').insert(dbMessages)
    if (msgErr) {
      // Cleanup session if message insertion fails
      await supabase.from('chat_sessions').delete().eq('id', session.id)
      throw new Error(msgErr.message)
    }
  }

  revalidatePath('/dashboard/chats')
  return session
}
