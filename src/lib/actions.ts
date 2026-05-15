"use server";

import { revalidatePath } from "next/cache";
import {
  createTaskEvent,
  deleteTaskEvent,
  updateTaskEvent,
} from "@/lib/google-calendar";
import { getCurrentProfile } from "@/lib/auth";
import {
  getServerSupabase,
  getServiceSupabase,
  serviceSupabaseConfigured,
  supabaseConfigured,
} from "@/lib/supabase";
import type { Category, Priority } from "@/types";

const VALID_PRIORITIES: Priority[] = ["low", "med", "high"];
const VALID_CATEGORIES: Category[] = [
  "work",
  "personal",
  "health",
  "study",
  "default",
];

const APP_TIMEZONE_OFFSET =
  process.env.APP_TIMEZONE_OFFSET?.trim() || "+09:00";

function combineDateAndTime(
  date: string,
  time: string | null,
): string | null {
  if (!date) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const parsed = new Date(`${date}T${t}:00${APP_TIMEZONE_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function readPriority(formData: FormData): Priority {
  const raw = String(formData.get("priority") ?? "");
  return VALID_PRIORITIES.includes(raw as Priority)
    ? (raw as Priority)
    : "med";
}

function readCategory(formData: FormData): Category {
  const raw = String(formData.get("category") ?? "");
  return VALID_CATEGORIES.includes(raw as Category)
    ? (raw as Category)
    : "default";
}

function readDateRange(formData: FormData): {
  due_at: string | null;
  ends_at: string | null;
} {
  const date = String(formData.get("due_date") ?? "").trim();
  const endDateRaw = String(formData.get("end_date") ?? "").trim();
  const endDate = endDateRaw || date;
  const startTime = String(formData.get("due_time") ?? "").trim() || null;
  const endTime = String(formData.get("end_time") ?? "").trim() || null;
  const allDay = String(formData.get("all_day") ?? "") === "true";
  const due_at = combineDateAndTime(date, allDay ? "00:00" : startTime);
  let ends_at: string | null = null;
  if (allDay) {
    ends_at = combineDateAndTime(endDate || date, "23:59");
  } else if (endTime || endDateRaw) {
    ends_at = combineDateAndTime(endDate, endTime ?? startTime);
  }
  if (due_at && ends_at) {
    const s = new Date(due_at).getTime();
    const e = new Date(ends_at).getTime();
    if (e === s) {
      ends_at = null;
    } else if (e < s) {
      ends_at = new Date(e + 24 * 60 * 60 * 1000).toISOString();
    }
  }
  return { due_at, ends_at };
}

function descriptionFor(priority: Priority, category: Category): string {
  return [
    `우선순위: ${priority}`,
    category !== "default" ? `카테고리: ${category}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

async function authorizedUser() {
  if (!supabaseConfigured) return null;
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "approved") return null;
  return profile;
}

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const profile = await authorizedUser();
  if (!profile) return;

  const priority = readPriority(formData);
  const category = readCategory(formData);
  const { due_at, ends_at } = readDateRange(formData);

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: profile.id,
      title,
      priority,
      category,
      due_at,
      ends_at,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[createTask] insert failed:", error);
  } else if (data && due_at && profile.role === "admin") {
    const result = await createTaskEvent({
      title,
      dueAt: due_at,
      endsAt: ends_at,
      description: descriptionFor(priority, category) || undefined,
    });
    if (result.ok) {
      await supabase
        .from("tasks")
        .update({ google_event_id: result.id })
        .eq("id", data.id);
    } else {
      console.warn(
        `[createTask] task ${data.id} saved but Google event was not created: ${result.reason}`,
      );
    }
  }

  revalidateAll();
}

export async function updateTask(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;
  const profile = await authorizedUser();
  if (!profile) return;

  const priority = readPriority(formData);
  const category = readCategory(formData);
  const { due_at, ends_at } = readDateRange(formData);

  const supabase = await getServerSupabase();
  const { data: existing } = await supabase
    .from("tasks")
    .select("google_event_id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== profile.id) return;

  const { error } = await supabase
    .from("tasks")
    .update({ title, priority, category, due_at, ends_at })
    .eq("id", id);
  if (error) {
    console.error("updateTask failed:", error);
  } else if (due_at && profile.role === "admin") {
    const description = descriptionFor(priority, category) || undefined;
    if (existing.google_event_id) {
      await updateTaskEvent(String(existing.google_event_id), {
        title,
        dueAt: due_at,
        endsAt: ends_at,
        description,
      });
    } else {
      const result = await createTaskEvent({
        title,
        dueAt: due_at,
        endsAt: ends_at,
        description,
      });
      if (result.ok) {
        await supabase
          .from("tasks")
          .update({ google_event_id: result.id })
          .eq("id", id);
      } else {
        console.warn(
          `[updateTask] Google event not created: ${result.reason}`,
        );
      }
    }
  } else if (!due_at && existing.google_event_id) {
    await deleteTaskEvent(String(existing.google_event_id));
    await supabase
      .from("tasks")
      .update({ google_event_id: null })
      .eq("id", id);
  }

  revalidateAll();
}

export async function toggleTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const done = formData.get("done") === "true";
  if (!id) return;
  const profile = await authorizedUser();
  if (!profile) return;

  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("tasks")
    .update({ done: !done })
    .eq("id", id)
    .eq("user_id", profile.id);
  if (error) console.error("toggleTask update failed:", error);

  revalidateAll();
}

