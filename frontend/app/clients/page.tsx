"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Building2, Edit, Trash2, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api-endpoints";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import type { Client, ClientCreate } from "@/types";
import Link from "next/link";

const sampleClients: Client[] = [
  { id: "1", name: "Acme Corp", email: "contact@acme.com", phone: "+1 555-0101", website: "https://acme.com", project_count: 5, created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z", tags: ["enterprise", "saas"] },
  { id: "2", name: "TechStart Inc", email: "hello@techstart.io", phone: "+1 555-0102", website: "https://techstart.io", project_count: 3, created_at: "2024-02-20T10:00:00Z", updated_at: "2024-02-20T10:00:00Z", tags: ["startup", "mobile"] },
  { id: "3", name: "GlobalMedia", email: "info@globalmedia.com", website: "https://globalmedia.com", project_count: 8, created_at: "2024-03-10T10:00:00Z", updated_at: "2024-03-10T10:00:00Z", tags: ["media", "enterprise"] },
  { id: "4", name: "FinServe Ltd", email: "contact@finserve.com", project_count: 2, created_at: "2024-04-05T10:00:00Z", updated_at: "2024-04-05T10:00:00Z", tags: ["fintech"] },
  { id: "5", name: "HealthTech Solutions", email: "admin@healthtech.com", project_count: 4, created_at: "2024-05-12T10:00:00Z", updated_at: "2024-05-12T10:00:00Z", tags: ["healthcare", "saas"] },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newClient, setNewClient] = useState<ClientCreate>({ name: "", email: "", phone: "", website: "" });
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientCreate>({ name: "", email: "", phone: "", website: "" });

  const { data: clientsData } = useQuery({
    queryKey: ["clients", search],
    queryFn: async () => {
      const res = await clientsApi.list(1, 100, search || undefined);
      return res.data?.items;
    },
    retry: false,
  });

  const displayClients = clientsData?.length ? clientsData : sampleClients;

  const handleCreateClient = async () => {
    if (!newClient.name) return;
    try {
      await clientsApi.create(newClient);
      setOpen(false);
      setNewClient({ name: "", email: "", phone: "", website: "" });
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Errore nella creazione del client");
    }
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setEditClient({ name: client.name, email: client.email, phone: client.phone, website: client.website });
    setEditOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;
    try {
      await clientsApi.update(editingClient.id, editClient);
      setEditOpen(false);
      setEditingClient(null);
    } catch (error) {
      console.error("Error updating client:", error);
      alert("Errore nell'aggiornamento del client");
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo client?")) return;
    try {
      await clientsApi.delete(id);
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Errore nell'eliminazione del client");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
            <p className="text-muted-foreground">Manage your client relationships.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
                <DialogDescription>Add a new client to the system.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email || ""}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="contact@acme.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newClient.phone || ""}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      placeholder="+1 555-0100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={newClient.website || ""}
                    onChange={(e) => setNewClient({ ...newClient, website: e.target.value })}
                    placeholder="https://acme.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes about this client..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateClient}>Create Client</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                            {client.name}
                          </Link>
                          {client.website && (
                            <a
                              href={client.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground flex items-center gap-1"
                            >
                              {client.website.replace(/^https?:\/\//, "")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {client.email && <div>{client.email}</div>}
                        {client.phone && <div className="text-muted-foreground">{client.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{client.project_count || 0} projects</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {client.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(client.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(client)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClient(client.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>Update client information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Company Name *</Label>
                <Input
                  id="edit-name"
                  value={editClient.name}
                  onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editClient.email || ""}
                    onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editClient.phone || ""}
                    onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={editClient.website || ""}
                  onChange={(e) => setEditClient({ ...editClient, website: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateClient}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
