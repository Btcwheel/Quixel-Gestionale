"use client";

import DashboardLayout from "../dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { chatLogsApi } from "@/lib/api-endpoints";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type ChatLogApiItem = {
  id: string;
  ai_account_id: string;
  project_id?: string | null;
  role: "system" | "user" | "assistant";
  content: string;
  tokens_used: number;
  cost_credits: number;
  rating?: number | null;
  created_at: string;
  model_used?: string | null;
};

type ChatLogRow = {
  id: string;
  ai_account_id: string;
  project_id?: string | null;
  role: "system" | "user" | "assistant";
  content: string;
  tokens_used: number;
  cost_credits: number;
  rating?: number | null;
  created_at: string;
  model_used?: string | null;
};

const fallbackChats: ChatLogRow[] = [
  { id: "1", ai_account_id: "1", role: "assistant", content: "Build a REST API with FastAPI...", tokens_used: 2450, cost_credits: 0.085, rating: 5, created_at: "2024-08-15T15:30:00Z", model_used: "GPT-4 Turbo", project_id: "1" },
  { id: "2", ai_account_id: "3", role: "assistant", content: "Refactor this React component...", tokens_used: 1800, cost_credits: 0.045, rating: 4, created_at: "2024-08-15T14:20:00Z", model_used: "Claude 3 Opus", project_id: "2" },
  { id: "3", ai_account_id: "4", role: "assistant", content: "Write unit tests for...", tokens_used: 3200, cost_credits: 0.032, rating: 3, created_at: "2024-08-15T13:10:00Z", model_used: "Gemini Pro", project_id: "4" },
];

export default function ChatLogsPage() {
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const { data, isError } = useQuery({
    queryKey: ["chat-logs"],
    queryFn: async () => {
      const res = await chatLogsApi.list(1, 100);
      const items = (res.data?.items ?? []) as unknown as ChatLogApiItem[];
      return items.map((item) => ({
        id: item.id,
        ai_account_id: item.ai_account_id,
        project_id: item.project_id ?? null,
        role: item.role,
        content: item.content,
        tokens_used: item.tokens_used ?? 0,
        cost_credits: item.cost_credits ?? 0,
        rating: item.rating ?? null,
        created_at: item.created_at,
        model_used: item.model_used ?? null,
      }));
    },
    retry: false,
  });

  const chats = isError && !data ? fallbackChats : data ?? [];
  const filteredChats = ratingFilter
    ? chats.filter((chat) => chat.rating === ratingFilter)
    : chats;

  const totalTokens = chats.reduce((sum, chat) => sum + chat.tokens_used, 0);
  const totalCost = chats.reduce((sum, chat) => sum + chat.cost_credits, 0);
  const avgRating = chats.length
    ? (chats.reduce((sum, chat) => sum + (chat.rating || 0), 0) / chats.length).toFixed(1)
    : "0.0";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chat Logs</h2>
          <p className="text-muted-foreground">Review AI conversations and rate quality.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Chats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{chats.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{formatCurrency(totalCost)}</span>
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
                <span className="text-2xl font-bold">{avgRating}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={ratingFilter === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setRatingFilter(null)}
          >
            All
          </Badge>
          {[5, 4, 3, 2, 1].map((rating) => (
            <Badge
              key={rating}
              variant={ratingFilter === rating ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setRatingFilter(rating)}
            >
              {rating} stars
            </Badge>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {isError && !data && (
              <p className="mb-4 text-sm text-muted-foreground">Uso dati di fallback locale.</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChats.map((chat) => (
                  <TableRow key={chat.id}>
                    <TableCell className="text-sm capitalize">{chat.role}</TableCell>
                    <TableCell className="text-sm">{chat.project_id || "—"}</TableCell>
                    <TableCell>
                      <div className="max-w-[320px] truncate text-sm" title={chat.content}>
                        {chat.content}
                      </div>
                      {chat.model_used && (
                        <div className="text-xs text-muted-foreground">{chat.model_used}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{chat.tokens_used.toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(chat.cost_credits)}</TableCell>
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
