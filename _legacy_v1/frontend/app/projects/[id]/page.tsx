"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft, FolderKanban, FileText, Plus, Edit2, Trash2, Download,
  Copy, CheckCircle, Link as LinkIcon, Eye, Code, MessageCircle,
  Shield, Key, Codepen, Gitlab, Container, Cloud, Server, Terminal
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

interface Discussion {
  id: string;
  project_id: string;
  provider: string;
  model_used: string | null;
  title: string;
  raw_content: string;
  insights: string;
  code_snippets: string;
  decisions: string;
  action_items: string;
  tags: string[] | null;
  created_at: string;
}

interface ExternalAccount {
  id: string;
  project_id: string;
  provider: string;
  external_id: string;
  name: string;
  url: string;
  owner: string | null;
  branch: string | null;
  username: string | null;
  is_active: boolean;
  github_full_name: string | null;
  supabase_region: string | null;
  vercel_target: string | null;
  aws_region: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "discussions">("overview");
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

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [showNewDiscussionForm, setShowNewDiscussionForm] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    project_id: projectId,
    provider: "openai",
    model_used: "",
    title: "",
    raw_content: "",
    tags: [] as string[],
  });
  
   // External Accounts state
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ExternalAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [totpCode, setTotpCode] = useState<string>("");
  const [decryptedCredentials, setDecryptedCredentials] = useState<any>(null);
  const [vaultEntries, setVaultEntries] = useState<any[]>([]);
   const [showCredentialsModal, setShowCredentialsModal] = useState(false);
   
   // Vault credential creation
   const [showAddCredentialModal, setShowAddCredentialModal] = useState(false);
   const [credentialForm, setCredentialForm] = useState({
     account_name: "",
     credential_type: "api_key",
     credentials_json: "{}",
     notes: "",
   });
   
   // Plans state
   const [plans, setPlans] = useState<any[]>([]);
   const [plansLoading, setPlansLoading] = useState(false);
   const [showPlanModal, setShowPlanModal] = useState(false);
   const [selectedPlan, setSelectedPlan] = useState<any>(null);
   const [generatingPlan, setGeneratingPlan] = useState(false);
   
   // Context state
   const [projectContext, setProjectContext] = useState<any>(null);
   const [contextLoading, setContextLoading] = useState(false);
   const [showContextModal, setShowContextModal] = useState(false);
   
   const [accountForm, setAccountForm] = useState<{
    provider: ExternalAccountProvider;
    external_id: string;
    name: string;
    url: string;
    owner: string | null;
    branch: string | null;
    username: string | null;
    github_full_name: string | null;
    supabase_region: string | null;
    vercel_target: string | null;
    aws_region: string | null;
  }>({
    provider: ExternalAccountProvider.GITHUB,
    external_id: "",
    name: "",
    url: "",
    owner: null,
    branch: null,
    username: null,
    github_full_name: null,
    supabase_region: null,
    vercel_target: null,
    aws_region: null,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

enum ExternalAccountProvider {
  GITHUB = "github",
  SUPABASE = "supabase",
  VERCEL = "vercel",
  DOCKER_HUB = "docker_hub",
  CLOUDFLARE = "cloudflare",
  AWS = "aws",
  CUSTOM = "custom"
}

const providerIcons: Record<string, any> = {
  [ExternalAccountProvider.GITHUB]: Gitlab,
  [ExternalAccountProvider.SUPABASE]: Server,
  [ExternalAccountProvider.VERCEL]: Terminal,
  [ExternalAccountProvider.DOCKER_HUB]: Container,
  [ExternalAccountProvider.CLOUDFLARE]: Cloud,
  [ExternalAccountProvider.AWS]: Server,
  [ExternalAccountProvider.CUSTOM]: Codepen,
};

const providerNames: Record<string, string> = {
  [ExternalAccountProvider.GITHUB]: "GitHub",
  [ExternalAccountProvider.SUPABASE]: "Supabase",
  [ExternalAccountProvider.VERCEL]: "Vercel",
  [ExternalAccountProvider.DOCKER_HUB]: "Docker Hub",
  [ExternalAccountProvider.CLOUDFLARE]: "Cloudflare",
  [ExternalAccountProvider.AWS]: "AWS",
  [ExternalAccountProvider.CUSTOM]: "Custom",
};

   useEffect(() => {
     fetchProject();
     fetchDocuments();
     fetchDiscussions();
     fetchAccounts();
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

   const fetchDiscussions = async () => {
     try {
       const token = localStorage.getItem("access_token");
       const response = await axios.get(`${API_URL}/api/v1/discussions/by-project/${projectId}`, {
         headers: { Authorization: `Bearer ${token}` },
       });
       setDiscussions(response.data.items || []);
     } catch (error) {
       console.error("Error fetching discussions:", error);
     }
   };

   const fetchAccounts = async () => {
     setAccountLoading(true);
     try {
       const token = localStorage.getItem("access_token");
       const response = await axios.get(`${API_URL}/api/v1/projects/${projectId}/accounts`, {
         headers: { Authorization: `Bearer ${token}` },
       });
       setAccounts(response.data.items || response.data || []);
     } catch (error) {
       console.error("Error fetching accounts:", error);
     } finally {
       setAccountLoading(false);
     }
   };

   const createAccount = async () => {
     try {
       const token = localStorage.getItem("access_token");
       const response = await axios.post(
         `${API_URL}/api/v1/projects/${projectId}/accounts`,
         { ...accountForm },
         { headers: { Authorization: `Bearer ${token}` } }
       );
       setAccounts([response.data, ...accounts]);
       setShowAccountModal(false);
       // Reset form
       setAccountForm({
         provider: ExternalAccountProvider.GITHUB,
         external_id: "",
         name: "",
         url: "",
         owner: null,
         branch: null,
         username: null,
         github_full_name: null,
         supabase_region: null,
         vercel_target: null,
         aws_region: null,
       });
     } catch (error) {
       console.error("Error creating account:", error);
       alert("Errore nella creazione dell'account");
     }
   };

   const fetchVaultEntries = async (account: ExternalAccount) => {
     setSelectedAccount(account);
     setVaultLoading(true);
     try {
       const token = localStorage.getItem("access_token");
       const response = await axios.get(
         `${API_URL}/api/v1/projects/${projectId}/accounts/${account.id}/vault`,
         { headers: { Authorization: `Bearer ${token}` } }
       );
       setVaultEntries(response.data || []);
       setShowVaultModal(true);
     } catch (error: any) {
       console.error("Error fetching vault entries:", error);
       alert(error.response?.data?.detail || "Errore nel caricamento delle credenziali");
     } finally {
       setVaultLoading(false);
     }
   };

   const unlockVault = async (vaultId: string) => {
     if (!selectedAccount) return;
     
     setVaultLoading(true);
     try {
       const token = localStorage.getItem("access_token");
       const response = await axios.post(
         `${API_URL}/api/v1/projects/${projectId}/accounts/${selectedAccount.id}/vault/${vaultId}/unlock`,
         { code: totpCode },
         { headers: { Authorization: `Bearer ${token}` } }
       );
       
       setDecryptedCredentials(response.data.credentials);
       setShowCredentialsModal(true);
       setTotpCode("");
     } catch (error: any) {
       console.error("Error unlocking vault:", error);
       alert(error.response?.data?.detail || "Errore nello sblocco del vault");
     } finally {
       setVaultLoading(false);
     }
   };

   const deleteAccount = async (accountId: string) => {
     if (!confirm("Sei sicuro di voler eliminare questo account? Le credenziali collegate verranno rimosse.")) return;
     try {
       const token = localStorage.getItem("access_token");
       await axios.delete(
         `${API_URL}/api/v1/projects/${projectId}/accounts/${accountId}`,
         { headers: { Authorization: `Bearer ${token}` } }
       );
       setAccounts(accounts.filter(a => a.id !== accountId));
     } catch (error: any) {
       console.error("Error deleting account:", error);
       alert(error.response?.data?.detail || "Errore nell'eliminazione dell'account");
     }
   };
   
   const createCredential = async () => {
     if (!selectedAccount) return;
     try {
       const token = localStorage.getItem("access_token");
       const payload = {
         project_id: projectId,
         provider: selectedAccount.provider,
         account_name: credentialForm.account_name,
         credential_type: credentialForm.credential_type,
         credentials: JSON.parse(credentialForm.credentials_json),
         notes: credentialForm.notes || undefined,
       };
       await axios.post(
         `${API_URL}/api/v1/projects/${projectId}/accounts/${selectedAccount.id}/vault`,
         payload,
         { headers: { Authorization: `Bearer ${token}` } }
       );
       setShowAddCredentialModal(false);
       setCredentialForm({ account_name: "", credential_type: "api_key", credentials_json: "{}", notes: "" });
       // Refresh vault entries
       fetchVaultEntries(selectedAccount);
     } catch (error: any) {
       console.error("Error creating credential:", error);
       alert(error.response?.data?.detail || "Errore nel salvataggio delle credenziali");
     }
   };
   
   // Plan management
   const fetchPlans = async () => {
     setPlansLoading(true);
     try {
       const token = localStorage.getItem("access_token");
       const response = await axios.get(
         `${API_URL}/api/v1/projects/${projectId}/plan`,
         { headers: { Authorization: `Bearer ${token}` } }
       );
       setPlans(response.data || []);
     } catch (error) {
       console.error("Error fetching plans:", error);
     } finally {
       setPlansLoading(false);
     }
   };
   
   const generatePlan = async (title?: string) => {
     setGeneratingPlan(true);
     try {
       const token = localStorage.getItem("access_token");
       const response = await axios.post(
         `${API_URL}/api/v1/projects/${projectId}/plan/generate`,
         { title: title || `${project?.name} - Piano di Sviluppo` },
         { headers: { Authorization: `Bearer ${token}` } }
       );
       setPlans([response.data, ...plans]);
       setShowPlanModal(false);
     } catch (error: any) {
       console.error("Error generating plan:", error);
       alert(error.response?.data?.detail || "Errore nella generazione del piano");
     } finally {
       setGeneratingPlan(false);
     }
   };
   
   const approvePlan = async (planId: string) => {
     try {
       const token = localStorage.getItem("access_token");
       await axios.post(
         `${API_URL}/api/v1/projects/${projectId}/plan/${planId}/approve`,
         {},
         { headers: { Authorization: `Bearer ${token}` } }
       );
       fetchPlans();
     } catch (error: any) {
       console.error("Error approving plan:", error);
       alert(error.response?.data?.detail || "Errore nell'approvazione del piano");
     }
   };
   
   const archivePlan = async (planId: string) => {
     try {
       const token = localStorage.getItem("access_token");
       await axios.post(
         `${API_URL}/api/v1/projects/${projectId}/plan/${planId}/archive`,
         {},
         { headers: { Authorization: `Bearer ${token}` } }
       );
       fetchPlans();
     } catch (error: any) {
       console.error("Error archiving plan:", error);
       alert(error.response?.data?.detail || "Errore nell'archiviazione del piano");
     }
   };
   
   // Context recovery
   const fetchContext = async () => {
     setContextLoading(true);
     try {
       const token = localStorage.getItem("access_token");
       const response = await axios.get(
         `${API_URL}/api/v1/projects/${projectId}/context`,
         { headers: { Authorization: `Bearer ${token}` } }
       );
       setProjectContext(response.data);
       setShowContextModal(true);
     } catch (error: any) {
       console.error("Error fetching context:", error);
       alert(error.response?.data?.detail || "Errore nel recupero del contesto");
     } finally {
       setContextLoading(false);
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

  const deleteDocument = async (docId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo documento?")) return;
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(`${API_URL}/api/v1/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(documents.filter(d => d.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Errore nell'eliminazione del documento");
    }
  };

  const updateDocument = async () => {
    if (!editingDoc) return;
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.put(
        `${API_URL}/api/v1/documents/${editingDoc.id}`,
        { ...editingDoc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments(documents.map(d => d.id === editingDoc.id ? response.data : d));
      setShowEditor(false);
      setEditingDoc(null);
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Errore nell'aggiornamento del documento");
    }
  };

  const extractAndSaveDiscussion = async () => {
    if (!newDiscussion.raw_content || !newDiscussion.title) {
      alert("Inserisci il contenuto e il titolo");
      return;
    }
    setExtracting(true);
    try {
      const token = localStorage.getItem("access_token");
      
      const extractResponse = await axios.post(
        `${API_URL}/api/v1/discussions/extract`,
        {
          raw_content: newDiscussion.raw_content,
          provider: newDiscussion.provider,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const createResponse = await axios.post(
        `${API_URL}/api/v1/discussions/`,
        {
          ...newDiscussion,
          insights: extractResponse.data.insights,
          code_snippets: extractResponse.data.code_snippets,
          decisions: extractResponse.data.decisions,
          action_items: extractResponse.data.action_items,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDiscussions([createResponse.data, ...discussions]);
      setShowNewDiscussionForm(false);
      setNewDiscussion({
        project_id: projectId,
        provider: "openai",
        model_used: "",
        title: "",
        raw_content: "",
        tags: [],
      });
    } catch (error) {
      console.error("Error extracting discussion:", error);
      alert("Errore nell'estrazione degli insight");
    } finally {
      setExtracting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-yellow-100 text-yellow-800";
      case "active": return "bg-green-100 text-green-800";
      case "on_hold": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "pdr": return "bg-purple-100 text-purple-800";
      case "markdown": return "bg-gray-100 text-gray-800";
      case "specification": return "bg-red-100 text-red-800";
      case "prompt": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getDocIcon = (ext: string) => {
    switch (ext) {
      case ".py": return "🐍";
      case ".js": return "📜";
      case ".ts": return "📘";
      case ".tsx": return "⚛️";
      case ".md": return "📝";
      case ".json": return "📋";
      case ".yml": return "⚙️";
      default: return "📄";
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/projects")}
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
              <span className="text-gray-600">€{project.budget.toLocaleString()}</span>
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

         </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === "overview"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-transparent"
            }`}
          >
            Panoramica
          </button>
          <button
            onClick={() => setActiveTab("discussions")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "discussions"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-transparent"
            }`}
          >
            Discussioni
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {discussions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "documents"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-transparent"
            }`}
          >
            Documenti
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {documents.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "accounts"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-transparent"
            }`}
          >
            Account
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {accounts.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab("plans"); fetchPlans(); }}
            className={`px-4 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "plans"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 hover:text-gray-900 border-transparent"
            }`}
          >
            Piani
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {plans.length}
            </span>
          </button>
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
            
            <button
              onClick={fetchContext}
              disabled={contextLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-gray-500"
            >
              {contextLoading ? (
                <span>⏳ Caricamento contesto...</span>
              ) : (
                <>
                  <span>📋</span>
                  <span>Recupera Contesto Progetto</span>
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "discussions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Discussioni AI</h2>
              <button
                onClick={() => setShowNewDiscussionForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nuova Discussione</span>
              </button>
            </div>

            {discussions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Nessuna discussione per questo progetto</p>
                <button
                  onClick={() => setShowNewDiscussionForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Aggiungi prima discussione</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {discussions.map((disc) => (
                  <div
                    key={disc.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{disc.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-500">{disc.provider}</span>
                          {disc.model_used && (
                            <span className="text-sm text-gray-400">• {disc.model_used}</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {format(new Date(disc.created_at), "dd MMM yyyy HH:mm", { locale: it })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {disc.insights && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Insight</h4>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                          {disc.insights}
                        </div>
                      </div>
                    )}

                    {disc.code_snippets && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Code Snippet</h4>
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
                          <code>{disc.code_snippets}</code>
                        </pre>
                      </div>
                    )}

                    {disc.decisions && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Decisioni</h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                          {disc.decisions}
                        </div>
                      </div>
                    )}

                    {disc.action_items && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Todo</h4>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                          {disc.action_items}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

         {activeTab === "accounts" && (
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold text-gray-900">Account Esterni</h2>
               <div className="flex gap-2">
                 <button
                   onClick={() => setShowAccountModal(true)}
                   className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   <Plus className="w-5 h-5" />
                   <span>Aggiungi Account</span>
                 </button>
               </div>
             </div>

             {accounts.length === 0 ? (
               <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                 <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                 <p className="text-gray-500 mb-4">Nessun account collegato a questo progetto</p>
                 <button
                   onClick={() => setShowAccountModal(true)}
                   className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   <Plus className="w-5 h-5" />
                   <span>Aggiungi primo account</span>
                 </button>
               </div>
             ) : (
               <div className="divide-y divide-gray-200">
                 {accounts.map((account) => (
                   <div key={account.id} className="py-6">
                     <div className="flex items-start justify-between mb-3">
                       <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-50">
                            {(() => {
                              const Icon = providerIcons[account.provider as keyof typeof providerIcons];
                              return Icon ? <Icon className="w-5 h-5 text-blue-600" /> : null;
                            })()}
                          </div>
                         <div>
                           <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                           <div className="flex items-center gap-2 mt-1">
                             <span className="text-sm text-gray-500">{providerNames[account.provider as keyof typeof providerNames]}</span>
                             {account.is_active ? (
                               <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                 Attivo
                               </span>
                             ) : (
                               <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                 Inattivo
                               </span>
                             )}
                           </div>
                           {account.username && (
                             <p className="text-sm text-gray-600 mt-1">Username: {account.username}</p>
                           )}
                         </div>
                       </div>
                       <div className="text-right">
                          <button
                            onClick={() => fetchVaultEntries(account)}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            <Key className="w-4 h-4" />
                            Gestisci Credenziali
                          </button>
                       </div>
                     </div>

                     {account.github_full_name && (
                       <div className="bg-gray-50 p-4 rounded-lg mt-4">
                         <p className="text-sm text-gray-600">
                           <strong>Repository:</strong> {account.github_full_name}
                         </p>
                         {account.branch && (
                           <p className="text-sm text-gray-600">
                             <strong>Branch:</strong> {account.branch}
                           </p>
                         )}
                       </div>
                     )}

                     {account.supabase_region && (
                       <div className="bg-gray-50 p-4 rounded-lg mt-4">
                         <p className="text-sm text-gray-600">
                           <strong>Regione Supabase:</strong> {account.supabase_region}
                         </p>
                       </div>
                     )}

                     {account.vercel_target && (
                       <div className="bg-gray-50 p-4 rounded-lg mt-4">
                         <p className="text-sm text-gray-600">
                           <strong>Target Vercel:</strong> {account.vercel_target}
                         </p>
                       </div>
                     )}

                     {account.aws_region && (
                       <div className="bg-gray-50 p-4 rounded-lg mt-4">
                         <p className="text-sm text-gray-600">
                           <strong>Regione AWS:</strong> {account.aws_region}
                         </p>
                       </div>
                     )}

                      <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                        <button
                          onClick={() => deleteAccount(account.id)}
                          className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                          Elimina Account
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
          )}
          
          {activeTab === "plans" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Piani di Sviluppo</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Genera Piano</span>
                  </button>
                  <button
                    onClick={fetchContext}
                    disabled={contextLoading}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {contextLoading ? <span>⏳</span> : <span>📋</span>}
                    <span>Contesto</span>
                  </button>
                </div>
              </div>
              
              {plansLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <p className="text-gray-500">Caricamento piani...</p>
                </div>
              ) : plans.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nessun piano generato per questo progetto</p>
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Genera primo piano</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {plans.map((plan: any) => {
                    const statusColors: Record<string, string> = {
                      draft: "bg-yellow-100 text-yellow-800",
                      generated: "bg-blue-100 text-blue-800",
                      approved: "bg-green-100 text-green-800",
                      archived: "bg-gray-100 text-gray-600",
                    };
                    return (
                      <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[plan.status] || "bg-gray-100 text-gray-700"}`}>
                                {plan.status}
                              </span>
                              <span className="text-sm text-gray-500">v{plan.version}</span>
                              <span className="text-sm text-gray-400">
                                {new Date(plan.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {plan.status === "draft" || plan.status === "generated" ? (
                              <button
                                onClick={() => approvePlan(plan.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approva
                              </button>
                            ) : null}
                            {plan.status !== "archived" ? (
                              <button
                                onClick={() => archivePlan(plan.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Archivia
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                            {plan.content}
                          </pre>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                        <span>{doc.is_public ? "Pubblico" : "Privato"}</span>
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
                          onClick={() => deleteDocument(doc.id)}
                          className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nuovo Documento</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={newDoc.document_type}
                    onChange={(e) => setNewDoc({ ...newDoc, document_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="markdown">Markdown</option>
                    <option value="pdr">PDR</option>
                    <option value="specification">Specifica</option>
                    <option value="prompt">Prompt</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estensione</label>
                  <select
                    value={newDoc.file_extension}
                    onChange={(e) => setNewDoc({ ...newDoc, file_extension: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value=".md">.md</option>
                    <option value=".txt">.txt</option>
                    <option value=".py">.py</option>
                    <option value=".js">.js</option>
                    <option value=".ts">.ts</option>
                    <option value=".json">.json</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenuto</label>
                <textarea
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                <textarea
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newDoc.is_public}
                  onChange={(e) => setNewDoc({ ...newDoc, is_public: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Documento pubblico</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={createDocument}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crea Documento
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

      {/* New Discussion Modal */}
      {showNewDiscussionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nuova Discussione AI</h2>
              <p className="text-gray-500 text-sm mt-1">Incolla la chat e estrai gli insight automaticamente</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  placeholder="Es: Discussione su autenticazione JWT"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    value={newDiscussion.provider}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="google">Google (Gemini)</option>
                    <option value="mistral">Mistral</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model (opzionale)</label>
                  <input
                    type="text"
                    value={newDiscussion.model_used}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, model_used: e.target.value })}
                    placeholder="Es: gpt-4, claude-3-opus"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenuto Chat
                </label>
                <textarea
                  value={newDiscussion.raw_content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, raw_content: e.target.value })}
                  placeholder="Incolla qui la tua conversazione con l'AI..."
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={extractAndSaveDiscussion}
                disabled={extracting || !newDiscussion.raw_content || !newDiscussion.title}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extracting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Estrazione in corso...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Estrai Insight</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowNewDiscussionForm(false)}
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
       
       {/* Add Account Modal */}
       {showAccountModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-gray-200">
               <h2 className="text-2xl font-bold text-gray-900">Aggiungi Account Esterno</h2>
             </div>
             <div className="p-6 space-y-4">
               <div className="grid gap-4 md:grid-cols-2">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Nome Account</label>
                   <input
                     type="text"
                     value={accountForm.name}
                     onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                     placeholder="Es: GitHub Produzione, Supabase Staging"
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                   <select
                     value={accountForm.provider}
                     onChange={(e) => setAccountForm({ ...accountForm, provider: e.target.value as ExternalAccountProvider })}
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value={ExternalAccountProvider.GITHUB}>GitHub</option>
                     <option value={ExternalAccountProvider.SUPABASE}>Supabase</option>
                     <option value={ExternalAccountProvider.VERCEL}>Vercel</option>
                     <option value={ExternalAccountProvider.DOCKER_HUB}>Docker Hub</option>
                     <option value={ExternalAccountProvider.CLOUDFLARE}>Cloudflare</option>
                     <option value={ExternalAccountProvider.AWS}>AWS</option>
                     <option value={ExternalAccountProvider.CUSTOM}>Custom</option>
                   </select>
                 </div>
               </div>
               
               <div className="grid gap-4 md:grid-cols-2">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">URL (opzionale)</label>
                   <input
                     type="text"
                     value={accountForm.url}
                     onChange={(e) => setAccountForm({ ...accountForm, url: e.target.value })}
                     placeholder="Es: https://github.com/user/repo"
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Username/Email (opzionale)</label>
                   <input
                     type="text"
                     value={accountForm.username || ""}
                     onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value || null })}
                     placeholder="Es: username@email.com"
                     className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                 </div>
               </div>
               
               {/* Provider-specific fields */}
               {accountForm.provider === ExternalAccountProvider.GITHUB && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Repository (format: owner/repo)</label>
                     <input
                       type="text"
                       value={accountForm.github_full_name || ""}
                       onChange={(e) => setAccountForm({ ...accountForm, github_full_name: e.target.value || null })}
                       placeholder="Es: octocat/Hello-World"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Branch (opzionale)</label>
                     <input
                       type="text"
                       value={accountForm.branch || ""}
                       onChange={(e) => setAccountForm({ ...accountForm, branch: e.target.value || null })}
                       placeholder="Es: main, develop"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                 </div>
               )}
               
               {accountForm.provider === ExternalAccountProvider.SUPABASE && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Project Ref</label>
                     <input
                       type="text"
                       value={accountForm.external_id}
                       onChange={(e) => setAccountForm({ ...accountForm, external_id: e.target.value })}
                       placeholder="Es: abcdefg12345"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Regione (opzionale)</label>
                     <input
                       type="text"
                       value={accountForm.supabase_region || ""}
                       onChange={(e) => setAccountForm({ ...accountForm, supabase_region: e.target.value || null })}
                       placeholder="Es: us-east-1"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                 </div>
               )}
               
               {accountForm.provider === ExternalAccountProvider.VERCEL && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                     <input
                       type="text"
                       value={accountForm.external_id}
                       onChange={(e) => setAccountForm({ ...accountForm, external_id: e.target.value })}
                       placeholder="Es: prj_1234567890"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Target (opzionale)</label>
                     <input
                       type="text"
                       value={accountForm.vercel_target || ""}
                       onChange={(e) => setAccountForm({ ...accountForm, vercel_target: e.target.value || null })}
                       placeholder="Es: production, preview"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                 </div>
               )}
               
               {accountForm.provider === ExternalAccountProvider.AWS && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                     <input
                       type="text"
                       value={accountForm.aws_region || ""}
                       onChange={(e) => setAccountForm({ ...accountForm, aws_region: e.target.value || null })}
                       placeholder="Es: us-east-1"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">External ID (opzionale)</label>
                     <input
                       type="text"
                       value={accountForm.external_id}
                       onChange={(e) => setAccountForm({ ...accountForm, external_id: e.target.value || null })}
                       placeholder="Es: 123456789012"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                 </div>
               )}
               
               {/* Custom fields for other providers */}
               {[ExternalAccountProvider.DOCKER_HUB, ExternalAccountProvider.CLOUDFLARE, ExternalAccountProvider.CUSTOM].includes(accountForm.provider as ExternalAccountProvider) && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">External ID</label>
                     <input
                       type="text"
                       value={accountForm.external_id}
                       onChange={(e) => setAccountForm({ ...accountForm, external_id: e.target.value })}
                       placeholder="Es: ID univoco del servizio"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Nome Visualizzato (opzionale)</label>
                     <input
                       type="text"
                       value={accountForm.name}
                       onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                       placeholder="Es: Nome amichevole per l'account"
                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                 </div>
               )}
             </div>
             <div className="p-6 border-t border-gray-200 flex gap-3">
               <button
                 onClick={createAccount}
                 className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 Aggiungi Account
               </button>
               <button
                 onClick={() => setShowAccountModal(false)}
                 className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
               >
                 Annulla
               </button>
             </div>
           </div>
         </div>
       )}
       
        {/* Vault Modal - List entries and unlock */}
        {showVaultModal && selectedAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Credenziali Salvate</h2>
                    <p className="text-gray-500 text-sm mt-1">{selectedAccount.name}</p>
                  </div>
                  <button onClick={() => { setShowVaultModal(false); setTotpCode(""); }} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowAddCredentialModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi Credenziale
                  </button>
                </div>
                {vaultLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin text-3xl mb-2">⏳</div>
                    <p className="text-gray-500">Caricamento credenziali...</p>
                  </div>
                ) : vaultEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nessuna credenziale salvata per questo account</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vaultEntries.map((entry: any) => (
                      <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{entry.account_name}</h4>
                            <p className="text-sm text-gray-500">{entry.credential_type}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            Accessi: {entry.access_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Codice 2FA
                            </label>
                            <input
                              type="text"
                              value={totpCode}
                              onChange={(e) => setTotpCode(e.target.value)}
                              maxLength={6}
                              placeholder="XXXXXX"
                              className="w-full text-lg font-mono text-center tracking-widest px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <button
                            onClick={() => unlockVault(entry.id)}
                            disabled={vaultLoading || totpCode.length !== 6}
                            className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {vaultLoading ? (
                              <span>⏳</span>
                            ) : (
                              <>
                                <Shield className="w-4 h-4" />
                                <span>Sblocca</span>
                              </>
                            )}
                          </button>
                        </div>
                        {entry.expires_at && (
                          <p className="text-xs text-gray-400 mt-2">
                            Scade il: {new Date(entry.expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Credentials Display Modal */}
        {showCredentialsModal && decryptedCredentials && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Credenziali Sbloccate</h2>
                <button onClick={() => { setShowCredentialsModal(false); setDecryptedCredentials(null); }} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              <div className="p-6">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(decryptedCredentials, null, 2)}
                </pre>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(decryptedCredentials, null, 2));
                      alert("Credenziali copiate!");
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                    Copia
                  </button>
                  <button
                    onClick={() => { setShowCredentialsModal(false); setDecryptedCredentials(null); }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Add Credential Modal */}
        {showAddCredentialModal && selectedAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Salva Credenziale</h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedAccount.name}</p>
                  </div>
                  <button onClick={() => setShowAddCredentialModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Credenziale</label>
                  <input
                    type="text"
                    value={credentialForm.account_name}
                    onChange={(e) => setCredentialForm({ ...credentialForm, account_name: e.target.value })}
                    placeholder="Es: GitHub Production Token"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={credentialForm.credential_type}
                    onChange={(e) => setCredentialForm({ ...credentialForm, credential_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="api_key">API Key</option>
                    <option value="oauth_token">OAuth Token</option>
                    <option value="password">Password</option>
                    <option value="service_role_key">Service Role Key</option>
                    <option value="ssh_key">SSH Key</option>
                    <option value="other">Altro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credenziali (JSON)
                  </label>
                  <textarea
                    value={credentialForm.credentials_json}
                    onChange={(e) => setCredentialForm({ ...credentialForm, credentials_json: e.target.value })}
                    rows={6}
                    placeholder='{"api_key": "sk-...", "endpoint": "https://..."}'
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
                  <textarea
                    value={credentialForm.notes}
                    onChange={(e) => setCredentialForm({ ...credentialForm, notes: e.target.value })}
                    rows={2}
                    placeholder="Note opzionali..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={createCredential}
                  disabled={!credentialForm.account_name || !credentialForm.credentials_json}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  Salva Credenziale
                </button>
                <button
                  onClick={() => setShowAddCredentialModal(false)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Plan Generation Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Genera Piano di Sviluppo</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Il piano verrà generato dalle discussioni e chat del progetto
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titolo del Piano</label>
                  <input
                    type="text"
                    id="planTitle"
                    placeholder={project ? `${project.name} - Piano di Sviluppo` : "Titolo del piano"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Verranno analizzate tutte le discussioni e chat del progetto per generare un piano di sviluppo completo con insight, decisioni e azioni.
                </p>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    const input = document.getElementById("planTitle") as HTMLInputElement;
                    generatePlan(input?.value || undefined);
                  }}
                  disabled={generatingPlan}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {generatingPlan ? (
                    <>
                      <span>⏳</span>
                      <span>Generazione in corso...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Genera Piano</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Context Recovery Modal */}
        {showContextModal && projectContext && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-start justify-between sticky top-0 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contesto del Progetto</h2>
                  <p className="text-sm text-gray-500 mt-1">{projectContext.project_name}</p>
                </div>
                <button onClick={() => setShowContextModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="p-6 space-y-6">
                {/* Key Decisions */}
                {projectContext.key_decisions?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">✅ Decisioni Chiave</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {projectContext.key_decisions.map((d: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700">{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Action Items */}
                {projectContext.action_items?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">📋 Azioni da Eseguire</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {projectContext.action_items.map((a: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700">{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Current Plan */}
                {projectContext.current_plan && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">📄 Piano Corrente</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-medium text-blue-900">{projectContext.current_plan.title}</p>
                      <p className="text-sm text-blue-700 mt-1">{projectContext.current_plan.status}</p>
                    </div>
                  </div>
                )}
                
                {/* Recent Discussions */}
                {projectContext.recent_discussions?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">💬 Discussioni Recenti ({projectContext.recent_discussions.length})</h3>
                    <div className="space-y-2">
                      {projectContext.recent_discussions.slice(0, 5).map((d: any) => (
                        <div key={d.id} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-900">{d.title}</p>
                          <p className="text-xs text-gray-500">{d.provider} • {new Date(d.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* External Accounts */}
                {projectContext.external_accounts?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">🔑 Account Collegati ({projectContext.external_accounts.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {projectContext.external_accounts.map((a: any) => (
                        <span key={a.id} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          {a.name} ({a.provider})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Obsidian Notes */}
                {projectContext.obsidian_notes?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">📝 Note Obsidian ({projectContext.obsidian_notes.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {projectContext.obsidian_notes.map((n: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>
    );
  }