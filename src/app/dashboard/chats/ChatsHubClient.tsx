'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import {
  MessageSquare,
  Plus,
  Upload,
  Search,
  Trash2,
  Bot,
  User,
  Send,
  Loader2,
  ChevronDown,
  Lightbulb,
  HelpCircle,
  X,
  Sparkles,
  BrainCircuit,
  Briefcase,
  Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createChatSession,
  deleteChatSession,
  importChat,
  saveMessage
} from '@/app/actions/chat'
import { createIdea } from '@/app/actions/ideas'

type ChatSession = {
  id: string
  title: string | null
  project_id: string | null
  updated_at: string
  project?: { name: string; is_personal: boolean } | null
}

type AIAccount = {
  id: string
  account_name: string
  model_name: string
}

type Project = {
  id: string
  name: string
  is_personal: boolean
}

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
    { label: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-001' },
  ]},
  { group: 'DeepSeek', models: [
    { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
    { label: 'DeepSeek V3', value: 'deepseek/deepseek-chat-v3-5' },
  ]},
]

export function ChatsHubClient({
  initialSessions,
  projects,
  aiAccounts,
  defaultAccountId,
  initialActiveSessionId,
  initialMessages = []
}: {
  initialSessions: ChatSession[]
  projects: Project[]
  aiAccounts: AIAccount[]
  defaultAccountId: string | null
  initialActiveSessionId: string | null
  initialMessages?: Array<{ id: string; role: 'user' | 'assistant'; parts: Array<{ type: string; text?: string }> }>
}) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialActiveSessionId)
  
  // Categorization filter: 'all' | 'personal' (esplorativa/personale) | 'client' (progetti clienti)
  const [sidebarTab, setSidebarTab] = useState<'all' | 'personal' | 'client'>('all')

  // Modals state
  const [showNewModal, setShowNewModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showIdeaModal, setShowIdeaModal] = useState(false)

  // New Chat Form
  const [newChatType, setNewChatType] = useState<'personal' | 'client'>('personal')
  const [newTitle, setNewTitle] = useState('')
  const [newProjectId, setNewProjectId] = useState('')

  // Import Chat Form
  const [importChatType, setImportChatType] = useState<'personal' | 'client'>('personal')
  const [importTitle, setImportTitle] = useState('')
  const [importProjectId, setImportProjectId] = useState('')
  const [importRawText, setImportRawText] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  // Convert to Idea Form
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaContent, setIdeaContent] = useState('')
  const [ideaCategory, setIdeaCategory] = useState('idea')
  const [ideaProjectId, setIdeaProjectId] = useState('')
  const [isSavingIdea, setIsSavingIdea] = useState(false)

  // Active Chat states
  const openCodeAccount = aiAccounts.find(a => a.model_name?.startsWith('opencode-go/'))
  const initialAccountId = openCodeAccount?.id ?? defaultAccountId ?? aiAccounts[0]?.id ?? null
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(initialAccountId)
  const activeAccount = aiAccounts.find(a => a.id === selectedAccountId) ?? aiAccounts[0] ?? null
  const defaultModel = openCodeAccount
    ? openCodeAccount.model_name
    : 'orchestrated'
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel)

  const activeSession = sessions.find(s => s.id === activeSessionId)

  // AI SDK Chat state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chatMessages] = useState<any[]>(() =>
    initialMessages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.parts.map((p: { text?: string }) => p.text ?? '').join(''),
      parts: m.parts,
    }))
  )

  // Refs per i valori reattivi usati nel transport body (evita la ricreazione del transport ad ogni render)
  const activeSessionRef = useRef(activeSession)
  activeSessionRef.current = activeSession
  const selectedAccountIdRef = useRef(selectedAccountId)
  selectedAccountIdRef.current = selectedAccountId
  const selectedModelRef = useRef(selectedModel)
  selectedModelRef.current = selectedModel

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      projectId: activeSessionRef.current?.project_id ?? null,
      accountId: selectedAccountIdRef.current,
      modelOverride: selectedModelRef.current,
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport,
    messages: chatMessages,
  })

  const [inputText, setInputText] = useState('')
  const [isSessionLoading, setIsSessionLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const savedIds = useRef<Set<string>>(new Set(initialMessages.map(m => m.id)))
  const isLoading = status === 'streaming' || status === 'submitted'
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll: userScrolledUp = true quando l'utente ha scrollato su durante lo streaming
  const userScrolledUpRef = useRef(false)
  const isProgrammaticScrollRef = useRef(false)

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const onScroll = () => {
      if (isProgrammaticScrollRef.current) return
      const threshold = 100
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
      if (!atBottom) {
        userScrolledUpRef.current = true
      } else {
        userScrolledUpRef.current = false
      }
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  // Quando lo streaming finisce, riabilita l'auto-scroll
  useEffect(() => {
    if (status === 'ready') {
      userScrolledUpRef.current = false
    }
  }, [status])

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      isProgrammaticScrollRef.current = true
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      requestAnimationFrame(() => { isProgrammaticScrollRef.current = false })
    }
  }, [messages])

  // Sync state when active session changes
  useEffect(() => {
    userScrolledUpRef.current = false

    if (activeSessionId === initialActiveSessionId) {
      ;(setMessages as any)(chatMessages)
      savedIds.current = new Set(initialMessages.map(m => m.id))
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = true
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
        requestAnimationFrame(() => { isProgrammaticScrollRef.current = false })
      })
    } else if (activeSessionId) {
      ;(setMessages as any)([])
      setIsSessionLoading(true)

      const fetchSessionMessages = async () => {
        interface DBPart { type: string; text?: string }
        interface DBMessage { id: string; role: 'user' | 'assistant'; parts: DBPart[] }

        try {
          const response = await fetch(`/api/chats/${activeSessionId}/messages`)
          if (response.ok) {
            const data = await response.json()
            const loaded = (data as DBMessage[]).map((m) => ({
              id: m.id,
              role: m.role,
              content: m.parts.map((p) => p.text ?? '').join(''),
              parts: m.parts,
            }))
            ;(setMessages as any)(loaded)
            savedIds.current = new Set(loaded.map((m) => m.id))
            requestAnimationFrame(() => {
              isProgrammaticScrollRef.current = true
              messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
              requestAnimationFrame(() => { isProgrammaticScrollRef.current = false })
            })
          }
        } finally {
          setIsSessionLoading(false)
        }
      }
      fetchSessionMessages()
    }
  }, [activeSessionId])

  // Save new messages automatically to the DB
  useEffect(() => {
    if (!activeSessionId) return
    for (const m of messages) {
      if (savedIds.current.has(m.id)) continue
      const msg = m as any
      const parts = (msg.parts as Array<{ type: string; text?: string }> | undefined)?.filter((p: { type: string }) => p.type === 'text') || [{ type: 'text', text: msg.content }]
      if (parts.length === 0 || !parts[0].text) continue
      savedIds.current.add(m.id)
      saveMessage(activeSessionId, { id: m.id, role: m.role as 'user' | 'assistant', parts })
    }
  }, [messages, activeSessionId])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim() || isLoading || aiAccounts.length === 0) return
    const userText = inputText
    setInputText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendMessage({ text: userText })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  // Create Chat Session
  async function handleCreateChat(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const session = await createChatSession(newTitle, newProjectId || null)
      setSessions([session, ...sessions])
      setActiveSessionId(session.id)
      setMessages([])
      savedIds.current = new Set()
      setShowNewModal(false)
      setNewTitle('')
      setNewProjectId('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  // Delete Chat Session
  async function handleDeleteSession(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questa chat?')) return
    try {
      await deleteChatSession(id)
      setSessions(sessions.filter(s => s.id !== id))
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
        savedIds.current = new Set()
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  // Text parser for importing chats
  function parseChatLog(text: string): Array<{ role: 'user' | 'assistant'; text: string }> {
    const lines = text.split('\n')
    const parsed: Array<{ role: 'user' | 'assistant'; text: string }> = []
    let currentRole: 'user' | 'assistant' | null = null
    let currentContent: string[] = []

    const userRegex = /^(User|Tu|Me|Client|Utente|\[User\]|\[Tu\]|\[Utente\]):\s*/i
    const assistantRegex = /^(Assistant|Claude|ChatGPT|AI|Bot|DeepSeek|Gemini|\[Assistant\]|\[Claude\]|\[ChatGPT\]|\[AI\]):\s*/i

    for (const line of lines) {
      if (userRegex.test(line)) {
        if (currentRole && currentContent.join('\n').trim()) {
          parsed.push({ role: currentRole, text: currentContent.join('\n').trim() })
        }
        currentRole = 'user'
        currentContent = [line.replace(userRegex, '')]
      } else if (assistantRegex.test(line)) {
        if (currentRole && currentContent.join('\n').trim()) {
          parsed.push({ role: currentRole, text: currentContent.join('\n').trim() })
        }
        currentRole = 'assistant'
        currentContent = [line.replace(assistantRegex, '')]
      } else {
        if (currentRole) {
          currentContent.push(line)
        } else if (line.trim()) {
          currentRole = 'user'
          currentContent = [line]
        }
      }
    }

    if (currentRole && currentContent.join('\n').trim()) {
      parsed.push({ role: currentRole, text: currentContent.join('\n').trim() })
    }

    return parsed
  }

  // Import Chat Action
  async function handleImportChat(e: React.FormEvent) {
    e.preventDefault()
    if (!importTitle.trim() || !importRawText.trim()) return
    setIsImporting(true)
    try {
      const parsedMessages = parseChatLog(importRawText)
      if (parsedMessages.length === 0) {
        throw new Error('Nessun messaggio rilevato nel formato incollato. Controlla i prefissi (es. "User:" o "Assistant:").')
      }

      const session = await importChat(importTitle, parsedMessages, importProjectId || null)
      setSessions([session, ...sessions])
      setActiveSessionId(session.id)
      
      const loadedMessages = parsedMessages.map((m) => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.text,
        parts: [{ type: 'text', text: m.text }]
      }))
      
      ;(setMessages as any)(loadedMessages)
      savedIds.current = new Set(loadedMessages.map(m => m.id))
      setShowImportModal(false)
      setImportTitle('')
      setImportProjectId('')
      setImportRawText('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsImporting(false)
    }
  }

  // Open converting to Idea modal
  function triggerConvertIdea(text: string) {
    setIdeaTitle(text.split('\n')[0].slice(0, 50) + (text.split('\n')[0].length > 50 ? '...' : ''))
    setIdeaContent(text)
    setIdeaProjectId(activeSession?.project_id || '')
    setIdeaCategory('idea')
    setShowIdeaModal(true)
  }

  // Convert Message to Idea Action
  async function handleSaveIdea(e: React.FormEvent) {
    e.preventDefault()
    if (!ideaContent.trim()) return
    setIsSavingIdea(true)
    try {
      const fd = new FormData()
      fd.append('title', ideaTitle)
      fd.append('content', ideaContent)
      fd.append('category', ideaCategory)
      fd.append('project_id', ideaProjectId)

      const res = await createIdea(fd)
      if (res.error) {
        throw new Error(res.error)
      }

      setShowIdeaModal(false)
      alert('Idea salvata con successo nell\'archivio!')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSavingIdea(false)
    }
  }

  // Categorize sessions based on project type
  const categorizedSessions = sessions.filter(s => {
    // Search query match
    const titleMatch = s.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const projectMatch = s.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (searchQuery && !titleMatch && !projectMatch) return false

    // Categorization filter
    const isPersonal = !s.project_id || s.project?.is_personal === true
    if (sidebarTab === 'personal') return isPersonal
    if (sidebarTab === 'client') return !isPersonal
    return true
  })

  // Filter projects based on form contexts
  const personalProjects = projects.filter(p => p.is_personal)
  const clientProjects = projects.filter(p => !p.is_personal)

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-xl border border-border/50 bg-card/30 overflow-hidden backdrop-blur-md">
      {/* SIDEBAR */}
      <div className="w-80 border-r border-border/50 flex flex-col bg-card/60 flex-shrink-0">
        
        {/* Actions header */}
        <div className="p-4 border-b border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Conversazioni</span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowImportModal(true)}
                title="Importa chat storica"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="default"
                className="h-8 w-8 bg-gradient-to-br from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 shadow-sm text-white"
                onClick={() => setShowNewModal(true)}
                title="Nuova chat"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca chat..."
              className="w-full bg-muted/50 border border-input rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Tab Filters (All, Brainstorming/Personal, Client Projects) */}
        <div className="grid grid-cols-3 gap-1 px-3 py-2 border-b border-border/40 bg-muted/10 text-[10px] font-medium flex-shrink-0">
          <button
            onClick={() => setSidebarTab('all')}
            className={`flex items-center justify-center gap-1 py-1 rounded-md transition-all ${
              sidebarTab === 'all'
                ? 'bg-muted text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3 w-3" />
            Tutte
          </button>
          <button
            onClick={() => setSidebarTab('personal')}
            className={`flex items-center justify-center gap-1 py-1 rounded-md transition-all ${
              sidebarTab === 'personal'
                ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Chat di ragionamento o progetti personali"
          >
            <BrainCircuit className="h-3 w-3" />
            Personali
          </button>
          <button
            onClick={() => setSidebarTab('client')}
            className={`flex items-center justify-center gap-1 py-1 rounded-md transition-all ${
              sidebarTab === 'client'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Chat collegate a progetti clienti"
          >
            <Briefcase className="h-3 w-3" />
            Clienti
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categorizedSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Nessuna chat in questa categoria.
            </div>
          ) : (
            categorizedSessions.map(session => {
              const isActive = session.id === activeSessionId
              const isPersonal = !session.project_id || session.project?.is_personal === true
              return (
                <div
                  key={session.id}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isPersonal ? (
                      <BrainCircuit className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-violet-400'}`} />
                    ) : (
                      <Briefcase className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-emerald-400'}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{session.title || 'Senza titolo'}</p>
                      {session.project && (
                        <p className={`text-[10px] truncate ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/85'}`}>
                          📁 {session.project.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-red-500/10 hover:text-red-400 ${
                      isActive ? 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10' : 'text-muted-foreground'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSession(session.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* CHAT SCREEN */}
      <div className="flex-1 flex flex-col bg-background/40 min-w-0">
        {activeSessionId ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/30 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate flex items-center gap-2">
                  {activeSession?.title || 'Senza titolo'}
                  {activeSession?.project_id ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-normal flex items-center gap-1 ${
                      activeSession.project?.is_personal
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {activeSession.project?.is_personal ? <BrainCircuit className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                      {activeSession.project?.name}
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded-full border border-slate-500/20 font-normal flex items-center gap-1">
                      <BrainCircuit className="h-3 w-3" />
                      Brainstorming Libero
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI: {activeAccount?.model_name ?? 'Nessuna AI configurata'}
                </p>
              </div>

              {/* Model Selectors */}
              <div className="flex items-center gap-3">
                {aiAccounts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Modello:</span>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        disabled={isLoading}
                        className="appearance-none bg-muted/50 border border-input rounded-lg pl-2 pr-6 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:opacity-50"
                      >
                        {OPENROUTER_MODELS.map(group => (
                          <optgroup key={group.group} label={group.group}>
                            {group.models.map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Feed */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {isSessionLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isSessionLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-md">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">
                      {activeSession?.project_id ? `Ragionamento su "${activeSession.project?.name}"` : 'Ragionamento & Ricerca Libera'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      {activeSession?.project_id
                        ? 'Fai domande o studia idee per questo progetto specifico. L\'AI utilizzerà le idee correlate come contesto.'
                        : 'Questo è il tuo spazio di brainstorming personale (stile Perplexity). Inserisci qualsiasi ragionamento grezzo o ricerca esplorativa.'}
                    </p>
                  </div>
                </div>
              )}

              {!isSessionLoading && messages.map((m) => {
                const isUser = m.role === 'user'
                const textContent = ((m as any).parts ?? [])
                  .filter((p: { type: string; text?: string }) => p.type === 'text')
                  .map((p: { type: string; text?: string }) => p.text ?? '')
                  .join('') || (m as any).content || ''
                return (
                  <div key={m.id} className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isUser ? 'bg-primary text-primary-foreground' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className="space-y-1.5 max-w-[85%]">
                      <div className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted/70 border border-border/30 text-foreground rounded-tl-sm'
                      }`}>
                        {textContent}
                      </div>
                      
                      {/* Message Actions (Only Assistant) */}
                      {!isUser && textContent.trim() && (
                        <div className="flex items-center gap-2 pl-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 rounded-lg gap-1"
                            onClick={() => triggerConvertIdea(textContent)}
                          >
                            <Lightbulb className="h-3 w-3" />
                            Salva come Idea
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex gap-3.5 max-w-3xl">
                  <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted/70 border border-border/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 rounded-xl px-4 py-3 max-w-xl">
                  {error.message}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-border/50 bg-card/20 px-6 py-4 flex-shrink-0">
              <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    aiAccounts.length === 0
                      ? 'Nessun account AI. Aggiungine uno in Impostazioni.'
                      : activeSession?.project_id
                        ? 'Scrivi qui per il progetto...'
                        : 'Avvia una ricerca o fai una domanda libera (es. stile Perplexity)...'
                  }
                  disabled={aiAccounts.length === 0 || isLoading}
                  rows={1}
                  className="flex-1 rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none min-h-[44px] max-h-[160px] disabled:opacity-50"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-11 w-11 rounded-xl flex-shrink-0 bg-gradient-to-br from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 shadow-md text-white"
                  disabled={!inputText.trim() || isLoading || aiAccounts.length === 0}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Centro Chat & Idee</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Dividi i tuoi ragionamenti: usa le chat **Personali/Esplorative** per brainstorming e ricerche in stile Perplexity, e le chat **Clienti** per i tuoi progetti lavorativi.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <div
                className="flex flex-col items-center p-4 border border-border/50 bg-card/40 hover:bg-card/70 rounded-xl cursor-pointer transition-all space-y-2 group"
                onClick={() => {
                  setNewChatType('personal')
                  setShowNewModal(true)
                }}
              >
                <BrainCircuit className="h-6 w-6 text-violet-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Brainstorming Personale</span>
                <span className="text-[10px] text-muted-foreground">Ragionamento libero & Ricerca</span>
              </div>
              <div
                className="flex flex-col items-center p-4 border border-border/50 bg-card/40 hover:bg-card/70 rounded-xl cursor-pointer transition-all space-y-2 group"
                onClick={() => {
                  setNewChatType('client')
                  setShowNewModal(true)
                }}
              >
                <Briefcase className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Progetto Cliente</span>
                <span className="text-[10px] text-muted-foreground">Scopo specifico lavorativo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW CHAT MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <span className="font-semibold text-sm">Nuova Conversazione</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setShowNewModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreateChat} className="p-6 space-y-4">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Tipo di Chat</label>
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setNewChatType('personal')
                      setNewProjectId('')
                    }}
                    className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                      newChatType === 'personal'
                        ? 'bg-violet-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Personale / Esplorativa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewChatType('client')
                      setNewProjectId(clientProjects[0]?.id || '')
                    }}
                    className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                      newChatType === 'client'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    Progetto Cliente
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Titolo Chat</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder={
                    newChatType === 'personal'
                      ? "Es. Studio su nuova architettura vector"
                      : "Es. Allineamento requisiti client"
                  }
                  className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Project Link dropdowns (Conditional) */}
              {newChatType === 'personal' ? (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Collega a Progetto Personale (Opzionale)</label>
                  <div className="relative">
                    <select
                      value={newProjectId}
                      onChange={e => setNewProjectId(e.target.value)}
                      className="w-full appearance-none bg-muted/50 border border-input rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      <option value="">Nessun progetto (Generale/Brainstorming)</option>
                      {personalProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Progetto Cliente *</label>
                  <div className="relative">
                    <select
                      value={newProjectId}
                      required
                      onChange={e => setNewProjectId(e.target.value)}
                      className="w-full appearance-none bg-muted/50 border border-input rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      {clientProjects.length === 0 ? (
                        <option value="">Nessun progetto cliente configurato</option>
                      ) : (
                        clientProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={newChatType === 'client' && !newProjectId}
                className={`w-full text-white shadow-md ${
                  newChatType === 'personal'
                    ? 'bg-gradient-to-br from-violet-500 to-blue-500'
                    : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                }`}
              >
                Crea Chat
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT CHAT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <span className="font-semibold text-sm">Importa Chat Storica</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setShowImportModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleImportChat} className="p-6 space-y-4">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Classifica Chat Importata</label>
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setImportChatType('personal')
                      setImportProjectId('')
                    }}
                    className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                      importChatType === 'personal'
                        ? 'bg-violet-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Personale / Esplorativa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportChatType('client')
                      setImportProjectId(clientProjects[0]?.id || '')
                    }}
                    className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                      importChatType === 'client'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    Progetto Cliente
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Titolo Sessione Importata</label>
                  <input
                    type="text"
                    required
                    value={importTitle}
                    onChange={e => setImportTitle(e.target.value)}
                    placeholder="Es. ChatGPT - Studio vector database"
                    className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {importChatType === 'personal' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Collega a Progetto Personale (Opzionale)</label>
                    <div className="relative">
                      <select
                        value={importProjectId}
                        onChange={e => setImportProjectId(e.target.value)}
                        className="w-full appearance-none bg-muted/50 border border-input rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                      >
                        <option value="">Nessun progetto (Generale)</option>
                        {personalProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Progetto Cliente *</label>
                    <div className="relative">
                      <select
                        value={importProjectId}
                        required
                        onChange={e => setImportProjectId(e.target.value)}
                        className="w-full appearance-none bg-muted/50 border border-input rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                      >
                        {clientProjects.length === 0 ? (
                          <option value="">Nessun progetto cliente configurato</option>
                        ) : (
                          clientProjects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Incolla qui la chat</label>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    Prefissi supportati: &quot;User:&quot;, &quot;Assistant:&quot; (o Tu:, Claude:, ChatGPT:)
                  </span>
                </div>
                <textarea
                  required
                  rows={10}
                  value={importRawText}
                  onChange={e => setImportRawText(e.target.value)}
                  placeholder={`Esempio:\nUser: Quali sono i migliori approcci per il RAG?\nAssistant: Per implementare un RAG efficiente, conviene strutturare gli embeddings...\nUser: Come gestisco i metadati in pgvector?`}
                  className="w-full bg-muted/50 border border-input rounded-lg px-4 py-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-mono"
                />
              </div>

              <Button
                type="submit"
                disabled={isImporting || (importChatType === 'client' && !importProjectId)}
                className={`w-full text-white shadow-md ${
                  importChatType === 'personal'
                    ? 'bg-gradient-to-br from-violet-500 to-blue-500'
                    : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                }`}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importazione in corso...
                  </>
                ) : (
                  'Importa Chat'
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT TO IDEA MODAL */}
      {showIdeaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <span className="font-semibold text-sm flex items-center gap-1.5 text-amber-400">
                <Lightbulb className="h-4 w-4" />
                Converti in Idea Strutturata
              </span>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setShowIdeaModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSaveIdea} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Titolo dell&apos;Idea</label>
                  <input
                    type="text"
                    required
                    value={ideaTitle}
                    onChange={e => setIdeaTitle(e.target.value)}
                    placeholder="Es. Soluzione caching Next.js"
                    className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Categoria</label>
                  <div className="relative">
                    <select
                      value={ideaCategory}
                      onChange={e => setIdeaCategory(e.target.value)}
                      className="w-full appearance-none bg-muted/50 border border-input rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      <option value="idea">Idea</option>
                      <option value="insight">Insight</option>
                      <option value="solution">Soluzione</option>
                      <option value="business">Business</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Progetto Associato (Opzionale)</label>
                <div className="relative">
                  <select
                    value={ideaProjectId}
                    onChange={e => setIdeaProjectId(e.target.value)}
                    className="w-full appearance-none bg-muted/50 border border-input rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="">Nessun progetto (Generale)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Contenuto dell&apos;Idea</label>
                <textarea
                  required
                  rows={6}
                  value={ideaContent}
                  onChange={e => setIdeaContent(e.target.value)}
                  className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSavingIdea}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-md"
              >
                {isSavingIdea ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvataggio...
                  </>
                ) : (
                  'Salva Idea'
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
