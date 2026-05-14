import { createClient } from "@/lib/supabase/server"
import { BrainCircuit } from "lucide-react"
import { AddAIAccountForm } from "./AddAIAccountForm"
import { AIAccountsList } from "./AIAccountsList"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: aiAccounts } = await supabase
    .from('ai_accounts')
    .select('id, account_name, model_name, provider, total_credits, remaining_credits, is_active')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Impostazioni</h2>
        <p className="text-sm text-muted-foreground mt-1">Configura i tuoi account AI per usarli nei progetti.</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/50 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Account AI — OpenRouter</h3>
            <p className="text-xs text-muted-foreground">Aggiungi le tue API key. Vengono cifrate con AES-256 prima del salvataggio.</p>
          </div>
        </div>
        <div className="p-5 border-b border-border/50">
          <AddAIAccountForm />
        </div>
        <AIAccountsList accounts={aiAccounts ?? []} />
      </div>
    </div>
  )
}
