import {
  getServiceSupabase,
  serviceSupabaseConfigured,
} from "@/lib/supabase";

const SINGLETON_ID = "default";

export type StoredTokens = {
  access_token: string;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string | null;
  token_type?: string | null;
};

export async function getStoredTokens(): Promise<StoredTokens | null> {
  if (!serviceSupabaseConfigured) return null;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("id", SINGLETON_ID)
    .maybeSingle();
  if (error) {
    console.error("[google-tokens] read failed:", error);
    return null;
  }
  if (!data || !data.access_token) return null;
  return {
    access_token: String(data.access_token),
    refresh_token: data.refresh_token ?? null,
    expiry_date:
      typeof data.expiry_date === "number"
        ? data.expiry_date
        : data.expiry_date == null
          ? null
          : Number(data.expiry_date),
    scope: data.scope ?? null,
    token_type: data.token_type ?? null,
  };
}

export async function saveStoredTokens(tokens: StoredTokens): Promise<void> {
  if (!serviceSupabaseConfigured) return;
  if (!tokens.access_token) {
    console.warn("[google-tokens] skipped save: no access_token");
    return;
  }
  const supabase = getServiceSupabase();
  const { error } = await supabase.from("google_tokens").upsert({
    id: SINGLETON_ID,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: tokens.expiry_date ?? null,
    scope: tokens.scope ?? null,
    token_type: tokens.token_type ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[google-tokens] save failed:", error);
}

export async function clearStoredTokens(): Promise<void> {
  if (!serviceSupabaseConfigured) return;
  const supabase = getServiceSupabase();
  await supabase.from("google_tokens").delete().eq("id", SINGLETON_ID);
}
