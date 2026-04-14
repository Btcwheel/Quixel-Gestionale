import { api } from "./api";
import type {
  DashboardStats,
  ActivityData,
  Client,
  ClientCreate,
  Project,
  ProjectCreate,
  AIAccount,
  AIAccountCreate,
  ChatLog,
  Alert,
  ExternalResource,
  SyncLog,
  PaginatedResponse,
  AuthResponse,
  LoginRequest,
  User,
} from "@/types";

// Auth
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>("/api/v1/auth/login", new URLSearchParams({
      username: data.username,
      password: data.password,
    }).toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),
  me: () => api.get<User>("/api/v1/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/api/v1/auth/change-password", { current_password: currentPassword, new_password: newPassword }),
  initAdmin: (password: string) =>
    api.post("/api/v1/auth/init", { username: "admin", password }),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/api/v1/dashboard/stats"),
  activity: (days = 30) => api.get<ActivityData[]>(`/api/v1/dashboard/activity?days=${days}`),
  recentActivity: (limit = 10) => api.get(`/api/v1/dashboard/recent?limit=${limit}`),
};

// Alerts
export const alertsApi = {
  list: (resolved = false) => api.get<Alert[]>(`/api/v1/alerts?resolved=${resolved}`),
  resolve: (id: string) => api.post(`/api/v1/alerts/${id}/resolve`),
};

// Clients
export const clientsApi = {
  list: (page = 1, size = 20, search?: string) =>
    api.get<PaginatedResponse<Client>>("/api/v1/clients/", {
      params: { page, size, search },
    }),
  get: (id: string) => api.get<Client>(`/api/v1/clients/${id}`),
  create: (data: ClientCreate) => api.post<Client>("/api/v1/clients/", data),
  update: (id: string, data: Partial<ClientCreate>) => api.put<Client>(`/api/v1/clients/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/clients/${id}`),
};

// Projects
export const projectsApi = {
  list: (page = 1, size = 20, search?: string, clientId?: string, status?: string) =>
    api.get<PaginatedResponse<Project>>("/api/v1/projects/", {
      params: { page, size, search, client_id: clientId, status },
    }),
  get: (id: string) => api.get<Project>(`/api/v1/projects/${id}`),
  create: (data: ProjectCreate) => api.post<Project>("/api/v1/projects/", data),
  update: (id: string, data: Partial<ProjectCreate>) => api.put<Project>(`/api/v1/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/projects/${id}`),
  analytics: (id: string) => api.get(`/api/v1/projects/${id}/analytics`),
};

// AI Accounts
export const aiAccountsApi = {
  list: (page = 1, size = 20, provider?: string) =>
    api.get<PaginatedResponse<AIAccount>>("/api/v1/ai-accounts/", {
      params: { page, size, provider },
    }),
  get: (id: string) => api.get<AIAccount>(`/api/v1/ai-accounts/${id}`),
  create: (data: AIAccountCreate) => api.post<AIAccount>("/api/v1/ai-accounts/", data),
  update: (id: string, data: Partial<AIAccountCreate>) => api.put<AIAccount>(`/api/v1/ai-accounts/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/ai-accounts/${id}`),
  updateCredits: (id: string, credits: number) =>
    api.post(`/api/v1/ai-accounts/${id}/credits`, { credits }),
  usageReport: (id: string) => api.get(`/api/v1/ai-accounts/${id}/usage-report`),
};

// Chat Logs
export const chatLogsApi = {
  list: (page = 1, size = 20, accountId?: string, projectId?: string) =>
    api.get<PaginatedResponse<ChatLog>>("/api/v1/chats/", {
      params: { page, size, account_id: accountId, project_id: projectId },
    }),
  rate: (id: string, rating: number) => api.post(`/api/v1/chats/${id}/rate`, { rating }),
};

// External Resources
export const resourcesApi = {
  list: (page = 1, size = 20, type?: string, projectId?: string) =>
    api.get<PaginatedResponse<ExternalResource>>("/api/v1/resources/", {
      params: { page, size, resource_type: type, project_id: projectId },
    }),
  create: (data: Partial<ExternalResource>) => api.post<ExternalResource>("/api/v1/resources/", data),
  sync: (resourceId?: string, type = "all") =>
    api.post("/api/v1/resources/sync", { resource_id: resourceId, type }),
  syncLogs: (resourceId: string, page = 1, size = 20) =>
    api.get(`/api/v1/resources/${resourceId}/sync-logs`, {
      params: { page, size },
    }),
};

// API Keys
export const apiKeysApi = {
  list: (page = 1, size = 20, provider?: string) =>
    api.get("/api/v1/api-keys/", {
      params: { page, size, provider },
    }),
  create: (data: { name: string; key: string; provider: string; scopes?: string[] }) =>
    api.post("/api/v1/api-keys/", data),
  toggle: (id: string) => api.put(`/api/v1/api-keys/${id}/toggle`),
  delete: (id: string) => api.delete(`/api/v1/api-keys/${id}`),
};

// Webhook Events
export const webhookEventsApi = {
  list: (page = 1, size = 20, provider?: string, verified?: boolean, processed?: boolean) =>
    api.get("/api/v1/webhook-events/", {
      params: { page, size, provider, verified, processed },
    }),
};
