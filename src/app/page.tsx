import { Button } from "@/components/ui/button"
import { ArrowRight, Box, Layers, Zap, Sparkles, Shield, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link className="flex items-center gap-2.5" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Box className="h-4 w-4" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Quixel</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/features" className="hidden sm:inline-flex h-9 px-4 items-center text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              Funzionalità
            </Link>
            <Link href="/pricing" className="hidden sm:inline-flex h-9 px-4 items-center text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              Prezzi
            </Link>
            <div className="ml-2 flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Accedi</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm" className="gap-1.5">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-40 right-0 h-[600px] w-[600px] opacity-30 dark:opacity-20">
              <div className="h-full w-full rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-transparent blur-[120px]" />
            </div>
            <div className="absolute -bottom-40 left-0 h-[500px] w-[500px] opacity-25 dark:opacity-15">
              <div className="h-full w-full rounded-full bg-gradient-to-tr from-blue-500/30 via-indigo-500/20 to-transparent blur-[120px]" />
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.04] px-4 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Versione 2.0.0 — Interamente ricostruito
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Gestisci la tua agenzia con un tocco{" "}
                <span className="bg-gradient-to-r from-primary via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Premium
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg/relaxed">
                Il gestionale definitivo per agenzie. Tieni traccia di progetti, task,
                integrazioni AI e fatturazione in un&apos;unica piattaforma moderna ed elegante.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Inizia Ora <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Prenota Demo
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Nessuna carta di credito richiesta. Gratuito per iniziare.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border/50 bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Tutto ciò che serve alla tua agenzia
              </h2>
              <p className="mt-3 text-muted-foreground">
                Strumenti pensati per chi lavora con progetti, clienti e creatività.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Zap className="h-5 w-5" />}
                title="Prestazioni Estreme"
                description="Basato su Next.js e Supabase. Caricamenti istantanei e aggiornamenti in tempo reale per un'esperienza fluida."
                accent="violet"
              />
              <FeatureCard
                icon={<Layers className="h-5 w-5" />}
                title="Integrazioni AI"
                description="Connetti OpenAI, Claude e altri modelli. Chat multi-modello con confronto automatico delle risposte."
                accent="blue"
              />
              <FeatureCard
                icon={<Shield className="h-5 w-5" />}
                title="Vault Cifrato"
                description="Credenziali dei progetti cifrate con AES-256. Mai più token persi o password dimenticate."
                accent="rose"
              />
              <FeatureCard
                icon={<BarChart3 className="h-5 w-5" />}
                title="Dashboard Intelligente"
                description="Overview completa con KPI, progetti in stallo e prossime azioni. Tutto a colpo d'occhio."
                accent="violet"
              />
              <FeatureCard
                icon={<Box className="h-5 w-5" />}
                title="Gestione Progetti"
                description="Dall'idea al deploy. Tieni traccia di stage, budget, risorse AI collegate e nota ogni progresso."
                accent="blue"
              />
              <FeatureCard
                icon={<Sparkles className="h-5 w-5" />}
                title="Archivio Idee"
                description="Cattura ogni intuizione. Le tue idee vengono vettorizzate e riemerse automaticamente nelle chat AI."
                accent="amber"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Quixel. Tutti i diritti riservati.
          </p>
          <nav className="flex gap-6">
            <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="/terms">
              Termini di Servizio
            </Link>
            <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="/privacy">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

const ACCENT_MAP = {
  violet: { border: 'hover:border-violet-500/20 hover:shadow-violet-500/5', icon: 'bg-violet-500/10 text-violet-400' },
  blue: { border: 'hover:border-blue-500/20 hover:shadow-blue-500/5', icon: 'bg-blue-500/10 text-blue-400' },
  rose: { border: 'hover:border-rose-500/20 hover:shadow-rose-500/5', icon: 'bg-rose-500/10 text-rose-400' },
  amber: { border: 'hover:border-amber-500/20 hover:shadow-amber-500/5', icon: 'bg-amber-500/10 text-amber-400' },
}

function FeatureCard({
  icon,
  title,
  description,
  accent = 'violet',
}: {
  icon: React.ReactNode
  title: string
  description: string
  accent?: keyof typeof ACCENT_MAP
}) {
  const colors = ACCENT_MAP[accent]
  return (
    <div className={`group relative rounded-xl border border-border/50 bg-card p-6 transition-all ${colors.border}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${colors.icon}`}>
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
