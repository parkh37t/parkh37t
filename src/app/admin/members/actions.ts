"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { getServiceSupabase, serviceSupabaseConfigured } from "@/lib/supabase";

type Result = { ok: true } | { ok: false; error: string };

async function ensureAdmin(): Promise<Result> {
  if (!serviceSupabaseConfigured) {
    return { ok: false, error: "서버 DB가 설정되지 않았습니다." };
  }
  if (!(await isAdmin())) {
    return { ok: false, error: "관리자 권한이 필요합니다." };
  }
  return { ok: true };
}

function revalidate() {
  revalidatePath("/admin/members");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function approveMember(id: string): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function rejectMember(id: string): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function setMemberRole(
  id: string,
  role: "admin" | "member",
): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateMember(
  id: string,
  patch: { name?: string; phone?: string | null },
): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  const supabase = getServiceSupabase();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof patch.name === "string") update.name = patch.name.trim();
  if ("phone" in patch) update.phone = patch.phone;
  const { error } = await supabase.from("profiles").update(update).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteMember(id: string): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  const supabase = getServiceSupabase();
  // Removing from auth.users will cascade to profiles + related data.
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function createMember(input: {
  email: string;
  name: string;
  phone?: string | null;
  password: string;
  role?: "admin" | "member";
}): Promise<Result> {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard;
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name) {
    return { ok: false, error: "이메일과 이름은 필수입니다." };
  }
  if (!/^\d{6}$/.test(input.password)) {
    return { ok: false, error: "비밀번호는 숫자 6자리여야 합니다." };
  }
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name, phone: input.phone ?? null },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "사용자 생성 실패" };
  }
  // The trigger will create the profile row; we then approve + set role.
  const { error: pErr } = await supabase
    .from("profiles")
    .update({
      status: "approved",
      role: input.role ?? "member",
      name,
      phone: input.phone ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.user.id);
  if (pErr) return { ok: false, error: pErr.message };
  revalidate();
  return { ok: true };
}
