import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/server"
import { BrainCircuit, Key, Save, Plus } from "lucide-react"
import { revalidatePath } from "next/cache"

export default async function SettingsPage() {
  const supabase = await createClient()

  // Fetch AI Accounts
  const { data: aiAccounts } = await supabase
    .from('ai_accounts')
    .select('*')
    .order('created_at', { ascending: false })

  async function addAIAccount(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const provider = formData.get('provider') as string
    const account_name = formData.get('account_name') as string
    const model_name = formData.get('model_name') as string
    const api_key = formData.get('api_key') as string
    const credits = parseFloat(formData.get('credits') as string) || 0

    // In a real app we would encrypt this. For now we simulate it.
    await supabase.from('ai_accounts').insert([{
      provider,
      account_name,
      model_name,
      api_key_encrypted: api_key, // Simulated encryption
      total_credits: credits,
      remaining_credits: credits
    }])
    
    revalidatePath('/dashboard/settings')
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Impostazioni & Integrazioni</h2>
          <p className="text-muted-foreground">Gestisci le chiavi API, i pool di Intelligenza Artificiale e le integrazioni esterne.</p>
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* AI Pools Management */}
        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Gestione AI Pools</h3>
              <p className="text-sm text-muted-foreground">Configura gli account OpenAI, Anthropic, ecc. da assegnare poi ai progetti.</p>
            </div>
          </div>
          
          <div className="p-6">
            <form action={addAIAccount} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-8 p-4 bg-muted/20 rounded-lg border border-border/50">
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium">Provider</label>
                <select name="provider" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors">
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="mistral">Mistral AI</option>
                  <option value="groq">Groq</option>
                  <option value="perplexity">Perplexity</option>
                  <option value="cohere">Cohere</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="azure">Azure OpenAI</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="custom">API Custom</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium">Nome Account</label>
                <input name="account_name" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors" placeholder="Es. OpenAI Primario" />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium">Modello</label>
                <input name="model_name" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors" placeholder="Es. gpt-4-turbo" />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium">Crediti ($)</label>
                <input name="credits" type="number" step="0.1" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors" placeholder="10.00" />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-xs font-medium">API Key</label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input name="api_key" type="password" required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors pl-8" placeholder="sk-..." />
                </div>
              </div>
              <div className="md:col-span-1">
                <Button type="submit" className="w-full gap-2 h-9">
                  <Plus className="h-4 w-4" /> Aggiungi
                </Button>
              </div>
            </form>

            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b [&_tr]:border-border/50">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Account</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Provider</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Modello</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Crediti Residui</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {(!aiAccounts || aiAccounts.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        Nessun account AI configurato.
                      </td>
                    </tr>
                  ) : (
                    aiAccounts.map((acc) => (
                      <tr key={acc.id} className="border-b border-border/50 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{acc.account_name}</td>
                        <td className="p-4 align-middle capitalize">{acc.provider}</td>
                        <td className="p-4 align-middle text-muted-foreground">{acc.model_name}</td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${Math.min(100, (acc.remaining_credits / acc.total_credits) * 100 || 0)}%` }}></div>
                            </div>
                            <span className="text-xs text-muted-foreground">${acc.remaining_credits} / ${acc.total_credits}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-500">
                            Attivo
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
