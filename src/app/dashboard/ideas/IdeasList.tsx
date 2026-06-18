'use client'

import { deleteIdea } from '@/app/actions/ideas'
import { Trash2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

const CATEGORY_COLOR: Record<string, string> = {
  idea: 'bg-yellow-500/10 text-yellow-400',
  insight: 'bg-blue-500/10 text-blue-400',
  solution: 'bg-emerald-500/10 text-emerald-400',
  business: 'bg-purple-500/10 text-purple-400',
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
  project: { name: string } | null
}

export function IdeasList({ ideas, categoryLabel }: { ideas: Idea[]; categoryLabel: Record<string, string> }) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteIdea(id)
    setDeleting(null)
  }

  if (ideas.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground border-t-[3px] border-t-amber-500/50">
        <p className="text-sm">Nessuna idea ancora. Cattura la tua prima intuizione sopra.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {ideas.map(idea => (
        <div key={idea.id} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:border-amber-500/30 hover:shadow-amber-500/5 transition-all group">
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">{CATEGORY_EMOJI[idea.category] ?? '💡'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {idea.title && <p className="font-semibold text-sm">{idea.title}</p>}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[idea.category] ?? 'bg-muted text-muted-foreground'}`}>
                  {categoryLabel[idea.category] ?? idea.category}
                </span>
                {idea.project && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {idea.project.name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(idea.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{idea.content}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Link href={`/dashboard/ideas/${idea.id}`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-amber-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                disabled={deleting === idea.id}
                onClick={() => handleDelete(idea.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
