import { createBrowserClient } from "@supabase/ssr";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseEnv() {
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}
