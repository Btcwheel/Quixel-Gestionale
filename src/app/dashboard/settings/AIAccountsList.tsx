'use client'

import { deleteAIAccount } from '@/app/actions/ai-accounts'
import { Button } from '@/components/ui/button'
import { Trash2, BrainCircuit } from 'lucide-react'
import { useState } from 'react'

function DeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
      disabled={loading}
      onClick={async () => { setLoading(true); await deleteAIAccount(id) }}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}

type AIAccount = {
  id: string
  account_name: string
  model_name: string
  provider: string
  total_credits: number
  remaining_credits: number
  is_active: boolean
}

export function AIAccountsList({ accounts }: { accounts: AIAccount[] }) {
  if (accounts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        <BrainCircuit className="h-8 w-8 mx-auto mb-2 opacity-20" />
        Nessun account AI configurato. Aggiungi la tua API key OpenRouter sopra.
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/40">
      {accounts.map(acc => (
        <div key={acc.id} className="flex items-center gap-4 px-5 py-4">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 flex-shrink-0">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{acc.account_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{acc.model_name}</p>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${acc.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
            {acc.is_active ? 'attivo' : 'disattivo'}
          </span>
          <DeleteButton id={acc.id} />
        </div>
      ))}
    </div>
  )
}
