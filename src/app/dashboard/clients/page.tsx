import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ClientsPage() {
  const supabase = await createClient();
  
  // Fetch clients from Supabase
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*, projects(count)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Clienti</h2>
        <Link href="/dashboard/clients/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuovo Cliente
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm overflow-hidden border-t-[3px] border-t-emerald-500">
        <div className="p-4 border-b border-border/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-emerald-400" />
            <input
              type="search"
              placeholder="Cerca cliente..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50 pl-8"
            />
          </div>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b [&_tr]:border-border/50 bg-emerald-500/10">
              <tr className="border-b transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-emerald-400">Nome</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-emerald-400">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-emerald-400">Stato</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-emerald-400">Progetti</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-emerald-400 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {(!clients || clients.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserX className="h-8 w-8 opacity-50" />
                      <p>Nessun cliente trovato nel database.</p>
                      <p className="text-xs">Clicca &quot;Nuovo Cliente&quot; per aggiungerne uno.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-b border-border/50 transition-colors hover:bg-emerald-500/5">
                    <td className="p-4 align-middle font-medium">{client.name}</td>
                    <td className="p-4 align-middle text-muted-foreground">{client.email || 'N/D'}</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        client.is_active 
                          ? 'bg-emerald-500/15 text-emerald-500' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {client.is_active ? 'Attivo' : 'Inattivo'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {client.projects?.[0]?.count || 0}
                    </td>
                    <td className="p-4 align-middle">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
