import { createClient } from "@/lib/supabase/server"
import { KeyRound } from "lucide-react"
import { VaultTable } from "./VaultTable"
import { AddCredentialDialog } from "./AddCredentialDialog"

export default async function VaultPage() {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('credential_vault')
    .select('*, project:projects(name)')
    .order('provider')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-rose-400" /> Vault
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Credenziali cifrate per tutti i progetti</p>
        </div>
        <AddCredentialDialog projects={projects ?? []} />
      </div>

      {(!entries || entries.length === 0) ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground">
          <KeyRound className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nessuna credenziale salvata.</p>
          <p className="text-xs mt-1">Aggiungi account GitHub, Supabase, Vercel e qualsiasi altro servizio.</p>
        </div>
      ) : (
        <VaultTable entries={entries} />
      )}
    </div>
  )
}
