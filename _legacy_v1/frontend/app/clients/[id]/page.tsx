"use client";

import DashboardLayout from "../../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, DollarSign, Tag } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { clientsApi, projectsApi } from "@/lib/api-endpoints";
import { formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const { data: client } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const res = await clientsApi.get(clientId);
      return res.data;
    },
    enabled: !!clientId,
    retry: false,
  });

  const { data: projects } = useQuery({
    queryKey: ["client-projects", clientId],
    queryFn: async () => {
      const res = await projectsApi.list(1, 100, undefined, clientId);
      return res.data?.items ?? [];
    },
    enabled: !!clientId,
    retry: false,
  });

  const projectList = projects ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{client?.name || "Client not found"}</h2>
          <p className="text-muted-foreground">Client details and associated projects.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{client?.email || "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{client?.phone || "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Website</CardTitle>
            </CardHeader>
            <CardContent>
              {client?.website ? (
                <a href={client.website} className="text-lg font-medium text-primary hover:underline">
                  {client.website}
                </a>
              ) : (
                <div className="text-lg font-medium">—</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{projectList.length} active</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {client?.tags?.length ? (
                  client.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{client?.notes || "No notes available."}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projectList.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projectList.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description || "No description."}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {project.start_date ? formatDate(project.start_date) : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>{project.budget ? formatCurrency(project.budget) : "—"}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/projects/${project.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
                No projects available for this client.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
