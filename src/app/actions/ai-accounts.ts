'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'
import { revalidatePath } from 'next/cache'

export async function createAIAccount(formData: FormData) {
  const supabase = await createClient()

  const account_name = formData.get('account_name') as string
  const model_name = formData.get('model_name') as string
  const api_key = formData.get('api_key') as string
  const credits = parseFloat(formData.get('credits') as string) || 0

  if (!account_name || !model_name || !api_key) {
    return { error: 'Campi obbligatori mancanti' }
  }

  const api_key_encrypted = await encrypt(api_key)

  const { error } = await supabase.from('ai_accounts').insert([{
    provider: 'openrouter',
    account_name,
    model_name,
    api_key_encrypted,
    total_credits: credits,
    remaining_credits: credits,
  }])

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteAIAccount(id: string) {
  const supabase = await createClient()
  await supabase.from('project_ai_pool_assignments').delete().eq('ai_account_id', id)
  const { error } = await supabase.from('ai_accounts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function assignAIToProject(projectId: string, aiAccountId: string, isPrimary: boolean) {
  const supabase = await createClient()

  if (isPrimary) {
    await supabase
      .from('project_ai_pool_assignments')
      .update({ is_primary: false })
      .eq('project_id', projectId)
  }

  const { error } = await supabase
    .from('project_ai_pool_assignments')
    .upsert({ project_id: projectId, ai_account_id: aiAccountId, is_primary: isPrimary },
      { onConflict: 'project_id,ai_account_id' })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}

export async function removeAIFromProject(projectId: string, aiAccountId: string) {
  const supabase = await createClient()
  await supabase
    .from('project_ai_pool_assignments')
    .delete()
    .eq('project_id', projectId)
    .eq('ai_account_id', aiAccountId)
  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}
