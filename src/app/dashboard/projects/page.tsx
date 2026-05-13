import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, FolderGit2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProjectsPage() {
  const supabase = await createClient();
  
  // Fetch projects from Supabase with client details
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  const getStatusBadgeColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active': return 'bg-emerald-500/15 text-emerald-500';
      case 'planning': return 'bg-blue-500/15 text-blue-500';
      case 'completed': return 'bg-purple-500/15 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Progetti</h2>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nuovo Progetto
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Cerca progetto..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8"
            />
          </div>
        </div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b [&_tr]:border-border/50 bg-muted/20">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome Progetto</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cliente</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Stato</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Budget</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {(!projects || projects.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderGit2 className="h-8 w-8 opacity-50" />
                      <p>Nessun progetto trovato nel database.</p>
                      <p className="text-xs">Clicca "Nuovo Progetto" per iniziare un nuovo lavoro.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b border-border/50 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">
                      <Link href={`/dashboard/projects/${project.id}`} className="hover:underline text-primary">
                        {project.name}
                      </Link>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {project.client?.name || 'Nessun cliente'}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStatusBadgeColor(project.status)}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {project.budget ? `€ ${project.budget.toLocaleString()}` : '-'}
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
