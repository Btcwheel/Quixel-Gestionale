"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft, FolderKanban, FileText, Plus, Edit2, Trash2, Download,
  Copy, CheckCircle, Link as LinkIcon, Eye, Code
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  client_name?: string;
  budget?: number;
  tags?: string[];
  created_at: string;
}

interface Document {
  id: string;
  project_id: string | null;
  title: string;
  document_type: string;
  file_extension: string;
  content: string;
  description: string | null;
  version: string;
  is_public: boolean;
  created_at: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "documents">("overview");
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [showNewDocForm, setShowNewDocForm] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newDoc, setNewDoc] = useState({
    project_id: projectId,
    title: "",
    document_type: "markdown",
    file_extension: ".md",
    content: "",
    description: "",
    is_public: false,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchProject();
    fetchDocuments();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/api/v1/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject(response.data);
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/api/v1/documents/?project_id=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data.items || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${API_URL}/api/v1/documents/`,
        { ...newDoc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments([response.data, ...documents]);
      setShowNewDocForm(false);
      setNewDoc({
        project_id: projectId,
        title: "",
        document_type: "markdown",
        file_extension: ".md",
        content: "",
        description: "",
        is_public: false,
      });
    } catch (error) {
      console.error("Error creating document:", error);
      alert("Errore nella creazione del documento");
    }
  };

  const updateDocument = async () => {
    if (!editingDoc) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.put(
        `${API_URL}/api/v1/documents/${editingDoc.id}`,
        editingDoc,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments(
        documents.map((doc) => (doc.id === editingDoc.id ? response.data : doc))
      );
      setEditingDoc(null);
      setShowEditor(false);
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Errore nell'aggiornamento del documento");
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo documento?")) return;
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/api/v1/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Errore nell'eliminazione del documento");
    }
  };

  const copyDocumentLink = async (doc: Document) => {
    const url = `${window.location.origin}/documents/${doc.id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadDocument = (doc: Document) => {
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title}${doc.file_extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "planning": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "archived": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDocIcon = (ext: string) => {
    if (ext === ".py") return "🐍";
    if (ext === ".md") return "📝";
    if (ext === ".txt") return "📄";
    if (ext === ".json") return "📊";
    return "📁";
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "pdr": return "bg-purple-100 text-purple-800";
      case "markdown": return "bg-blue-100 text-blue-800";
      case "specification": return "bg-green-100 text-green-800";
      case "prompt": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento progetto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Progetto non trovato</h2>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna ai Progetti
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <FolderKanban className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                {project.client_name && (
                  <p className="text-gray-600">{project.client_name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            {project.budget && (
              <span className="text-gray-600">💰 €{project.budget.toLocaleString()}</span>
            )}
            {project.tags && (
              <div className="flex gap-2">
                {project.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Panoramica
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === "documents"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Documenti
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                {documents.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Descrizione</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {project.description || "Nessuna descrizione disponibile"}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informazioni</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Creato il</p>
                  <p className="font-medium">{format(new Date(project.created_at), "dd MMMM yyyy", { locale: it })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stato</p>
                  <p className="font-medium capitalize">{project.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Documenti del Progetto</h2>
              <button
                onClick={() => setShowNewDocForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nuovo Documento</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nessun documento per questo progetto</p>
                <button
                  onClick={() => setShowNewDocForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Crea il primo documento</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{getDocIcon(doc.file_extension)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{doc.title}</h3>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(doc.document_type)}`}>
                            {doc.document_type.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>v{doc.version}</span>
                        <span>{doc.is_public ? "🌍 Pubblico" : "🔒 Privato"}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setEditingDoc(doc);
                            setShowEditor(true);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Modifica</span>
                        </button>
                        <button
                          onClick={() => copyDocumentLink(doc)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Copia link"
                        >
                          {copiedId === doc.id ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <LinkIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Scarica"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Document Modal */}
      {showNewDocForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nuovo Documento</h2>
              <p className="text-sm text-gray-600 mt-1">Per il progetto: {project.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Es: Project Requirements Document"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={newDoc.document_type}
                    onChange={(e) => setNewDoc({ ...newDoc, document_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="pdr">PDR</option>
                    <option value="specification">Specifiche</option>
                    <option value="prompt">Prompt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estensione</label>
                  <select
                    value={newDoc.file_extension}
                    onChange={(e) => setNewDoc({ ...newDoc, file_extension: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value=".md">.md</option>
                    <option value=".py">.py</option>
                    <option value=".txt">.txt</option>
                    <option value=".json">.json</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <input
                  type="text"
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Breve descrizione del documento"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newDoc.is_public}
                  onChange={(e) => setNewDoc({ ...newDoc, is_public: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700">
                  Documento pubblico (accessibile tramite link)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto</label>
                <textarea
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="# Inserisci il contenuto qui..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={createDocument}
                disabled={!newDoc.title || !newDoc.content}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-5 h-5" />
                <span>Crea Documento</span>
              </button>
              <button
                onClick={() => setShowNewDocForm(false)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editingDoc && showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Modifica Documento</h2>
              <button
                onClick={() => setViewMode(viewMode === "edit" ? "preview" : "edit")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {viewMode === "edit" ? (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Anteprima</span>
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    <span>Editor</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingDoc.is_public}
                    onChange={(e) => setEditingDoc({ ...editingDoc, is_public: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm text-gray-700">Pubblico</label>
                </div>
                <span className="text-sm text-gray-500">v{editingDoc.version}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto</label>
                {viewMode === "edit" ? (
                  <textarea
                    value={editingDoc.content}
                    onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                    rows={16}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                ) : (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[400px] whitespace-pre-wrap font-mono text-sm">
                    {editingDoc.content}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={updateDocument}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salva Modifiche
              </button>
              <button
                onClick={() => {
                  setEditingDoc(null);
                  setShowEditor(false);
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
