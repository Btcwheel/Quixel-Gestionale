'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'

export async function createVaultEntry(formData: FormData) {
  const supabase = await createClient()

  const project_id = formData.get('project_id') as string
  const provider = formData.get('provider') as string
  const label = formData.get('label') as string
  const login_email = formData.get('login_email') as string
  const username = formData.get('username') as string
  const secret = formData.get('secret') as string
  const plan = formData.get('plan') as string || 'free'
  const url = formData.get('url') as string
  const notes = formData.get('notes') as string

  if (!project_id || !provider || !label || !secret) {
    return { error: 'Campi obbligatori mancanti' }
  }

  const encrypted_secret = await encrypt(secret)

  const { error } = await supabase.from('credential_vault').insert([{
    project_id,
    provider,
    label,
    login_email: login_email || null,
    username: username || null,
    encrypted_secret,
    plan,
    url: url || null,
    notes: notes || null,
  }])

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/vault`)
  revalidatePath(`/dashboard/projects/${project_id}`)
  return { success: true }
}

export async function deleteVaultEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('credential_vault').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/vault')
  return { success: true }
}

export async function revealSecret(id: string): Promise<{ secret?: string; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('credential_vault')
    .select('encrypted_secret')
    .eq('id', id)
    .single()

  if (error || !data) return { error: 'Credenziale non trovata' }

  try {
    const secret = await decrypt(data.encrypted_secret)
    return { secret }
  } catch {
    return { error: 'Impossibile decifrare' }
  }
}
