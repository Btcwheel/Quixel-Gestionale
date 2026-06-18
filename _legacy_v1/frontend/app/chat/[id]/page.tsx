"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Copy, CheckCircle, Share2, MessageSquare, Clock, Hash } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Message {
  id: string;
  role: string;
  content: string;
  tokens_used: number;
  cost_credits: number;
  model_used: string | null;
  rating: number | null;
  created_at: string;
  message_index: number;
}

interface Conversation {
  conversation_id: string;
  title: string;
  messages: Message[];
  total_messages: number;
  created_at: string;
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await axios.get(`${API_URL}/api/v1/chat-logs/public/${conversationId}`);
        setConversation(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching conversation:", err);
        setError("Conversazione non trovata o non disponibile");
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  const copyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "user":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "assistant":
        return "bg-green-100 text-green-900 border-green-200";
      case "system":
        return "bg-gray-100 text-gray-900 border-gray-200";
      default:
        return "bg-purple-100 text-purple-900 border-purple-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case "user":
        return "👤";
      case "assistant":
        return "🤖";
      case "system":
        return "⚙️";
      default:
        return "💬";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento conversazione...</p>
        </div>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-600 mb-6">{error || "Conversazione non trovata"}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">
                    {conversation.title || "Conversazione AI"}
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    {conversation.total_messages} messaggi
                  </span>
                  {conversation.created_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(new Date(conversation.created_at), "dd MMM yyyy, HH:mm", { locale: it })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Copiato!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Condividi</span>
                </>
              )}
            </button>
          </div>

          {/* Conversation ID */}
          <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-mono">
              ID: {conversation.conversation_id}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {conversation.messages.map((message, index) => (
            <div
              key={message.id}
              className={`rounded-lg border-2 p-6 ${getRoleColor(message.role)}`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getRoleIcon(message.role)}</span>
                  <span className="font-semibold capitalize">{message.role}</span>
                  {message.model_used && (
                    <span className="text-xs px-2 py-1 bg-white/50 rounded-full">
                      {message.model_used}
                    </span>
                  )}
                </div>
                <span className="text-xs opacity-75">
                  #{message.message_index + 1}
                </span>
              </div>

              {/* Message Content */}
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {message.content}
              </div>

              {/* Message Metadata */}
              <div className="mt-4 pt-4 border-t border-current/10 flex items-center gap-4 text-xs opacity-75">
                {message.tokens_used > 0 && (
                  <span>🔢 {message.tokens_used} token</span>
                )}
                {message.cost_credits > 0 && (
                  <span>💰 {message.cost_credits.toFixed(4)} crediti</span>
                )}
                {message.rating && (
                  <span>
                    ⭐ {message.rating}/5
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Questa conversazione è stata condivisa tramite link pubblico.
          </p>
          <p className="mt-1">
            {conversation.total_messages} messaggi • Generato il {format(new Date(), "dd MMM yyyy", { locale: it })}
          </p>
        </div>
      </div>
    </div>
  );
}
