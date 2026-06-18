import { Receipt } from "lucide-react"

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-cyan-400" /> Fatturazione
        </h2>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground shadow-sm border-t-[3px] border-t-cyan-500">
        <Receipt className="h-10 w-10 mx-auto mb-4 text-cyan-400/30" />
        <p className="text-sm font-medium">Funzionalità in arrivo</p>
        <p className="text-xs mt-1">Qui potrai gestire pagamenti, abbonamenti e fatture emesse.</p>
      </div>
    </div>
  );
}
