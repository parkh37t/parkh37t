import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const SUPABASE_TIMEOUT_MS = 5000;

// Fail fast when Supabase is unreachable (e.g. a paused free-tier project)
// instead of letting each request hang for the platform default (~30s+),
// which makes the whole page feel frozen. supabase-js calls this for every
// query, so an aborted fetch surfaces quickly as "fetch failed" and our
// retry/friendly-message path in actions.ts can take over.
const timeoutFetch: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  if (init?.signal) {
    if (init.signal.aborted) controller.abort();
    else
      init.signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
};

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) =>
        cookieStore.set({ name, value, ...options }),
      remove: (name: string, options: CookieOptions) =>
        cookieStore.set({ name, value: "", ...options }),
    },
    global: { fetch: timeoutFetch },
  });
}

export function getServiceSupabase() {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    global: { fetch: timeoutFetch },
  });
}

export const supabaseConfigured = Boolean(url && anonKey);
export const serviceSupabaseConfigured = Boolean(url && serviceKey);
