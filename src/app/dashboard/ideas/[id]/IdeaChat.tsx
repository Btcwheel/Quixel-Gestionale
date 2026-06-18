'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Send, Bot, User, Loader2, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const OPENROUTER_MODELS = [
  { group: 'AI Orchestration', models: [
    { label: '🧠 Orchestrator (Auto-routing)', value: 'orchestrated' }
  ]},
  { group: 'OpenCode Go (Gratuito)', models: [
    { label: 'DeepSeek V4 Flash (OpenCode)', value: 'opencode-go/deepseek-v4-flash' },
    { label: 'Kimi K2.7 Code (OpenCode)', value: 'opencode-go/kimi-k2.7-code' },
    { label: 'GLM 5.1 (OpenCode)', value: 'opencode-go/glm-5.1' },
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
  ]},
  { group: 'DeepSeek', models: [
    { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
    { label: 'DeepSeek V3', value: 'deepseek/deepseek-chat-v3-5' },
  ]},
  { group: 'Meta', models: [
    { label: 'Llama 4 Maverick', value: 'meta-llama/llama-4-maverick' },
    { label: 'Llama 4 Scout', value: 'meta-llama/llama-4-scout' },
  ]},
  { group: 'xAI', models: [
    { label: 'Grok 3', value: 'x-ai/grok-3' },
    { label: 'Grok 3 Mini', value: 'x-ai/grok-3-mini' },
  ]},
]

type AIAccount = {
  id: string
  account_name: string
  model_name: string
}

type Idea = {
  id: string
  title: string | null
  content: string
  category: string
}

export function IdeaChat({
  idea,
  aiAccounts,
  defaultAccountId,
}: {
  idea: Idea
  aiAccounts: AIAccount[]
  defaultAccountId: string | null
}) {
  const openCodeAccount = aiAccounts.find(a => a.model_name?.startsWith('opencode-go/'))
  const initialAccountId = openCodeAccount?.id ?? defaultAccountId ?? aiAccounts[0]?.id ?? null
  const [selectedId, setSelectedId] = useState<string | null>(initialAccountId)
  const defaultModel = openCodeAccount
    ? openCodeAccount.model_name
    : 'orchestrated'
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/idea',
      body: () => ({
        ideaId: idea.id,
        accountId: selectedId,
        modelOverride: selectedModel,
      }),
    }),
  })

  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'
  const disabled = aiAccounts.length === 0

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || isLoading || disabled) return
    const userText = text
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendMessage({ text: userText })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 pt-16">
            <Bot className="h-12 w-12 opacity-20" />
            <p className="text-sm text-center max-w-sm">
              {disabled
                ? 'Nessun account AI configurato. Vai in Impostazioni e aggiungi un account OpenRouter.'
                : `Esplora questa idea. Fai una domanda, chiedi di svilupparla, mettila alla prova.`}
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === 'user'
          const textContent = (m.parts ?? [])
            .filter((p: { type: string; text?: string }) => p.type === 'text')
            .map((p: { type: string; text?: string }) => p.text ?? '')
            .join('')

          return (
            <div key={m.id} className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-amber-500/10 text-amber-400'}`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[80%] ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-amber-500/10 text-foreground rounded-tl-sm border border-amber-500/10'}`}>
                {textContent}
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl">
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-amber-500/5 border border-amber-500/10 flex items-center gap-1.5">
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

      {/* Input */}
      <div className="border-t border-border/50 bg-background px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
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

          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? 'Configura un account AI per iniziare...' : 'Fai una domanda, chiedi di svilupparla, mettila alla prova... (Invio per inviare)'}
              disabled={disabled || isLoading}
              rows={1}
              className="flex-1 rounded-xl border border-input bg-muted px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[48px] max-h-[200px] disabled:opacity-50"
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl flex-shrink-0"
              disabled={!text.trim() || isLoading || disabled}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
