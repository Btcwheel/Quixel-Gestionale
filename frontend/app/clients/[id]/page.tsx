"use client";

import DashboardLayout from "../../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStatusColor, formatDate, formatCurrency } from "@/lib/utils";
import { Building2, Calendar, DollarSign, Tag } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

const sampleProjects = [
  { id: "1", name: "SaaS Platform", status: "active", start_date: "2024-06-01", budget: 50000, description: "A complete SaaS platform for enterprise resource management." },
  { id: "2", name: "Mobile App Redesign", status: "planning", start_date: "2024-09-01", budget: 25000, description: "Complete redesign of the iOS and Android applications." },
  { id: "3", name: "API Integration", status: "completed", start_date: "2024-01-15", end_date: "2024-04-30", budget: 15000, description: "Third-party API integration for payment processing." },
];

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const client = {
    id: clientId,
    name: "Acme Corp",
    email: "contact@acme.com",
    phone: "+1 555-0101",
    website: "https://acme.com",
    address: "123 Business St, New York, NY 10001",
    notes: "Key enterprise client. Primary contact is John Smith, CTO.",
    tags: ["enterprise", "saas"],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{client.name}</h2>
          <p className="text-muted-foreground">Client details and associated projects.</p>
        </div>

        {/* Client Info */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{client.email}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{client.phone}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Website</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={client.website} className="text-lg font-medium text-primary hover:underline">
                {client.website}
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">{sampleProjects.length} active</div>
            </CardContent>
          </Card>
        </div>

        {/* Tags & Notes */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {client.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{client.address}</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sampleProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {formatDate(project.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(project.budget)}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link href={`/projects/${project.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
