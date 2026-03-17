import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

/** Message thrown when env vars are missing or invalid; routes can use this to return 503. */
export const SUPABASE_CONFIG_ERROR_MESSAGE =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local with valid values.";

const SUPABASE_CONFIG_ERROR = SUPABASE_CONFIG_ERROR_MESSAGE;

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const validUrl =
    url?.startsWith("http://") || url?.startsWith("https://");
  if (!url || !key || !validUrl) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
  return { url, key };
}

function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header.trim()) return [];
  return header.split(";").map((part) => {
    const eq = part.indexOf("=");
    const name = (eq > 0 ? part.slice(0, eq) : part).trim();
    const value = (eq > 0 ? part.slice(eq + 1) : "").trim();
    return { name, value };
  }).filter((c) => c.name);
}

/**
 * Supabase client for Server Components and Server Actions.
 * Creates a new client per request using the request cookie store.
 * For API Route Handlers use createRouteHandlerClient instead.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore in Server Components; middleware will handle refresh
        }
      },
    },
  });
}

/**
 * Supabase client for API Route Handlers (app/api/.../route.ts).
 * Pass the request and the response you will return; setAll writes cookies to it.
 * Return that same response so Set-Cookie headers are sent.
 */
export function createRouteHandlerClient(
  request: NextRequest,
  response: { cookies: { set: (name: string, value: string, options?: Record<string, unknown>) => void } }
) {
  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseEnv();

  const cookieHeader = request.headers.get("cookie") ?? "";
  const allCookies = parseCookieHeader(cookieHeader);

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return allCookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });
}
