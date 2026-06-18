'use client'

import { useState } from 'react'
import { createAIAccount } from '@/app/actions/ai-accounts'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const MODEL_GROUPS = [
  {
    group: 'OpenCode Go',
    models: [
      { label: 'DeepSeek V4 Flash (OpenCode)', value: 'opencode-go/deepseek-v4-flash' },
      { label: 'Kimi K2.7 Code (OpenCode)', value: 'opencode-go/kimi-k2.7-code' },
      { label: 'GLM 5.1 (OpenCode)', value: 'opencode-go/glm-5.1' },
    ]
  },
  {
    group: 'OpenRouter',
    models: [
      { label: 'Claude Opus 4.7', value: 'anthropic/claude-opus-4-7' },
      { label: 'Claude Sonnet 4.6', value: 'anthropic/claude-sonnet-4-6' },
      { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4-5' },
      { label: 'GPT-4o', value: 'openai/gpt-4o' },
      { label: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' },
      { label: 'o3', value: 'openai/o3' },
      { label: 'o4-mini', value: 'openai/o4-mini' },
      { label: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro-preview' },
      { label: 'Gemini 2.5 Flash', value: 'google/gemini-2.5-flash-preview' },
      { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
      { label: 'DeepSeek V3', value: 'deepseek/deepseek-chat-v3-5' },
      { label: 'Llama 4 Maverick', value: 'meta-llama/llama-4-maverick' },
      { label: 'Mistral Large', value: 'mistralai/mistral-large-2411' },
      { label: 'Grok 3', value: 'x-ai/grok-3' },
    ]
  }
]

export function AddAIAccountForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(false)
    const result = await createAIAccount(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      const form = document.getElementById('ai-account-form') as HTMLFormElement
      form?.reset()
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <form id="ai-account-form" action={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Nome account</label>
        <input name="account_name" required placeholder="es. OpenCode Personale o OpenRouter"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Modello di riferimento</label>
        <select name="model_name" required
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50">
          {MODEL_GROUPS.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.models.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">API Key (OpenCode o OpenRouter)</label>
        <input name="api_key" type="password" required placeholder="sk-or-... o opencode-..."
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50" />
      </div>

      <Button type="submit" disabled={loading} className="h-9">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aggiungi'}
      </Button>

      {error && <p className="sm:col-span-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="sm:col-span-4 text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">Account aggiunto e key cifrata con successo.</p>}
    </form>
  )
}
