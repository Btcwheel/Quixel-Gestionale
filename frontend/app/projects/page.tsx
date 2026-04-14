"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, FolderKanban, Edit, Trash2, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi, clientsApi } from "@/lib/api-endpoints";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { useState } from "react";
import type { Project, ProjectCreate } from "@/types";
import Link from "next/link";

const sampleProjects: Project[] = [
  { id: "1", client_id: "1", name: "SaaS Platform", client_name: "Acme Corp", status: "active", start_date: "2024-06-01", budget: 50000, tags: ["web", "saas"], created_at: "2024-05-15T10:00:00Z", updated_at: "2024-05-15T10:00:00Z" },
  { id: "2", client_id: "2", name: "Mobile App", client_name: "TechStart Inc", status: "active", start_date: "2024-07-15", budget: 35000, tags: ["mobile", "ios"], created_at: "2024-06-20T10:00:00Z", updated_at: "2024-06-20T10:00:00Z" },
  { id: "3", client_id: "3", name: "Marketing Site", client_name: "GlobalMedia", status: "completed", start_date: "2024-01-10", end_date: "2024-03-30", budget: 12000, tags: ["web"], created_at: "2024-01-05T10:00:00Z", updated_at: "2024-01-05T10:00:00Z" },
  { id: "4", client_id: "4", name: "API Gateway", client_name: "FinServe Ltd", status: "planning", start_date: "2024-09-01", budget: 28000, tags: ["backend", "api"], created_at: "2024-08-01T10:00:00Z", updated_at: "2024-08-01T10:00:00Z" },
  { id: "5", client_id: "5", name: "Health Portal", client_name: "HealthTech Solutions", status: "active", start_date: "2024-08-01", budget: 45000, tags: ["web", "healthcare"], created_at: "2024-07-15T10:00:00Z", updated_at: "2024-07-15T10:00:00Z" },
  { id: "6", client_id: "1", name: "Data Pipeline", client_name: "Acme Corp", status: "archived", start_date: "2023-06-01", end_date: "2024-01-15", budget: 20000, tags: ["backend", "data"], created_at: "2023-05-20T10:00:00Z", updated_at: "2023-05-20T10:00:00Z" },
];

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [newProject, setNewProject] = useState<ProjectCreate>({ client_id: "", name: "", description: "" });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectCreate>({ client_id: "", name: "", description: "" });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", search, statusFilter],
    queryFn: async () => {
      const res = await projectsApi.list(1, 100, search || undefined, undefined, statusFilter !== "all" ? statusFilter : undefined);
      return res.data?.items;
    },
    retry: false,
  });

  const displayProjects = projectsData?.length ? projectsData : sampleProjects;
  const filteredProjects = statusFilter !== "all"
    ? displayProjects.filter((p) => p.status === statusFilter)
    : displayProjects;

  const handleCreateProject = async () => {
    if (!newProject.name) return;
    try {
      await projectsApi.create(newProject);
      setOpen(false);
      setNewProject({ client_id: "", name: "", description: "" });
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Errore nella creazione del progetto");
    }
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setEditProject({ client_id: project.client_id, name: project.name, description: project.description });
    setEditOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      await projectsApi.update(editingProject.id, editProject);
      setEditOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Errore nell'aggiornamento del progetto");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo progetto?")) return;
    try {
      await projectsApi.delete(id);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Errore nell'eliminazione del progetto");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
            <p className="text-muted-foreground">Track and manage all your projects.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a project for a client.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="SaaS Platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    onValueChange={(value) => setNewProject({ ...newProject, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Acme Corp</SelectItem>
                      <SelectItem value="2">TechStart Inc</SelectItem>
                      <SelectItem value="3">GlobalMedia</SelectItem>
                      <SelectItem value="4">FinServe Ltd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description || ""}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Project description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue="planning">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateProject}>Create Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FolderKanban className="h-5 w-5 text-primary" />
                        </div>
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                          {project.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        {project.client_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {project.budget ? formatCurrency(project.budget) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.start_date ? formatDate(project.start_date) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {project.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(project)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProject(project.id)}>
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

        {/* Edit Project Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name *</Label>
                <Input
                  id="edit-name"
                  value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editProject.description || ""}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateProject}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
