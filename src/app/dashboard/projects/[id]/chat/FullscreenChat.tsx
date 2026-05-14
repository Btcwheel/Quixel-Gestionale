'use client'

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { Button } from '@/components/ui/button'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function FullscreenChat({ projectId, disabled }: { projectId: string; disabled: boolean }) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
      body: { projectId },
    }),
  })

  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || isLoading || disabled) return
    sendMessage({ text })
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Bot className="h-12 w-12 opacity-20" />
            <p className="text-sm">
              {disabled
                ? 'Nessun AI collegato. Vai al progetto e collega un account AI.'
                : 'Inizia la conversazione. Le tue idee salvate vengono usate automaticamente come contesto.'}
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === 'user'
          const textContent = (m.parts ?? [])
            .filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('') || (m as any).content || ''

          return (
            <div key={m.id} className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-purple-500/10 text-purple-400'}`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap max-w-[80%] ${isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
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

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-background px-4 py-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Collega un AI al progetto per iniziare...' : 'Scrivi un messaggio... (Invio per inviare, Shift+Invio per andare a capo)'}
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
  )
}
