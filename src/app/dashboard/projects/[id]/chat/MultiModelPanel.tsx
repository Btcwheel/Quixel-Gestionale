'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, Loader2, Save, X } from 'lucide-react'

const COMPARE_MODELS = [
  { label: 'Claude Opus 4.7', value: 'anthropic/claude-opus-4-7' },
  { label: 'Claude Sonnet 4.6', value: 'anthropic/claude-sonnet-4-6' },
  { label: 'GPT-4o', value: 'openai/gpt-4o' },
  { label: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro-preview' },
  { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
  { label: 'Grok 3', value: 'x-ai/grok-3' },
]

type ModelResult = {
  model: string
  label: string
  text: string
  loading: boolean
  error?: string
}

export function MultiModelPanel({
  accountId,
  onSave,
}: {
  accountId: string | null
  onSave: (question: string, synthesis: string) => void
}) {
  const [question, setQuestion] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>([
    'anthropic/claude-sonnet-4-6',
    'openai/gpt-4o',
    'google/gemini-2.5-pro-preview',
  ])
  const [results, setResults] = useState<ModelResult[]>([])
  const [running, setRunning] = useState(false)
  const [synthesis, setSynthesis] = useState('')

  function toggleModel(value: string) {
    setSelectedModels(prev =>
      prev.includes(value) ? prev.filter(m => m !== value) : [...prev, value]
    )
  }

  async function runComparison() {
    if (!question.trim() || selectedModels.length === 0 || !accountId) return
    setRunning(true)
    setSynthesis('')

    const initial: ModelResult[] = selectedModels.map(m => ({
      model: m,
      label: COMPARE_MODELS.find(x => x.value === m)?.label ?? m,
      text: '',
      loading: true,
    }))
    setResults(initial)

    await Promise.all(
      selectedModels.map(async (model, i) => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountId,
              modelOverride: model,
              projectId: null,
              messages: [{ role: 'user', parts: [{ type: 'text', text: question }] }],
            }),
          })

          if (!res.ok) {
            const err = await res.text()
            setResults(prev => prev.map((r, idx) => idx === i ? { ...r, loading: false, error: err } : r))
            return
          }

          const reader = res.body?.getReader()
          const decoder = new TextDecoder()
          let accumulated = ''

          while (reader) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            for (const line of chunk.split('\n')) {
              if (line.startsWith('0:')) {
                try {
                  const text = JSON.parse(line.slice(2))
                  if (typeof text === 'string') accumulated += text
                } catch {}
              }
            }
            const snap = accumulated
            setResults(prev => prev.map((r, idx) => idx === i ? { ...r, text: snap } : r))
          }

          const final = accumulated
          setResults(prev => prev.map((r, idx) => idx === i ? { ...r, loading: false, text: final } : r))
        } catch (e: unknown) {
          setResults(prev => prev.map((r, idx) => idx === i ? { ...r, loading: false, error: e instanceof Error ? e.message : String(e) } : r))
        }
      })
    )

    setRunning(false)
  }

  function buildSynthesis() {
    const parts = results
      .filter(r => r.text)
      .map(r => `### ${r.label}\n${r.text}`)
      .join('\n\n---\n\n')
    setSynthesis(parts)
  }

  return (
    <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-4 space-y-3">
      <div className="max-w-5xl mx-auto space-y-3">
        {/* Modelli */}
        <div className="flex flex-wrap gap-2">
          {COMPARE_MODELS.map(m => (
            <button
              key={m.value}
              onClick={() => toggleModel(m.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                selectedModels.includes(m.value)
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-muted border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Scrivi la domanda da mandare a tutti i modelli selezionati..."
            rows={2}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 resize-none"
          />
          <Button
            onClick={runComparison}
            disabled={running || !question.trim() || selectedModels.length === 0 || !accountId}
            size="sm"
            className="self-end bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confronta'}
          </Button>
        </div>

        {/* Risultati */}
        {results.length > 0 && (
          <div className={`grid gap-3 ${results.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {results.map((r, i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{r.label}</span>
                  {r.loading && <Loader2 className="h-3 w-3 animate-spin text-amber-400 ml-auto" />}
                </div>
                {r.error ? (
                  <p className="text-xs text-red-400">{r.error}</p>
                ) : (
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {r.text || (r.loading ? '…' : '')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sintesi */}
        {results.length > 0 && !running && (
          <div className="space-y-2">
            {!synthesis && (
              <Button onClick={buildSynthesis} variant="ghost" size="sm" className="text-xs text-muted-foreground">
                Combina le risposte in una sintesi
              </Button>
            )}
            {synthesis && (
              <>
                <textarea
                  value={synthesis}
                  onChange={e => setSynthesis(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={() => onSave(question, synthesis)} size="sm" className="text-xs gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    Salva in chat
                  </Button>
                  <Button onClick={() => setSynthesis('')} variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
