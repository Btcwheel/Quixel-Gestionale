'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/embeddings'
import { revalidatePath } from 'next/cache'

export async function createIdea(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category = formData.get('category') as string || 'idea'
  const project_id = formData.get('project_id') as string || null

  if (!content?.trim()) return { error: 'Il contenuto è obbligatorio' }

  const textToEmbed = [title, content].filter(Boolean).join('\n')
  const embedding = await generateEmbedding(textToEmbed)

  const { error } = await supabase.from('ideas').insert([{
    title: title || null,
    content,
    category,
    project_id: project_id || null,
    embedding: embedding ? JSON.stringify(embedding) : null,
  }])

  if (error) return { error: error.message }

  revalidatePath('/dashboard/ideas')
  return { success: true }
}

export async function deleteIdea(id: string) {
  const supabase = await createClient()
  await supabase.from('ideas').delete().eq('id', id)
  revalidatePath('/dashboard/ideas')
}

export async function searchIdeas(query: string, limit = 5): Promise<any[]> {
  const supabase = await createClient()

  const embedding = await generateEmbedding(query)

  if (embedding) {
    const { data } = await supabase.rpc('search_ideas', {
      query_embedding: JSON.stringify(embedding),
      match_count: limit,
      match_threshold: 0.4,
    })
    if (data && data.length > 0) return data
  }

  // Fallback full-text search
  const { data } = await supabase
    .from('ideas')
    .select('id, title, content, category, project_id')
    .ilike('content', `%${query}%`)
    .limit(limit)

  return data ?? []
}
