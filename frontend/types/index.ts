// Client types
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  project_count?: number;
}

export interface ClientCreate {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  tags?: string[];
}

// Project types
export interface Project {
  id: string;
  client_id: string;
  client_name?: string;
  name: string;
  description?: string;
  status: "planning" | "active" | "completed" | "archived";
  start_date?: string;
  end_date?: string;
  budget?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  client_id: string;
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// AI Account types
export interface AIAccount {
  id: string;
  provider: string;
  model: string;
  account_name: string;
  priority: number;
  credits_remaining: number;
  credits_total: number;
  rate_limit_per_min: number;
  concurrent_requests: number;
  is_active: boolean;
  is_rate_limited: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface AIAccountCreate {
  provider: string;
  model: string;
  account_name: string;
  api_key: string;
  priority?: number;
  credits_total?: number;
  rate_limit_per_min?: number;
}

// Chat log types
export interface ChatLog {
  id: string;
  ai_account_id: string;
  project_id?: string;
  prompt: string;
  response: string;
  tokens_used: number;
  cost: number;
  rating?: number;
  created_at: string;
}

// External resource types
export interface ExternalResource {
  id: string;
  project_id: string;
  resource_type: "github_repo" | "supabase_project" | "vercel_deployment";
  external_id: string;
  name: string;
  url: string;
  owner?: string;
  branch?: string;
  is_active: boolean;
  last_sync_status: "pending" | "in_progress" | "success" | "failed" | "cancelled";
  last_sync_at?: string;
  github_full_name?: string;
  supabase_region?: string;
  vercel_target?: string;
  extra_metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ExternalResourceCreate {
  project_id: string;
  resource_type: "github_repo" | "supabase_project" | "vercel_deployment";
  external_id: string;
  name: string;
  url: string;
  owner?: string;
  branch?: string;
  github_full_name?: string;
  supabase_region?: string;
  vercel_target?: string;
}

export interface SyncLog {
  id: string;
  resource_id: string;
  provider: "github" | "supabase" | "vercel";
  status: "pending" | "in_progress" | "success" | "failed" | "cancelled";
  action: string;
  triggered_by: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  extra_metadata?: Record<string, unknown>;
}

export interface APIKey {
  id: string;
  name: string;
  provider: string;
  scopes?: string[];
  expires_at?: string;
  is_active: boolean;
  last_rotated_at?: string;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  provider: "github" | "supabase" | "vercel";
  event_type: string;
  external_id: string;
  is_verified: boolean;
  processed: boolean;
  received_at: string;
}

// Alert types
export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

// Dashboard types
export interface DashboardStats {
  total_clients: number;
  active_projects: number;
  total_projects: number;
  ai_accounts_active: number;
  total_chats_today: number;
  total_deployments: number;
  unresolved_alerts: number;
}

export interface ActivityData {
  date: string;
  chats: number;
  deployments: number;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  is_active: boolean;
  created_at: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
