import { createClient } from "@/lib/supabase/server"
import { Lightbulb } from "lucide-react"
import { IdeaCapture } from "./IdeaCapture"
import { IdeasList } from "./IdeasList"

const CATEGORY_LABEL: Record<string, string> = {
  idea: 'Idea',
  insight: 'Insight',
  solution: 'Soluzione',
  business: 'Business',
}

export default async function IdeasPage() {
  const supabase = await createClient()

  const [{ data: ideas }, { data: projects }] = await Promise.all([
    supabase.from('ideas').select('*, project:projects(name)').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name').order('name'),
  ])

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-400" /> Idee
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cattura ogni intuizione. Il sistema le memorizza e le usa automaticamente nelle chat.
          </p>
        </div>
      </div>

      <IdeaCapture projects={projects ?? []} />

      <IdeasList ideas={ideas ?? []} categoryLabel={CATEGORY_LABEL} />
    </div>
  )
}
