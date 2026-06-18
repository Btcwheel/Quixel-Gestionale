'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_COLOR: Record<string, string> = {
  idea: 'bg-yellow-500/10 text-yellow-400',
  insight: 'bg-blue-500/10 text-blue-400',
  solution: 'bg-emerald-500/10 text-emerald-400',
  business: 'bg-purple-500/10 text-purple-400',
}

const CATEGORY_LABEL: Record<string, string> = {
  idea: 'Idea',
  insight: 'Insight',
  solution: 'Soluzione',
  business: 'Business',
}

const CATEGORY_EMOJI: Record<string, string> = {
  idea: '💡',
  insight: '🔍',
  solution: '⚡',
  business: '🚀',
}

type Idea = {
  id: string
  title: string | null
  content: string
  category: string
  created_at: string
}

export function IdeaHeader({ idea }: { idea: Idea }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = idea.content.length > 200

  return (
    <div className="flex-shrink-0 border-b border-border/50 bg-background px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard/ideas"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Torna alle idee
        </Link>

        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{CATEGORY_EMOJI[idea.category] ?? '💡'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {idea.title && <h1 className="font-bold text-lg">{idea.title}</h1>}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CATEGORY_COLOR[idea.category] ?? 'bg-muted text-muted-foreground'}`}>
                {CATEGORY_LABEL[idea.category] ?? idea.category}
              </span>
              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                {new Date(idea.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
              {idea.content}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {expanded ? 'Mostra meno' : 'Mostra tutto'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
