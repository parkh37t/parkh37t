import { cache } from "react";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase";

export type ProfileRole = "admin" | "member";
export type ProfileStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: ProfileRole;
  status: ProfileStatus;
  createdAt: string;
};

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    name: String(row.name ?? ""),
    phone: (row.phone as string | null) ?? null,
    role: ((row.role as ProfileRole) ?? "member"),
    status: ((row.status as ProfileStatus) ?? "pending"),
    createdAt: String(row.created_at ?? ""),
  };
}

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!supabaseConfigured) return null;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, phone, role, status, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProfile(data);
});

export async function requireApprovedProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("UNAUTHENTICATED");
  if (profile.status !== "approved") throw new Error("NOT_APPROVED");
  return profile;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin" && profile.status === "approved";
}
