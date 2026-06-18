import { createClient } from "@/lib/supabase/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, role, parts, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      return new Response(error.message, { status: 500 })
    }

    return Response.json(messages)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return new Response(message, { status: 500 })
  }
}
