"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Copy, CheckCircle, Download, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Document {
  id: string;
  title: string;
  document_type: string;
  file_extension: string;
  content: string;
  description: string | null;
  version: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export default function PublicDocumentPage() {
  const params = useParams();
  const docId = params.id as string;
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/v1/documents/public/${docId}`);
        setDoc(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Documento non trovato o non accessibile");
      } finally {
        setLoading(false);
      }
    };

    if (docId) {
      fetchDocument();
    }
  }, [docId]);

  const copyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDocument = () => {
    if (!doc) return;
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title}${doc.file_extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento documento...</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-600 mb-6">{error || "Documento non trovato"}</p>
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna ai Documenti
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
                href="/documents"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.document_type === 'pdr' ? 'bg-purple-100 text-purple-800' :
                    doc.document_type === 'markdown' ? 'bg-blue-100 text-blue-800' :
                    doc.document_type === 'specification' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {doc.document_type.toUpperCase()}
                  </span>
                  <span>v{doc.version}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(new Date(doc.updated_at), "dd MMM yyyy", { locale: it })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copia Link</span>
                  </>
                )}
              </button>
              <button
                onClick={downloadDocument}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Scarica {doc.file_extension}</span>
              </button>
            </div>
          </div>

          {doc.description && (
            <div className="mt-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">{doc.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-8">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800">
              {doc.content}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Documento condiviso tramite link pubblico • {doc.file_extension.toUpperCase()} file
          </p>
          <p className="mt-1">
            Ultimo aggiornamento: {format(new Date(doc.updated_at), "dd MMMM yyyy, HH:mm", { locale: it })}
          </p>
        </div>
      </div>
    </div>
  );
}
