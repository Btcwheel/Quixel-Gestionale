'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type WorkLogEntry = {
  id: string
  project_id: string
  description: string
  duration_minutes: number
  category: 'bug' | 'feature' | 'maintenance' | 'consulting'
  billable: boolean
  hourly_rate: number | null
  entry_date: string
  created_at: string
}

export async function getWorkLogs(projectId: string): Promise<WorkLogEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('work_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
  return (data ?? []) as WorkLogEntry[]
}

export async function createWorkLog(
  projectId: string,
  entry: {
    description: string
    duration_minutes: number
    category: string
    billable: boolean
    hourly_rate?: number | null
    entry_date?: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  const { error } = await supabase.from('work_logs').insert({
    project_id: projectId,
    user_id: user.id,
    description: entry.description,
    duration_minutes: entry.duration_minutes,
    category: entry.category,
    billable: entry.billable,
    hourly_rate: entry.hourly_rate ?? null,
    entry_date: entry.entry_date ?? new Date().toISOString().split('T')[0],
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function updateWorkLog(
  logId: string,
  projectId: string,
  entry: {
    description: string
    duration_minutes: number
    category: string
    billable: boolean
    hourly_rate?: number | null
    entry_date?: string
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('work_logs')
    .update({
      description: entry.description,
      duration_minutes: entry.duration_minutes,
      category: entry.category,
      billable: entry.billable,
      hourly_rate: entry.hourly_rate ?? null,
      entry_date: entry.entry_date,
    })
    .eq('id', logId)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/projects/${projectId}`)
}

export async function deleteWorkLog(logId: string, projectId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('work_logs').delete().eq('id', logId)
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/projects/${projectId}`)
}