export type SyncResult = { ok: true } | { ok: false; error: string };

export async function syncTaskToGoogle(taskId: string): Promise<SyncResult> {
  const id = taskId.trim();
  if (!id) return { ok: false, error: "잘못된 요청 (id 없음)" };
  const profile = await authorizedUser();
  if (!profile) return { ok: false, error: "로그인이 필요합니다." };
  if (profile.role !== "admin") {
    return {
      ok: false,
      error: "Google Calendar 동기화는 관리자만 사용할 수 있어요.",
    };
  }
  if (!serviceSupabaseConfigured) {
    return { ok: false, error: "서버 DB가 설정돼 있지 않습니다." };
  }

  const supabase = getServiceSupabase();
  const { data: existing } = await supabase
    .from("tasks")
    .select("title, priority, category, due_at, ends_at, google_event_id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "할 일을 찾을 수 없습니다." };
  if (existing.user_id !== profile.id) {
    return { ok: false, error: "내 할 일만 동기화할 수 있어요." };
  }
  if (!existing.due_at) {
    return { ok: false, error: "마감일이 없으면 동기화할 수 없습니다." };
  }

  const description = descriptionFor(
    (existing.priority as Priority) ?? "med",
    (existing.category as Category) ?? "default",
  );

  const dueAtStr = String(existing.due_at);
  const originalEnds = (existing.ends_at as string | null) ?? null;
  let endsAtStr = originalEnds;
  if (endsAtStr) {
    const s = new Date(dueAtStr).getTime();
    const e = new Date(endsAtStr).getTime();
    if (e === s) endsAtStr = null;
    else if (e < s) endsAtStr = new Date(e + 24 * 60 * 60 * 1000).toISOString();
  }
  if (endsAtStr !== originalEnds) {
    await supabase.from("tasks").update({ ends_at: endsAtStr }).eq("id", id);
  }

  let result: SyncResult;
  if (existing.google_event_id) {
    await updateTaskEvent(String(existing.google_event_id), {
      title: String(existing.title),
      dueAt: dueAtStr,
      endsAt: endsAtStr,
      description,
    });
    result = { ok: true };
  } else {
    const created = await createTaskEvent({
      title: String(existing.title),
      dueAt: dueAtStr,
      endsAt: endsAtStr,
      description,
    });
    if (created.ok) {
      await supabase
        .from("tasks")
        .update({ google_event_id: created.id })
        .eq("id", id);
      result = { ok: true };
    } else {
      result = { ok: false, error: created.reason };
    }
  }

  revalidateAll();
  return result;
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const profile = await authorizedUser();
  if (!profile) return;

  const supabase = await getServerSupabase();
  const { data: existing } = await supabase
    .from("tasks")
    .select("google_event_id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== profile.id) return;
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", profile.id);
  if (error) console.error("deleteTask failed:", error);
  else if (existing.google_event_id && profile.role === "admin") {
    await deleteTaskEvent(String(existing.google_event_id));
  }

  revalidateAll();
}

export async function createNote(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  const profile = await authorizedUser();
  if (!profile) return;
  const supabase = await getServerSupabase();
  const { error } = await supabase
    .from("notes")
    .insert({ content, user_id: profile.id });
  if (error) console.error("createNote insert failed:", error);
  revalidatePath("/");
}

// ============================================================
// Calendar viewing: opt in/out of seeing other members' tasks
// ============================================================

export async function setCalendarViews(
  viewedUserIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await authorizedUser();
  if (!profile) return { ok: false, error: "로그인이 필요합니다." };
  const supabase = await getServerSupabase();
  // Replace the full list for this user
  await supabase.from("calendar_views").delete().eq("user_id", profile.id);
  const wanted = viewedUserIds
    .map((s) => s.trim())
    .filter((s) => s && s !== profile.id);
  if (wanted.length > 0) {
    const rows = wanted.map((viewed_user_id) => ({
      user_id: profile.id,
      viewed_user_id,
    }));
    const { error } = await supabase.from("calendar_views").insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/calendar");
  return { ok: true };
}
