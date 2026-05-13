'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const client_id = formData.get('client_id') as string
  const status = formData.get('status') as string || 'planning'
  const budgetStr = formData.get('budget') as string

  if (!name) {
    return { error: 'Il nome del progetto è obbligatorio' }
  }

  const { error } = await supabase
    .from('projects')
    .insert([
      { 
        name, 
        description: description || null,
        client_id: client_id || null,
        status,
        budget: budgetStr ? parseFloat(budgetStr) : null
      }
    ])

  if (error) {
    console.error("Supabase insert error:", error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/dashboard/clients') // Revalidate clients too since projects count changes
  redirect('/dashboard/projects')
}
