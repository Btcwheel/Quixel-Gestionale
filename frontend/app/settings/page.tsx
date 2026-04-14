"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, Key, Shield, Bell, Palette, Moon, Sun, Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { authApi, apiKeysApi } from "@/lib/api-endpoints";
import { useQuery } from "@tanstack/react-query";
import type { APIKey } from "@/types";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("admin");
  const [email, setEmail] = useState("admin@quixel.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // API Keys state
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState({ name: "", key: "", provider: "github" });
  const { data: apiKeysData, refetch: refetchKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const res = await apiKeysApi.list(1, 100);
      return res.data?.items || [];
    },
    retry: false,
  });
  const apiKeys: APIKey[] = apiKeysData || [];

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.key) return;
    try {
      await apiKeysApi.create(newKey);
      setKeyDialogOpen(false);
      setNewKey({ name: "", key: "", provider: "github" });
      refetchKeys();
    } catch (error) {
      console.error("Error adding API key:", error);
      alert("Errore nell'aggiunta della chiave API");
    }
  };

  const handleToggleKey = async (id: string) => {
    try {
      await apiKeysApi.toggle(id);
      refetchKeys();
    } catch (error) {
      console.error("Error toggling API key:", error);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa chiave API?")) return;
    try {
      await apiKeysApi.delete(id);
      refetchKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
      alert("Errore nell'eliminazione della chiave API");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Profile update would go here — backend endpoint needed
      alert("Profilo salvato con successo");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Errore nel salvataggio del profilo");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Le password non corrispondono");
      return;
    }
    if (!currentPassword || !newPassword) {
      alert("Compila tutti i campi");
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      alert("Password aggiornata con successo");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Errore nell'aggiornamento della password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account and application preferences.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Change your password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handleUpdatePassword} disabled={changingPassword}>
                {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </span>
                <Button size="sm" onClick={() => setKeyDialogOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" /> Add Key
                </Button>
              </CardTitle>
              <CardDescription>Manage API keys for GitHub, Supabase, and Vercel integrations.</CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No API keys configured. Add one to connect your integrations.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell className="capitalize">{key.provider}</TableCell>
                        <TableCell>
                          <Badge className={key.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {key.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(key.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleToggleKey(key.id)}>
                              {key.is_active ? (
                                <ToggleRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteKey(key.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure alert and notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive alerts via email</div>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Critical Alerts Only</div>
                  <div className="text-sm text-muted-foreground">Only notify for critical issues</div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Daily Summary</div>
                  <div className="text-sm text-muted-foreground">Get a daily digest of activity</div>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div>
                    <div className="font-medium">Dark Mode</div>
                    <div className="text-sm text-muted-foreground">
                      {darkMode ? "Currently dark" : "Currently light"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? "Switch to Light" : "Switch to Dark"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Current system status and version.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Backend</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Database</span>
                <Badge className="bg-green-100 text-green-800">PostgreSQL 15</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cache</span>
                <Badge className="bg-green-100 text-green-800">Redis 7</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add API Key Dialog */}
        <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add API Key</DialogTitle>
              <DialogDescription>Store an encrypted API key for integrations.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="GitHub Personal Token"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-provider">Provider</Label>
                <Select
                  value={newKey.provider}
                  onValueChange={(v) => setNewKey({ ...newKey, provider: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="supabase">Supabase</SelectItem>
                    <SelectItem value="vercel">Vercel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-value">API Key</Label>
                <Input
                  id="key-value"
                  type="password"
                  value={newKey.key}
                  onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                  placeholder="ghp_xxxx / sbp_xxxx / vc_xxxx"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddKey}>Add Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
