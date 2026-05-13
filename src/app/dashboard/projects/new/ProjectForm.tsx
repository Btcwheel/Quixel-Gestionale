'use client'

import { Button } from "@/components/ui/button"
import { ArrowLeft, FolderGit2, Save } from "lucide-react"
import Link from "next/link"
import { createProjectAction } from "@/app/actions/projects"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

export function ProjectForm({ clients }: { clients: any[] }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createProjectAction(formData)
      if (result?.error) {
        alert(result.error) // To be replaced with toast
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-border/50 pb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-lg">Dettagli Progetto</h3>
            <p className="text-sm text-muted-foreground">Crea un nuovo progetto e associalo a un cliente.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Nome Progetto *</label>
            <input
              id="name"
              name="name"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Es. E-commerce redesign"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="client_id" className="text-sm font-medium">Cliente Associato</label>
            <select
              id="client_id"
              name="client_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Seleziona un cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">Stato</label>
            <select
              id="status"
              name="status"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue="planning"
            >
              <option value="planning">In pianificazione</option>
              <option value="active">Attivo / In sviluppo</option>
              <option value="completed">Completato</option>
              <option value="on-hold">In pausa</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="budget" className="text-sm font-medium">Budget (€)</label>
            <input
              id="budget"
              name="budget"
              type="number"
              step="0.01"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Es. 5000"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label htmlFor="description" className="text-sm font-medium">Descrizione / Obiettivi</label>
          <textarea
            id="description"
            name="description"
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            placeholder="Descrivi brevemente di cosa tratta questo progetto..."
          ></textarea>
        </div>
      </div>

      <div className="p-4 border-t border-border/50 flex justify-end gap-3 bg-muted/20">
        <Link href="/dashboard/projects">
          <Button type="button" variant="outline">Annulla</Button>
        </Link>
        <Button type="submit" disabled={isPending} className="gap-2">
          <Save className="h-4 w-4" /> 
          {isPending ? 'Creazione...' : 'Crea Progetto'}
        </Button>
      </div>
    </form>
  )
}
