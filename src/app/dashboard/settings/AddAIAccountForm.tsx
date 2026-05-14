'use client'

import { useState } from 'react'
import { createAIAccount } from '@/app/actions/ai-accounts'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const OPENROUTER_MODELS = [
  { label: 'Claude Opus 4.7', value: 'anthropic/claude-opus-4-7' },
  { label: 'Claude Sonnet 4.6', value: 'anthropic/claude-sonnet-4-6' },
  { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4-5' },
  { label: 'GPT-4o', value: 'openai/gpt-4o' },
  { label: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' },
  { label: 'o3', value: 'openai/o3' },
  { label: 'o4-mini', value: 'openai/o4-mini' },
  { label: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro-preview' },
  { label: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-001' },
  { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
  { label: 'DeepSeek V3', value: 'deepseek/deepseek-chat-v3-5' },
  { label: 'Llama 4 Maverick', value: 'meta-llama/llama-4-maverick' },
  { label: 'Mistral Large', value: 'mistralai/mistral-large-2411' },
  { label: 'Grok 3', value: 'x-ai/grok-3' },
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
        <input name="account_name" required placeholder="es. OpenRouter principale"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Modello</label>
        <select name="model_name" required
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {OPENROUTER_MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium">API Key OpenRouter</label>
        <input name="api_key" type="password" required placeholder="sk-or-v1-..."
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      <Button type="submit" disabled={loading} className="h-9">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aggiungi'}
      </Button>

      {error && <p className="sm:col-span-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="sm:col-span-4 text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">Account aggiunto e key cifrata.</p>}
    </form>
  )
}
