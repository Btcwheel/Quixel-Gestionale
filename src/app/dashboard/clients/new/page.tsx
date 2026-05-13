'use client'

import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, Save } from "lucide-react"
import Link from "next/link"
import { createClientAction } from "@/app/actions/clients"
import { useTransition } from "react"
import { useRouter } from "next/navigation"

export default function NewClientPage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createClientAction(formData)
      if (result?.error) {
        alert(result.error) // To be replaced with a proper toast later
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Nuovo Cliente</h2>
      </div>

      <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm">
        <form action={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-border/50 pb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Informazioni Base</h3>
                <p className="text-sm text-muted-foreground">Inserisci i dettagli principali del cliente.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Nome Azienda *</label>
                <input
                  id="name"
                  name="name"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Es. Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email di contatto</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Es. contatti@acme.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Telefono</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Es. +39 02 1234567"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium">Sito Web</label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Es. https://acme.com"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="description" className="text-sm font-medium">Note / Descrizione</label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Aggiungi dettagli su questo cliente..."
              ></textarea>
            </div>
          </div>

          <div className="p-4 border-t border-border/50 flex justify-end gap-3 bg-muted/20">
            <Link href="/dashboard/clients">
              <Button type="button" variant="outline">Annulla</Button>
            </Link>
            <Button type="submit" disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" /> 
              {isPending ? 'Salvataggio...' : 'Salva Cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
