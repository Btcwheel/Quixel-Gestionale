'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createClientAction(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const website = formData.get('website') as string
  const description = formData.get('description') as string

  if (!name) {
    return { error: 'Il nome è obbligatorio' }
  }

  const { error } = await supabase
    .from('clients')
    .insert([
      { 
        name, 
        email: email || null, 
        phone: phone || null, 
        website: website || null,
        description: description || null,
        is_active: true
      }
    ])

  if (error) {
    console.error("Supabase insert error:", error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}
