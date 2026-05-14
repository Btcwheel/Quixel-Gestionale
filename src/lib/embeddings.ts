// Supabase AI embedding via gte-small (384 dims, free, no external key needed)

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY non configurata — embedding saltato')
    return null
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-embed`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text.slice(0, 8000) }),
    })

    if (!res.ok) {
      // Fallback: usa l'endpoint inference nativo di Supabase
      return await generateEmbeddingNative(text, supabaseUrl!, serviceRoleKey)
    }

    const data = await res.json()
    return data.embedding ?? data[0]?.embedding ?? null
  } catch {
    return await generateEmbeddingNative(text, supabaseUrl!, serviceRoleKey)
  }
}

async function generateEmbeddingNative(text: string, url: string, key: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${url}/ai/v1/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'gte-small', input: text.slice(0, 8000) }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data?.data?.[0]?.embedding ?? null
  } catch {
    return null
  }
}
