'use client'

import { useState, useRef } from 'react'
import { createIdea } from '@/app/actions/ideas'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'

const CATEGORIES = [
  { value: 'idea', label: '💡 Idea', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { value: 'insight', label: '🔍 Insight', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'solution', label: '⚡ Soluzione', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'business', label: '🚀 Business', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
]

type Project = { id: string; name: string }

export function IdeaCapture({ projects }: { projects: Project[] }) {
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('idea')
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    formData.set('category', category)
    setLoading(true)
    const result = await createIdea(formData)
    setLoading(false)
    if (!result?.error) {
      formRef.current?.reset()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-semibold">Cattura idea</span>
        <span className="text-xs text-muted-foreground ml-auto">viene vettorizzata automaticamente</span>
      </div>

      {/* Categoria */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.value} type="button"
            onClick={() => setCategory(c.value)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${category === c.value ? c.color : 'border-border/50 text-muted-foreground hover:border-border'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <form ref={formRef} action={handleSubmit} className="space-y-3">
        <input name="title" placeholder="Titolo (opzionale)"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />

        <textarea name="content" required rows={3}
          placeholder="Scrivi l'idea, anche in modo grezzo. Connetti i punti, descrivi il problema che risolve, il mercato, la soluzione alternativa che hai trovato..."
          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />

        <div className="flex gap-3 items-center">
          <select name="project_id"
            className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Nessun progetto (idea libera)</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <Button type="submit" disabled={loading} className="gap-2 flex-shrink-0">
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvo...</>
              : success
              ? '✓ Salvata'
              : 'Salva idea'
            }
          </Button>
        </div>
      </form>
    </div>
  )
}
