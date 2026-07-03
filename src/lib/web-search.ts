const TAVILY_URL = 'https://api.tavily.com/search'

export interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilyResponse {
  results: TavilyResult[]
  answer: string | null
}

export async function searchWeb(query: string, maxResults = 5): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  console.log('[web-search] process.env.TAVILY_API_KEY presente:', !!apiKey)

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY non configurata. Aggiungila in .env.local')
  }

  const res = await fetch(TAVILY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
      include_answer: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tavily error (${res.status}): ${text}`)
  }

  const data = await res.json()

  return {
    results: (data.results ?? []).map((r: { title?: string; url?: string; content?: string; score?: number }) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.content ?? '',
      score: r.score ?? 0,
    })),
    answer: data.answer ?? null,
  }
}
