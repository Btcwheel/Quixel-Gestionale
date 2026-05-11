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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, clientsApi } from "@/lib/api-endpoints";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import { useState } from "react";
import type { Project, ProjectCreate } from "@/types";
import Link from "next/link";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [newProject, setNewProject] = useState<ProjectCreate>({
    client_id: "",
    name: "",
    description: "",
    status: "planning",
    budget: undefined,
    tags: [],
    metadata: {},
  });
  const [newBudgetInput, setNewBudgetInput] = useState("");
  const [newTagsInput, setNewTagsInput] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectCreate>({
    client_id: "",
    name: "",
    description: "",
    status: "planning",
    budget: undefined,
    tags: [],
    metadata: {},
  });
  const [editBudgetInput, setEditBudgetInput] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");

  const { data: projectsData } = useQuery({
    queryKey: ["projects", search, statusFilter],
    queryFn: async () => {
      const res = await projectsApi.list(1, 100, search || undefined, undefined, statusFilter !== "all" ? statusFilter : undefined);
      return res.data?.items;
    },
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => {
      console.error("Error deleting project:", error);
      const status = error.response?.status;
      if (status === 404) {
        alert("Progetto non trovato. Potrebbe essere già stato eliminato.");
      } else {
        alert("Errore nell'eliminazione del progetto. Riprova.");
      }
    },
  });

  const displayProjects = projectsData ?? [];
  const filteredProjects = statusFilter !== "all"
    ? displayProjects.filter((p) => p.status === statusFilter)
    : displayProjects;

  const handleCreateProject = async () => {
    if (!newProject.name) return;
    try {
      await projectsApi.create({
        ...newProject,
        budget: newBudgetInput ? Number(newBudgetInput) : undefined,
        tags: newTagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setOpen(false);
      setNewProject({
        client_id: "",
        name: "",
        description: "",
        status: "planning",
        budget: undefined,
        tags: [],
        metadata: {},
      });
      setNewBudgetInput("");
      setNewTagsInput("");
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Errore nella creazione del progetto");
    }
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setEditProject({
      client_id: project.client_id,
      name: project.name,
      description: project.description,
      status: project.status,
      budget: project.budget,
      tags: project.tags,
      metadata: project.metadata,
    });
    setEditBudgetInput(project.budget?.toString() || "");
    setEditTagsInput(project.tags?.join(", ") || "");
    setEditOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      await projectsApi.update(editingProject.id, {
        ...editProject,
        budget: editBudgetInput ? Number(editBudgetInput) : undefined,
        tags: editTagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setEditOpen(false);
      setEditingProject(null);
      setEditBudgetInput("");
      setEditTagsInput("");
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Errore nell'aggiornamento del progetto");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo progetto?")) return;
    deleteMutation.mutate(id);
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
                      value={newBudgetInput}
                      onChange={(e) => setNewBudgetInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newProject.status || "planning"}
                      onValueChange={(value) => setNewProject({ ...newProject, status: value })}
                    >
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
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={newTagsInput}
                    onChange={(e) => setNewTagsInput(e.target.value)}
                    placeholder="web, saas, urgent"
                  />
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
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        No projects found.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-budget">Budget</Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    value={editBudgetInput}
                    onChange={(e) => setEditBudgetInput(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editProject.status || "planning"}
                    onValueChange={(value) => setEditProject({ ...editProject, status: value })}
                  >
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
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags</Label>
                <Input
                  id="edit-tags"
                  value={editTagsInput}
                  onChange={(e) => setEditTagsInput(e.target.value)}
                  placeholder="web, saas, urgent"
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
