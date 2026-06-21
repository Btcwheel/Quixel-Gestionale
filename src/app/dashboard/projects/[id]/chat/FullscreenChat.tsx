'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage, type FileUIPart } from 'ai'
import { Button } from '@/components/ui/button'
import { MultimodalInput } from '@/components/MultimodalInput'
import { Bot, User, ChevronDown, GitCompare, AlertTriangle, Lightbulb, CircleDot, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { saveMessage } from '@/app/actions/chat'
import { MultiModelPanel } from './MultiModelPanel'

const OPENROUTER_MODELS = [
  { group: 'AI Orchestration', models: [
    { label: '🧠 Orchestrator (Auto-routing)', value: 'orchestrated' }
  ]},
  { group: 'Anthropic', models: [
    { label: 'Claude Opus 4.7', value: 'anthropic/claude-opus-4-7' },
    { label: 'Claude Sonnet 4.6', value: 'anthropic/claude-sonnet-4-6' },
    { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4-5' },
  ]},
  { group: 'OpenAI', models: [
    { label: 'GPT-4o', value: 'openai/gpt-4o' },
    { label: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' },
    { label: 'o3', value: 'openai/o3' },
    { label: 'o4-mini', value: 'openai/o4-mini' },
  ]},
  { group: 'Google', models: [
    { label: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro-preview' },
    { label: 'Gemini 2.5 Flash', value: 'google/gemini-2.5-flash-preview' },
    { label: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-001' },
  ]},
  { group: 'DeepSeek', models: [
    { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
    { label: 'DeepSeek V3', value: 'deepseek/deepseek-chat-v3-5' },
  ]},
  { group: 'Meta', models: [
    { label: 'Llama 4 Maverick', value: 'meta-llama/llama-4-maverick' },
    { label: 'Llama 4 Scout', value: 'meta-llama/llama-4-scout' },
  ]},
  { group: 'Mistral', models: [
    { label: 'Mistral Large', value: 'mistralai/mistral-large-2411' },
    { label: 'Mistral Small', value: 'mistralai/mistral-small-3.1-24b-instruct' },
  ]},
  { group: 'xAI', models: [
    { label: 'Grok 3', value: 'x-ai/grok-3' },
    { label: 'Grok 3 Mini', value: 'x-ai/grok-3-mini' },
  ]},
  { group: 'Qwen', models: [
    { label: 'Qwen3 235B', value: 'qwen/qwen3-235b-a22b' },
    { label: 'Qwen3 30B', value: 'qwen/qwen3-30b-a3b' },
  ]},
]

type Part = { type: string; text?: string }

type InitialMessage = {
  id: string
  role: 'user' | 'assistant'
  parts: unknown[]
}

type AIAccount = {
  id: string
  account_name: string
  model_name: string
}

type ProjectSummary = {
  name: string
  description: string | null
  status: string | null
  progress: number
  is_stuck: boolean
  next_action: string | null
  client: string | null
  ideas: { id: string; title: string; status: string }[]
}

const STATUS_LABEL: Record<string, string> = {
  planning: 'Pianificazione',
  active: 'Attivo',
  completed: 'Completato',
  paused: 'In pausa',
}

export function FullscreenChat({
  projectId,
  sessionId,
  disabled,
  initialMessages,
  aiAccounts,
  defaultAccountId,
  projectSummary,
}: {
  projectId: string
  sessionId: string | null
  disabled: boolean
  initialMessages: InitialMessage[]
  aiAccounts: AIAccount[]
  defaultAccountId: string | null
  projectSummary?: ProjectSummary
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultAccountId ?? aiAccounts[0]?.id ?? null
  )
  const [selectedModel, setSelectedModel] = useState<string>('orchestrated')

  const [showMultiModel, setShowMultiModel] = useState(false)

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({ projectId, accountId: selectedId, modelOverride: selectedModel }),
    }),
    messages: initialMessages as UIMessage[],
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const savedIds = useRef<Set<string>>(new Set(initialMessages.map(m => m.id)))
  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const onScroll = () => {
      const threshold = 100
      autoScrollRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    }
    container.addEventListener('scroll', onScroll)
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (autoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (!sessionId) return
    for (const m of messages) {
      if (savedIds.current.has(m.id)) continue
      const parts = m.parts ?? []
      if (parts.length === 0) continue
      savedIds.current.add(m.id)
      saveMessage(sessionId, { id: m.id, role: m.role as 'user' | 'assistant', parts })
    }
  }, [messages, sessionId])

  function handleSubmit(text: string, fileParts: FileUIPart[]) {
    if ((!text.trim() && fileParts.length === 0) || isLoading || disabled) return
    sendMessage({ text, files: fileParts } as { text: string; files: FileUIPart[] })
  }

  async function handleMultiModelSave(question: string, synthesis: string) {
    if (!sessionId) return
    const userId = crypto.randomUUID()
    const assistantId = crypto.randomUUID()
    const userMsg = { id: userId, role: 'user' as const, parts: [{ type: 'text' as const, text: question }] }
    const assistantMsg = { id: assistantId, role: 'assistant' as const, parts: [{ type: 'text' as const, text: `**[Sintesi verificata multi-modello]**\n\n${synthesis}` }] }
    await Promise.all([
      saveMessage(sessionId, userMsg),
      saveMessage(sessionId, assistantMsg),
    ])
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    savedIds.current.add(userId)
    savedIds.current.add(assistantId)
    setShowMultiModel(false)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full px-4">
            {projectSummary ? (
              <div className="w-full max-w-xl space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Riepilogo progetto</p>
                    <p className="text-xs text-muted-foreground">Contesto caricato automaticamente</p>
                  </div>
                </div>

                <div className="rounded-2xl rounded-tl-sm bg-muted px-5 py-4 text-sm space-y-3">
                  {/* Stato + progresso */}
                  <div className="flex items-center gap-3">
                    {projectSummary.is_stuck ? (
                      <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                        <AlertTriangle className="h-3 w-3" /> Impantanato
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <CircleDot className="h-3 w-3" /> {STATUS_LABEL[projectSummary.status ?? ''] ?? projectSummary.status ?? 'Attivo'}
                      </span>
                    )}
                    {projectSummary.client && (
                      <span className="text-xs text-muted-foreground">Cliente: <span className="text-foreground">{projectSummary.client}</span></span>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="w-20 h-1.5 rounded-full bg-background overflow-hidden">
                        <div className={`h-full rounded-full ${projectSummary.is_stuck ? 'bg-red-500/60' : 'bg-primary'}`}
                          style={{ width: `${projectSummary.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{projectSummary.progress}%</span>
                    </div>
                  </div>

                  {/* Descrizione */}
                  {projectSummary.description && (
                    <p className="text-muted-foreground text-xs leading-relaxed">{projectSummary.description}</p>
                  )}

                  {/* Prossima azione */}
                  {projectSummary.next_action && (
                    <div className="flex items-start gap-2 text-xs border-t border-border/40 pt-3">
                      <span className="text-muted-foreground flex-shrink-0">Prossima azione:</span>
                      <span className="text-foreground font-medium">→ {projectSummary.next_action}</span>
                    </div>
                  )}

                  {/* Idee collegate */}
                  {projectSummary.ideas.length > 0 && (
                    <div className="border-t border-border/40 pt-3 space-y-1.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Lightbulb className="h-3 w-3" /> Idee collegate ({projectSummary.ideas.length})
                      </p>
                      {projectSummary.ideas.map(idea => (
                        <p key={idea.id} className="text-xs text-foreground pl-4">· {idea.title}</p>
                      ))}
                    </div>
                  )}

                  {/* Prompt suggerito */}
                  <p className="text-xs text-muted-foreground border-t border-border/40 pt-3 italic">
                    {disabled
                      ? 'Nessun AI collegato. Vai al progetto e collega un account AI.'
                      : 'Le idee salvate vengono usate automaticamente come contesto. Cosa vuoi fare?'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Bot className="h-12 w-12 opacity-20" />
                <p className="text-sm">
                  {disabled
                    ? 'Nessun AI collegato. Vai al progetto e collega un account AI.'
                    : 'Inizia la conversazione. Le tue idee salvate vengono usate automaticamente come contesto.'}
                </p>
              </div>
            )}
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === 'user'
          const parts = m.parts ?? []
          const textContent = parts
            .filter((p: unknown) => (p as Part).type === 'text')
            .map((p: unknown) => (p as Part).text ?? '')
            .join('')
          const fileParts = parts.filter((p: unknown) => (p as Part).type === 'file')

          return (
            <div key={m.id} className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-purple-500/10 text-purple-400'}`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[80%] space-y-2 ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                {fileParts.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {fileParts.map((fp: unknown, idx: number) => {
                      const f = fp as { url: string; mediaType?: string; filename?: string }
                      return f.mediaType?.startsWith('image/')
                        ? <img key={idx} src={f.url} alt={f.filename ?? ''} className="max-w-[240px] max-h-[240px] rounded-lg object-cover" />
                        : <div key={idx} className="flex items-center gap-2 text-xs bg-background/50 rounded-lg px-3 py-2"><FileText className="h-4 w-4" /><span>{f.filename ?? 'File'}</span></div>
                    })}
                  </div>
                )}
                {textContent}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl">
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3 max-w-xl">
            {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Multi-model panel */}
      {showMultiModel && (
        <MultiModelPanel
          accountId={selectedId}
          onSave={handleMultiModelSave}
        />
      )}

      {/* Input */}
      <div className="border-t border-border/50 bg-background px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Model selector */}
          {aiAccounts.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {aiAccounts.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Account:</span>
                  <div className="relative">
                    <select
                      value={selectedId ?? ''}
                      onChange={e => setSelectedId(e.target.value)}
                      disabled={isLoading}
                      className="appearance-none bg-muted border border-input rounded-lg pl-3 pr-7 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:opacity-50"
                    >
                      {aiAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.account_name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Modello:</span>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    disabled={isLoading}
                    className="appearance-none bg-muted border border-input rounded-lg pl-3 pr-7 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:opacity-50"
                  >
                    {OPENROUTER_MODELS.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.models.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMultiModel((v) => !v)}
              disabled={!selectedId}
              className={`h-7 px-3 text-xs gap-1.5 ${showMultiModel ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              {showMultiModel ? 'Chiudi confronto' : 'Confronto multi-modello'}
            </Button>
          </div>

          <MultimodalInput
            onSend={handleSubmit}
            disabled={disabled}
            isLoading={isLoading}
            placeholder={disabled ? 'Collega un AI al progetto per iniziare...' : 'Scrivi un messaggio... (Invio per inviare, Shift+Invio per andare a capo)'}
          />
        </div>
      </div>
    </div>
  )
}
