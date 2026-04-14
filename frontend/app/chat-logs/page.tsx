"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Stars, MessageSquare, Clock, DollarSign } from "lucide-react";
import { formatDateTime, formatCurrency, getProviderIcon } from "@/lib/utils";
import { useState } from "react";

const sampleChats = [
  { id: "1", ai_account_id: "1", account_name: "OpenAI #1", provider: "openai", model: "GPT-4 Turbo", prompt: "Build a REST API with FastAPI...", response: "Here's a complete FastAPI setup...", tokens_used: 2450, cost: 0.085, rating: 5, created_at: "2024-08-15T15:30:00Z", project: "SaaS Platform" },
  { id: "2", ai_account_id: "3", account_name: "Anthropic #1", provider: "anthropic", model: "Claude 3 Opus", prompt: "Refactor this React component...", response: "I'd suggest using useMemo for...", tokens_used: 1800, cost: 0.045, rating: 4, created_at: "2024-08-15T14:20:00Z", project: "Mobile App" },
  { id: "3", ai_account_id: "4", account_name: "Google #1", provider: "google", model: "Gemini Pro", prompt: "Write unit tests for...", response: "Here are comprehensive tests...", tokens_used: 3200, cost: 0.032, rating: 3, created_at: "2024-08-15T13:10:00Z", project: "API Gateway" },
  { id: "4", ai_account_id: "2", account_name: "OpenAI #2", provider: "openai", model: "GPT-3.5 Turbo", prompt: "Explain the architecture...", response: "The system uses a microservices...", tokens_used: 1500, cost: 0.003, rating: 4, created_at: "2024-08-15T12:45:00Z", project: "SaaS Platform" },
  { id: "5", ai_account_id: "6", account_name: "Groq #1", provider: "groq", model: "Mixtral 8x7B", prompt: "Generate a Docker compose...", response: "Here's a production-ready...", tokens_used: 800, cost: 0.000, rating: 5, created_at: "2024-08-15T11:30:00Z", project: "Health Portal" },
];

export default function ChatLogsPage() {
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const filteredChats = ratingFilter
    ? sampleChats.filter((c) => c.rating === ratingFilter)
    : sampleChats;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chat Logs</h2>
          <p className="text-muted-foreground">Review AI conversations and rate quality.</p>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Chats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{sampleChats.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sampleChats.reduce((sum, c) => sum + c.tokens_used, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">
                  {formatCurrency(sampleChats.reduce((sum, c) => sum + c.cost, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <Stars className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {(sampleChats.reduce((sum, c) => sum + (c.rating || 0), 0) / sampleChats.length).toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>AI Account</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChats.map((chat) => (
                  <TableRow key={chat.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getProviderIcon(chat.provider)}</span>
                        <div>
                          <div className="text-sm font-medium">{chat.account_name}</div>
                          <div className="text-xs text-muted-foreground">{chat.model}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{chat.project}</TableCell>
                    <TableCell>
                      <div className="max-w-[250px] truncate text-sm" title={chat.prompt}>
                        {chat.prompt}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{chat.tokens_used.toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(chat.cost)}</TableCell>
                    <TableCell>
                      {chat.rating ? (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Stars
                              key={i}
                              className={`h-4 w-4 ${
                                i < chat.rating! ? "text-yellow-500" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(chat.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
