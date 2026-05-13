import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { ProjectForm } from "./ProjectForm"

export default async function NewProjectPage() {
  const supabase = await createClient()
  
  // Fetch clients to populate the dropdown
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error("Error fetching clients:", error);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Nuovo Progetto</h2>
      </div>

      <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm">
        <ProjectForm clients={clients || []} />
      </div>
    </div>
  )
}
