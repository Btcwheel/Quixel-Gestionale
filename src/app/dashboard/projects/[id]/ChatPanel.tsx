'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Send, Bot, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ChatPanel({ projectId }: { projectId: string }) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { projectId },
    }),
  });

  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    sendMessage({ text });
    setText('');
  }

  return (
    <div className="flex flex-col h-[500px] rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Assistente AI del Progetto</h3>
          <p className="text-xs text-muted-foreground">Collegato al pool primario</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Bot className="h-12 w-12 opacity-20 mb-4" />
            <p className="text-sm">Invia un messaggio per iniziare la conversazione.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex flex-shrink-0 items-center justify-center ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-purple-500/10 text-purple-500'
              }`}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}>
                {m.parts?.map((p: any, i: number) => p.type === 'text' ? <span key={i}>{p.text}</span> : null)}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg px-4 py-2 bg-muted text-muted-foreground text-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        {error && (
          <div className="text-center text-sm text-red-500 p-2 bg-red-500/10 rounded-lg">
            Errore: {error.message}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border/50 bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Chiedi qualcosa all'AI di questo progetto..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
