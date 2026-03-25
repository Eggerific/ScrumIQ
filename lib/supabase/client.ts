import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components only.
 * Use createServerClient from server.ts in Server Components and API routes.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const validUrl =
    supabaseUrl?.startsWith("http://") || supabaseUrl?.startsWith("https://");
    

  if (!supabaseUrl || !supabaseAnonKey || !validUrl) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with valid values."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
