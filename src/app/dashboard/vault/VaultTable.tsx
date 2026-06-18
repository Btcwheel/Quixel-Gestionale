'use client'

import { useState } from 'react'
import { revealSecret, deleteVaultEntry } from '@/app/actions/vault'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy, Trash2, Check } from 'lucide-react'

const PLAN_COLOR: Record<string, string> = {
  free: 'bg-yellow-500/10 text-yellow-400',
  pro: 'bg-emerald-500/10 text-emerald-400',
  enterprise: 'bg-purple-500/10 text-purple-400',
}

type Entry = {
  id: string
  provider: string
  label: string
  login_email: string | null
  username: string | null
  plan: string
  url: string | null
  notes: string | null
  project: { name: string } | null
}

export function VaultTable({ entries }: { entries: Entry[] }) {
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleReveal(id: string) {
    if (revealed[id]) {
      setRevealed(prev => { const n = { ...prev }; delete n[id]; return n })
      return
    }
    setLoading(id)
    const { secret, error } = await revealSecret(id)
    setLoading(null)
    if (secret) setRevealed(prev => ({ ...prev, [id]: secret }))
    if (error) alert(error)
  }

  async function handleCopy(id: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa credenziale?')) return
    await deleteVaultEntry(id)
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden border-t-[3px] border-t-rose-500">
      <div className="relative w-full overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-rose-500/10 border-b border-border/50">
            <tr>
              <th className="h-11 px-4 text-left font-medium text-rose-400">Provider</th>
              <th className="h-11 px-4 text-left font-medium text-rose-400">Label / Progetto</th>
              <th className="h-11 px-4 text-left font-medium text-rose-400 hidden md:table-cell">Email / Username</th>
              <th className="h-11 px-4 text-left font-medium text-rose-400">Piano</th>
              <th className="h-11 px-4 text-left font-medium text-rose-400">Secret</th>
              <th className="h-11 px-4 w-[80px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {entries.map(entry => (
              <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium capitalize">{entry.provider}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{entry.label}</div>
                  <div className="text-xs text-muted-foreground">{entry.project?.name ?? '—'}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                  {entry.login_email || entry.username || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLOR[entry.plan] ?? 'bg-muted text-muted-foreground'}`}>
                    {entry.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {revealed[entry.id] ? (
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded max-w-[200px] truncate block">
                        {revealed[entry.id]}
                      </code>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"
                        onClick={() => handleCopy(entry.id, revealed[entry.id])}>
                        {copied === entry.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">••••••••••••</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => handleReveal(entry.id)}
                      disabled={loading === entry.id}>
                      {revealed[entry.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
