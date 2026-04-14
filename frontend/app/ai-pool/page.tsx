"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Cpu, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { aiAccountsApi } from "@/lib/api-endpoints";
import { getProviderIcon, formatDate } from "@/lib/utils";
import { useState } from "react";
import type { AIAccountCreate } from "@/types";

const sampleAccounts = [
  { id: "1", provider: "openai", model: "GPT-4 Turbo", account_name: "OpenAI #1", credits_remaining: 850, credits_total: 1000, priority: 1, is_active: true, is_rate_limited: false, concurrent_requests: 3, last_used_at: "2024-08-15T14:30:00Z" },
  { id: "2", provider: "openai", model: "GPT-3.5 Turbo", account_name: "OpenAI #2", credits_remaining: 2200, credits_total: 3000, priority: 2, is_active: true, is_rate_limited: false, concurrent_requests: 5, last_used_at: "2024-08-15T15:00:00Z" },
  { id: "3", provider: "anthropic", model: "Claude 3 Opus", account_name: "Anthropic #1", credits_remaining: 45, credits_total: 500, priority: 1, is_active: true, is_rate_limited: false, concurrent_requests: 2, last_used_at: "2024-08-15T12:00:00Z" },
  { id: "4", provider: "google", model: "Gemini Pro", account_name: "Google #1", credits_remaining: 1800, credits_total: 2000, priority: 1, is_active: true, is_rate_limited: false, concurrent_requests: 4, last_used_at: "2024-08-15T14:45:00Z" },
  { id: "5", provider: "mistral", model: "Mistral Large", account_name: "Mistral #1", credits_remaining: 950, credits_total: 1000, priority: 1, is_active: true, is_rate_limited: false, concurrent_requests: 3, last_used_at: "2024-08-15T13:30:00Z" },
  { id: "6", provider: "groq", model: "Mixtral 8x7B", account_name: "Groq #1", credits_remaining: 5000, credits_total: 5000, priority: 1, is_active: true, is_rate_limited: false, concurrent_requests: 10, last_used_at: "2024-08-15T15:10:00Z" },
];

export default function AIPoolPage() {
  const [providerFilter, setProviderFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [newAccount, setNewAccount] = useState<AIAccountCreate>({
    provider: "openai", model: "", account_name: "", api_key: "",
  });

  const { data: accountsData } = useQuery({
    queryKey: ["ai-accounts", providerFilter],
    queryFn: async () => {
      const res = await aiAccountsApi.list(1, 100, providerFilter !== "all" ? providerFilter : undefined);
      return res.data?.items;
    },
    retry: false,
  });

  const handleCreateAccount = async () => {
    if (!newAccount.account_name || !newAccount.api_key) return;
    try {
      await aiAccountsApi.create(newAccount);
      setOpen(false);
      setNewAccount({ provider: "openai", model: "", account_name: "", api_key: "" });
    } catch (error) {
      console.error("Error creating AI account:", error);
      alert("Errore nella creazione dell'account AI");
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo account?")) return;
    try {
      await aiAccountsApi.delete(id);
    } catch (error) {
      console.error("Error deleting AI account:", error);
      alert("Errore nell'eliminazione dell'account AI");
    }
  };

  const displayAccounts = accountsData?.length ? accountsData : sampleAccounts;
  const filteredAccounts = providerFilter !== "all"
    ? displayAccounts.filter((a) => a.provider === providerFilter)
    : displayAccounts;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI Pool Management</h2>
            <p className="text-muted-foreground">Manage AI provider accounts and routing.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add AI Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add AI Account</DialogTitle>
                <DialogDescription>Configure a new AI provider account.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                      value={newAccount.provider}
                      onValueChange={(v) => setNewAccount({ ...newAccount, provider: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="mistral">Mistral</SelectItem>
                        <SelectItem value="groq">Groq</SelectItem>
                        <SelectItem value="cohere">Cohere</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={newAccount.model}
                      onChange={(e) => setNewAccount({ ...newAccount, model: e.target.value })}
                      placeholder="GPT-4 Turbo"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    value={newAccount.account_name}
                    onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                    placeholder="OpenAI #3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={newAccount.api_key}
                    onChange={(e) => setNewAccount({ ...newAccount, api_key: e.target.value })}
                    placeholder="sk-..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAccount}>Add Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAccounts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {filteredAccounts.filter((a) => a.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rate Limited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {filteredAccounts.filter((a) => a.is_rate_limited).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Low Credit (&lt;10%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {filteredAccounts.filter((a) => (a.credits_remaining / a.credits_total) < 0.1).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search accounts..." className="pl-9" />
              </div>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Concurrent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => {
                  const creditPercent = (account.credits_remaining / account.credits_total) * 100;
                  const isLowCredit = creditPercent < 10;

                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Cpu className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{account.account_name}</div>
                            <div className="text-xs text-muted-foreground">{account.model}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{getProviderIcon(account.provider)}</span>
                          <span className="capitalize">{account.provider}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {account.credits_remaining.toLocaleString()} / {account.credits_total.toLocaleString()}
                          </div>
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isLowCredit ? "bg-red-500" : creditPercent < 30 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${creditPercent}%` }}
                            />
                          </div>
                          {isLowCredit && (
                            <div className="flex items-center gap-1 text-xs text-red-500">
                              <AlertTriangle className="h-3 w-3" />
                              Low credit
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">P{account.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account.concurrent_requests}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {account.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                          {account.is_rate_limited && (
                            <Badge className="bg-yellow-100 text-yellow-800">Rate Limited</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {account.last_used_at ? formatDate(account.last_used_at) : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAccount(account.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
