import { Button } from "@/components/ui/button";
import { ArrowRight, Box, Layers, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link className="flex items-center justify-center" href="/">
          <Box className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold text-xl tracking-tight">Quixel</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/features">
            Funzionalità
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/pricing">
            Prezzi
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="text-sm font-medium">
              Accedi
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="hidden sm:flex gap-2">
              Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 -z-10 h-full w-full bg-background">
          <div className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-[rgba(120,119,198,0.3)] opacity-50 blur-[80px]"></div>
        </div>

        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 px-4 md:px-6 flex flex-col items-center text-center">
          <div className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-1000 mb-4 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary">
            🎉 Versione 2.0.0 Disponibile
          </div>
          <h1 className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6 max-w-4xl text-balance">
            Gestisci la tua agenzia con un tocco <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Premium</span>
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-8">
            Quixel è il gestionale definitivo per agenzie. Tieni traccia di progetti, task, AI integrations e fatturazione in un'unica piattaforma moderna ed elegante.
          </p>
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 w-full sm:w-auto font-semibold">
                Inizia Ora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold border-primary/20 hover:bg-primary/5">
                Prenota Demo
              </Button>
            </Link>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50 border-t border-border/40">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Prestazioni Estreme</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Basato su Next.js e Supabase. Caricamenti istantanei e aggiornamenti in tempo reale per un'esperienza fluida.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Integrazioni API</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Connettiti con OpenAI, GitHub, Vercel e altro ancora. Tutto gestito da una singola dashboard.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
                  <Box className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Design Impeccabile</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Un'interfaccia utente curata nei minimi dettagli. Dark mode nativo e componenti studiati per la produttività.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/40 bg-background">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Quixel. Tutti i diritti riservati.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="/terms">
            Termini di Servizio
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
