'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, Play, Square, Pause, Plus, Trash2, Bug, Wrench, Headphones, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createWorkLog, deleteWorkLog, getWorkLogs, type WorkLogEntry } from '@/app/actions/work-logs'

const CATEGORIES = [
  { value: 'bug', label: 'Bug Fix', icon: Bug, color: 'text-rose-400' },
  { value: 'feature', label: 'Feature / Upgrade', icon: Sparkles, color: 'text-emerald-400' },
  { value: 'maintenance', label: 'Manutenzione', icon: Wrench, color: 'text-amber-400' },
  { value: 'consulting', label: 'Consulenza', icon: Headphones, color: 'text-blue-400' },
] as const

const CATEGORY_LABELS: Record<string, { label: string; icon: typeof Bug; color: string }> = {
  bug: { label: 'Bug Fix', icon: Bug, color: 'text-rose-400' },
  feature: { label: 'Feature / Upgrade', icon: Sparkles, color: 'text-emerald-400' },
  maintenance: { label: 'Manutenzione', icon: Wrench, color: 'text-amber-400' },
  consulting: { label: 'Consulenza', icon: Headphones, color: 'text-blue-400' },
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export function MaintenancePanel({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<WorkLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [timerDesc, setTimerDesc] = useState('')
  const [timerCategory, setTimerCategory] = useState('feature')
  const timerStartRef = useRef<number | null>(null)
  const timerPausedDurationRef = useRef(0)
  const timerLastTickRef = useRef<number | null>(null)

  // Form state
  const [formDesc, setFormDesc] = useState('')
  const [formHours, setFormHours] = useState('')
  const [formMinutes, setFormMinutes] = useState('')
  const [formCategory, setFormCategory] = useState('feature')
  const [formBillable, setFormBillable] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getWorkLogs(projectId).then(data => {
      if (mounted) { setLogs(data); setLoading(false) }
    })
    return () => { mounted = false }
  }, [projectId])

  // Timer tick
  useEffect(() => {
    if (!timerRunning || timerPaused) return
    const interval = setInterval(() => {
      const now = Date.now()
      const running = timerStartRef.current ?? now
      setElapsed(Math.floor((now - running - timerPausedDurationRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [timerRunning, timerPaused])

  function handleStartTimer() {
    timerStartRef.current = Date.now()
    timerPausedDurationRef.current = 0
    setElapsed(0)
    setTimerRunning(true)
    setTimerPaused(false)
  }

  function handlePauseTimer() {
    if (!timerPaused) {
      timerPausedDurationRef.current += Date.now() - (timerLastTickRef.current ?? Date.now())
    }
    timerLastTickRef.current = Date.now()
    setTimerPaused(!timerPaused)
  }

    async function refreshLogs() {
    const data = await getWorkLogs(projectId)
    setLogs(data)
  }

  async function handleStopTimer() {
    if (!timerStartRef.current) return
    const minutes = Math.max(1, Math.round(elapsed / 60))
    setTimerRunning(false)
    setTimerPaused(false)
    setSaving(true)
    try {
      await createWorkLog(projectId, {
        description: timerDesc || `Lavoro su ${CATEGORY_LABELS[timerCategory]?.label.toLowerCase() ?? 'progetto'}`,
        duration_minutes: minutes,
        category: timerCategory,
        billable: true,
      })
      setTimerDesc('')
      setTimerCategory('feature')
      setElapsed(0)
      timerStartRef.current = null
      timerPausedDurationRef.current = 0
      await refreshLogs()
    } finally {
      setSaving(false)
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const hours = parseInt(formHours) || 0
    const minutes = parseInt(formMinutes) || 0
    const total = hours * 60 + minutes
    if (total < 1 || !formDesc.trim()) return
    setSaving(true)
    try {
      await createWorkLog(projectId, {
        description: formDesc.trim(),
        duration_minutes: total,
        category: formCategory,
        billable: formBillable,
      })
      setFormDesc('')
      setFormHours('')
      setFormMinutes('')
      setFormCategory('feature')
      setFormBillable(true)
      setShowForm(false)
      await refreshLogs()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteWorkLog(id, projectId)
    await refreshLogs()
  }

  const totalMinutes = logs.reduce((sum, l) => sum + l.duration_minutes, 0)
  const billableMinutes = logs.filter(l => l.billable).reduce((sum, l) => sum + l.duration_minutes, 0)
  const weekStart = getWeekStart()
  const weekLogs = logs.filter(l => l.entry_date >= weekStart)
  const weekMinutes = weekLogs.reduce((sum, l) => sum + l.duration_minutes, 0)

  const groupedByDate = logs.reduce<Record<string, WorkLogEntry[]>>((acc, l) => {
    if (!acc[l.entry_date]) acc[l.entry_date] = []
    acc[l.entry_date].push(l)
    return acc
  }, {})

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm border-t-[3px] border-t-amber-500">
      <h3 className="font-semibold flex items-center gap-2 mb-4 text-sm">
        <Clock className="h-4 w-4 text-amber-400" /> Manutenzione
      </h3>

      {/* Riepilogo */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Totale</p>
          <p className="text-lg font-bold tabular-nums">{formatDuration(totalMinutes)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Fatturabili</p>
          <p className="text-lg font-bold tabular-nums text-emerald-400">{formatDuration(billableMinutes)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Questa sett.</p>
          <p className="text-lg font-bold tabular-nums text-amber-400">{formatDuration(weekMinutes)}</p>
        </div>
      </div>

      {/* Timer */}
      <div className="rounded-lg border border-border/50 bg-background p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl font-mono font-bold tabular-nums tracking-wider min-w-[120px]">
            {timerRunning ? formatElapsed(elapsed) : '00:00:00'}
          </span>
          <div className="flex gap-1.5">
            {!timerRunning ? (
              <Button size="sm" variant="outline" onClick={handleStartTimer} className="h-8 px-3 text-xs gap-1">
                <Play className="h-3.5 w-3.5 fill-current" /> Avvia
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={handlePauseTimer} className="h-8 px-3 text-xs gap-1">
                  {timerPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
                  {timerPaused ? 'Riprendi' : 'Pausa'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleStopTimer} disabled={saving}
                  className="h-8 px-3 text-xs gap-1 text-rose-400 border-rose-500/30 hover:bg-rose-500/10">
                  <Square className="h-3.5 w-3.5 fill-current" /> Stop
                </Button>
              </>
            )}
          </div>
        </div>
        {timerRunning && (
          <div className="flex gap-2">
            <input
              value={timerDesc}
              onChange={e => setTimerDesc(e.target.value)}
              placeholder="Descrivi l&apos;attività in corso (opzionale)"
              className="flex-1 rounded-lg border border-input bg-muted/40 px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <select
              value={timerCategory}
              onChange={e => setTimerCategory(e.target.value)}
              className="rounded-lg border border-input bg-muted/40 px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Inserimento manuale */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs gap-1.5 h-7 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          {showForm ? 'Chiudi' : 'Inserimento manuale'}
        </Button>

        {showForm && (
          <form onSubmit={handleManualSubmit} className="mt-3 space-y-3 rounded-lg border border-border/50 bg-background p-4">
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Descrizione del lavoro svolto..."
              rows={2}
              required
              className="w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formHours}
                  onChange={e => setFormHours(e.target.value)}
                  placeholder="0"
                  className="w-14 rounded-lg border border-input bg-muted/40 px-2 py-1.5 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring tabular-nums"
                />
                <span className="text-xs text-muted-foreground">h</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formMinutes}
                  onChange={e => setFormMinutes(e.target.value)}
                  placeholder="30"
                  className="w-14 rounded-lg border border-input bg-muted/40 px-2 py-1.5 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring tabular-nums"
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="rounded-lg border border-input bg-muted/40 px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={formBillable}
                  onChange={e => setFormBillable(e.target.checked)}
                  className="rounded border-input"
                />
                Fatturabile
              </label>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving || (!formDesc.trim())}>
                {saving ? 'Salvataggio...' : 'Salva ore'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Lista log */}
      {loading ? (
        <div className="text-xs text-muted-foreground text-center py-4">Caricamento...</div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border/50 rounded-lg">
          Nessuna ora registrata. Usa il timer o l&apos;inserimento manuale.
        </p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {Object.entries(groupedByDate).map(([date, entries]) => {
            const dayTotal = entries.reduce((s, e) => s + e.duration_minutes, 0)
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {new Date(date + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{formatDuration(dayTotal)}</span>
                </div>
                <div className="space-y-1">
                  {entries.map(log => {
                    const cat = CATEGORY_LABELS[log.category] ?? CATEGORY_LABELS.feature
                    const CatIcon = cat.icon
                    return (
                      <div key={log.id} className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 group">
                        <CatIcon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${cat.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-snug">{log.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{formatDuration(log.duration_minutes)}</span>
                            {!log.billable && (
                              <span className="text-[10px] text-muted-foreground/50">non fatt.</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-400 mt-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
