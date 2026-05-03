import { getServerSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Note } from "@/types";

export async function listRecentNotes(): Promise<Note[]> {
  if (!supabaseConfigured) return [];
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    content: String(row.content),
    createdAt: String(row.created_at),
  }));
}
