'use client'

import { useState } from 'react'
import { assignAIToProject, removeAIFromProject } from '@/app/actions/ai-accounts'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Plus, Trash2, Star, Loader2 } from 'lucide-react'

type AIAccount = { id: string; account_name: string; model_name: string }
type Assignment = { ai_account_id: string; is_primary: boolean; ai_account: AIAccount }

export function AIPoolPanel({
  projectId,
  assignments,
  allAccounts,
}: {
  projectId: string
  assignments: Assignment[]
  allAccounts: AIAccount[]
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState('')

  const assignedIds = assignments.map(a => a.ai_account_id)
  const available = allAccounts.filter(a => !assignedIds.includes(a.id))

  async function handleAssign() {
    if (!selected) return
    setLoading('add')
    await assignAIToProject(projectId, selected, assignments.length === 0)
    setLoading(null)
    setShowAdd(false)
    setSelected('')
  }

  async function handleRemove(aiAccountId: string) {
    setLoading(aiAccountId)
    await removeAIFromProject(projectId, aiAccountId)
    setLoading(null)
  }

  async function handleSetPrimary(aiAccountId: string) {
    setLoading(aiAccountId + '-primary')
    await assignAIToProject(projectId, aiAccountId, true)
    setLoading(null)
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-purple-500" /> AI collegati
        </h3>
        {available.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-3.5 w-3.5" /> Collega
          </Button>
        )}
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4">
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Scegli account...</option>
            {available.map(a => (
              <option key={a.id} value={a.id}>{a.account_name} — {a.model_name}</option>
            ))}
          </select>
          <Button size="sm" onClick={handleAssign} disabled={!selected || loading === 'add'} className="h-9">
            {loading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aggiungi'}
          </Button>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg text-center border border-dashed border-border/50">
          Nessun AI collegato. Clicca &quot;Collega&quot; per associarne uno.
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => (
            <div key={a.ai_account_id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 flex-shrink-0">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{a.ai_account?.account_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{a.ai_account?.model_name}</p>
              </div>
              {a.is_primary && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">principale</span>
              )}
              {!a.is_primary && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-yellow-400"
                  onClick={() => handleSetPrimary(a.ai_account_id)}
                  disabled={loading === a.ai_account_id + '-primary'}>
                  <Star className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(a.ai_account_id)}
                disabled={loading === a.ai_account_id}>
                {loading === a.ai_account_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
