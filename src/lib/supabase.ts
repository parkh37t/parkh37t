import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options: CookieOptions) =>
        cookieStore.set({ name, value, ...options }),
      remove: (name, options: CookieOptions) =>
        cookieStore.set({ name, value: "", ...options }),
    },
  });
}

export function getServiceSupabase() {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export const supabaseConfigured = Boolean(url && anonKey);
