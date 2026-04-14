"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText, Plus, Edit2, Trash2, Save, X, Eye, Code, Copy, CheckCircle,
  Search, Filter, Download, Link as LinkIcon, FolderKanban, ExternalLink
} from "lucide-react";
import Link from "next/link";

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
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
}

interface DocumentsResponse {
  items: Document[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Document Card Component
function DocumentCard({
  doc,
  onEdit,
  onDelete,
  onCopyLink,
  onDownload,
  copiedId,
  getDocIcon,
  getTypeColor,
  showProject = false,
  projects = [],
}: {
  doc: Document;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink: () => void;
  onDownload: () => void;
  copiedId: string | null;
  getDocIcon: (ext: string) => string;
  getTypeColor: (type: string) => string;
  showProject?: boolean;
  projects?: Project[];
}) {
  const projectName = doc.project_id
    ? projects.find(p => p.id === doc.project_id)?.name
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getDocIcon(doc.file_extension)}</span>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {doc.title}
              </h3>
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                  doc.document_type
                )}`}
              >
                {doc.document_type.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {showProject && projectName && (
          <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-blue-50 rounded-lg">
            <FolderKanban className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-900 font-medium">{projectName}</span>
          </div>
        )}

        {doc.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {doc.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>v{doc.version}</span>
          <span>{doc.is_public ? "🌍 Pubblico" : "🔒 Privato"}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Modifica</span>
          </button>
          <button
            onClick={onCopyLink}
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
            onClick={onDownload}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Scarica"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Elimina"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [groupByProject, setGroupByProject] = useState(true);

  // New document form
  const [newDoc, setNewDoc] = useState({
    project_id: "",
    title: "",
    document_type: "markdown",
    file_extension: ".md",
    content: "",
    description: "",
    is_public: false,
  });
  const [showNewDocForm, setShowNewDocForm] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchDocuments();
    fetchProjects();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/api/v1/documents/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data.items);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_URL}/api/v1/projects/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data.items || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
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
        project_id: "",
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

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "all" || doc.document_type === filterType;
    const matchesProject =
      filterProject === "all" || doc.project_id === filterProject;
    return matchesSearch && matchesType && matchesProject;
  });

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const projectId = doc.project_id || "ungrouped";
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "Documenti Generali";
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Progetto Sconosciuto";
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
      case "pdr":
        return "bg-purple-100 text-purple-800";
      case "markdown":
        return "bg-blue-100 text-blue-800";
      case "specification":
        return "bg-green-100 text-green-800";
      case "prompt":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento documenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Documenti Progetto
              </h1>
              <p className="text-gray-600 mt-1">
                Gestisci PDR, file Markdown, specifiche e prompt
              </p>
            </div>
            <button
              onClick={() => setShowNewDocForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Nuovo Documento</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cerca documenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutti i tipi</option>
                <option value="pdr">PDR</option>
                <option value="markdown">Markdown</option>
                <option value="specification">Specifiche</option>
                <option value="prompt">Prompt</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-gray-500" />
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutti i progetti</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setGroupByProject(!groupByProject)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                groupByProject
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-700 border border-gray-300"
              }`}
            >
              {groupByProject ? "📁 Per Progetto" : "📄 Lista"}
            </button>
          </div>
        </div>

        {/* Documents Grouped by Project */}
        {groupByProject ? (
          <div className="space-y-8">
            {Object.entries(groupedDocs).map(([projectId, docs]) => (
              <div key={projectId} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Project Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-900">
                      {getProjectName(projectId === "ungrouped" ? null : projectId)}
                    </h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {docs.length} documenti
                    </span>
                    {projectId !== "ungrouped" && (
                      <Link
                        href={`/projects/${projectId}`}
                        className="ml-auto text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Vai al progetto
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {docs.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onEdit={() => {
                          setEditingDoc(doc);
                          setShowEditor(true);
                        }}
                        onDelete={() => deleteDocument(doc.id)}
                        onCopyLink={() => copyDocumentLink(doc)}
                        onDownload={() => downloadDocument(doc)}
                        copiedId={copiedId}
                        getDocIcon={getDocIcon}
                        getTypeColor={getTypeColor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Flat List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onEdit={() => {
                  setEditingDoc(doc);
                  setShowEditor(true);
                }}
                onDelete={() => deleteDocument(doc.id)}
                onCopyLink={() => copyDocumentLink(doc)}
                onDownload={() => downloadDocument(doc)}
                copiedId={copiedId}
                getDocIcon={getDocIcon}
                getTypeColor={getTypeColor}
                showProject
                projects={projects}
              />
            ))}
          </div>
        )}

        {filteredDocs.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {documents.length === 0
                ? "Nessun documento creato. Clicca 'Nuovo Documento' per iniziare!"
                : "Nessun documento trovato con i filtri selezionati"}
            </p>
          </div>
        )}
      </div>

      {/* New Document Modal */}
      {showNewDocForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Nuovo Documento
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo
                </label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Es: Project Requirements Document"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progetto (opzionale)
                  </label>
                  <select
                    value={newDoc.project_id}
                    onChange={(e) =>
                      setNewDoc({ ...newDoc, project_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Nessun progetto (generale)</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newDoc.document_type}
                    onChange={(e) =>
                      setNewDoc({ ...newDoc, document_type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="pdr">PDR</option>
                    <option value="specification">Specifiche</option>
                    <option value="prompt">Prompt</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estensione
                  </label>
                  <select
                    value={newDoc.file_extension}
                    onChange={(e) =>
                      setNewDoc({ ...newDoc, file_extension: e.target.value })
                    }
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <input
                  type="text"
                  value={newDoc.description}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Breve descrizione del documento"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newDoc.is_public}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, is_public: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700">
                  Documento pubblico (accessibile tramite link)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenuto
                </label>
                <textarea
                  value={newDoc.content}
                  onChange={(e) =>
                    setNewDoc({ ...newDoc, content: e.target.value })
                  }
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
                <Save className="w-5 h-5" />
                <span>Crea Documento</span>
              </button>
              <button
                onClick={() => setShowNewDocForm(false)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Annulla</span>
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
              <h2 className="text-2xl font-bold text-gray-900">
                Modifica Documento
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setViewMode(viewMode === "edit" ? "preview" : "edit")
                  }
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
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo
                </label>
                <input
                  type="text"
                  value={editingDoc.title}
                  onChange={(e) =>
                    setEditingDoc({ ...editingDoc, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_is_public"
                    checked={editingDoc.is_public}
                    onChange={(e) =>
                      setEditingDoc({
                        ...editingDoc,
                        is_public: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  <label
                    htmlFor="edit_is_public"
                    className="text-sm text-gray-700"
                  >
                    Pubblico
                  </label>
                </div>
                <span className="text-sm text-gray-500">v{editingDoc.version}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenuto
                </label>
                {viewMode === "edit" ? (
                  <textarea
                    value={editingDoc.content}
                    onChange={(e) =>
                      setEditingDoc({
                        ...editingDoc,
                        content: e.target.value,
                      })
                    }
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
                <Save className="w-5 h-5" />
                <span>Salva Modifiche</span>
              </button>
              <button
                onClick={() => {
                  setEditingDoc(null);
                  setShowEditor(false);
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Annulla</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
