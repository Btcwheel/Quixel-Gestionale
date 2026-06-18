'use client'

import { useState } from 'react'
import { createVaultEntry } from '@/app/actions/vault'
import { Button } from '@/components/ui/button'
import { Plus, X, Loader2, KeyRound } from 'lucide-react'

const PROVIDERS = ['github', 'supabase', 'vercel', 'redis', 'cloudflare', 'aws', 'docker', 'npm', 'stripe', 'altro']
const PLANS = ['free', 'pro', 'enterprise', 'pay-as-you-go']

type Project = { id: string; name: string }

export function AddCredentialDialog({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createVaultEntry(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Aggiungi credenziale
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-xl border border-border/50 shadow-2xl border-t-[3px] border-t-rose-500">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h3 className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4 text-rose-400" /> Nuova credenziale</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form action={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Progetto *</label>
              <select name="project_id" required
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50">
                <option value="">Seleziona...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Provider *</label>
              <select name="provider" required
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50">
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Label *</label>
            <input name="label" required placeholder="es. GitHub main account"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email login</label>
              <input name="login_email" type="email" placeholder="email@esempio.com"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Username</label>
              <input name="username" placeholder="username / org"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Secret / Token / Password *</label>
            <input name="secret" required type="password" placeholder="ghp_xxxx / token / password"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50" />
            <p className="text-xs text-muted-foreground">Cifrato con AES-256 prima di essere salvato.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Piano</label>
              <select name="plan"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50">
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">URL dashboard</label>
              <input name="url" type="url" placeholder="https://..."
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <textarea name="notes" rows={2} placeholder="CLI token scade il..., account condiviso con..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 resize-none" />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Annulla</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
