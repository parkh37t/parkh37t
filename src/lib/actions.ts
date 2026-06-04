"use server";

import { revalidatePath } from "next/cache";
import {
  createTaskEvent,
  deleteTaskEvent,
  updateTaskEvent,
} from "@/lib/google-calendar";
import {
  getServiceSupabase,
  serviceSupabaseConfigured,
} from "@/lib/supabase";
import {
  descriptionFor,
  isMissingLocationColumn,
  readCategory,
  readDateRange,
  readLocation,
  readPriority,
  type TaskSaveResult,
} from "@/lib/task-helpers";
import type { Category, Priority } from "@/types";

export type { TaskSaveResult } from "@/lib/task-helpers";

export async function createTask(
  formData: FormData,
): Promise<TaskSaveResult> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, google: "skipped" };
  const priority = readPriority(formData);
  const category = readCategory(formData);
  const location = readLocation(formData);
  const { due_at, ends_at } = readDateRange(formData);

  console.log(
    `[createTask] title="${title}" due_at=${due_at ?? "null"} ends_at=${ends_at ?? "null"}`,
  );

  let result: TaskSaveResult = { ok: false, google: "skipped" };

  if (serviceSupabaseConfigured) {
    const supabase = getServiceSupabase();
    const insertRow: Record<string, unknown> = {
      title,
      priority,
      category,
      due_at,
      ends_at,
    };
    if (location) insertRow.location = location;
    let { data, error } = await supabase
      .from("tasks")
      .insert(insertRow)
      .select("id")
      .single();
    if (error && location && isMissingLocationColumn(error)) {
      console.warn(
        "[createTask] 'location' column missing — retrying without it. Run the migration: alter table tasks add column if not exists location text;",
      );
      delete insertRow.location;
      ({ data, error } = await supabase
        .from("tasks")
        .insert(insertRow)
        .select("id")
        .single());
    }
    if (error) {
      console.error("[createTask] insert failed:", error);
      result = {
        ok: false,
        google: "skipped",
        saveError: `저장 실패: ${error.message ?? "알 수 없는 DB 오류"}`,
      };
    } else if (data && due_at) {
      const synced = await createTaskEvent({
        title,
        dueAt: due_at,
        endsAt: ends_at,
        description: descriptionFor(priority, category) || undefined,
        location: location || null,
      });
      if (synced.ok) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ google_event_id: synced.id })
          .eq("id", data.id);
        if (updateError) {
          console.error(
            "[createTask] save google_event_id failed:",
            updateError,
          );
        }
        result = { ok: true, google: "synced" };
      } else {
        console.warn(
          `[createTask] task ${data.id} saved but Google event was not created: ${synced.reason}`,
        );
        result = { ok: true, google: "failed", googleError: synced.reason };
      }
    } else if (data) {
      console.log(
        `[createTask] task ${data.id} saved without due_at; skipping Google sync`,
      );
      result = { ok: true, google: "skipped" };
    }
  } else {
    console.warn("[createTask] serviceSupabaseConfigured is false; nothing saved");
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  return result;
}

export async function updateTask(
  formData: FormData,
): Promise<TaskSaveResult> {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return { ok: false, google: "skipped" };
  const priority = readPriority(formData);
  const category = readCategory(formData);
  const location = readLocation(formData);
  const { due_at, ends_at } = readDateRange(formData);

  if (!serviceSupabaseConfigured) {
    revalidatePath("/");
    revalidatePath("/tasks");
    revalidatePath("/calendar");
    return { ok: false, google: "skipped" };
  }

  const supabase = getServiceSupabase();
  const { data: existing } = await supabase
    .from("tasks")
    .select("google_event_id")
    .eq("id", id)
    .maybeSingle();

  const updateRow: Record<string, unknown> = {
    title,
    priority,
    category,
    due_at,
    ends_at,
  };
  if (location) updateRow.location = location;
  let { error } = await supabase
    .from("tasks")
    .update(updateRow)
    .eq("id", id);
  if (error && location && isMissingLocationColumn(error)) {
    console.warn(
      "[updateTask] 'location' column missing — retrying without it. Run the migration: alter table tasks add column if not exists location text;",
    );
    delete updateRow.location;
    ({ error } = await supabase
      .from("tasks")
      .update(updateRow)
      .eq("id", id));
  }
  let result: TaskSaveResult = { ok: false, google: "skipped" };
  if (error) {
    console.error("updateTask failed:", error);
    result = {
      ok: false,
      google: "skipped",
      saveError: `저장 실패: ${error.message ?? "알 수 없는 DB 오류"}`,
    };
  } else if (due_at) {
    const description = descriptionFor(priority, category) || undefined;
    if (existing?.google_event_id) {
      const synced = await updateTaskEvent(String(existing.google_event_id), {
        title,
        dueAt: due_at,
        endsAt: ends_at,
        description,
        location: location || null,
      });
      result = synced.ok
        ? { ok: true, google: "synced" }
        : { ok: true, google: "failed", googleError: synced.reason };
    } else {
      const synced = await createTaskEvent({
        title,
        dueAt: due_at,
        endsAt: ends_at,
        description,
        location: location || null,
      });
      if (synced.ok) {
        await supabase
          .from("tasks")
          .update({ google_event_id: synced.id })
          .eq("id", id);
        result = { ok: true, google: "synced" };
      } else {
        console.warn(`[updateTask] Google event not created: ${synced.reason}`);
        result = { ok: true, google: "failed", googleError: synced.reason };
      }
    }
  } else {
    if (existing?.google_event_id) {
      await deleteTaskEvent(String(existing.google_event_id));
      await supabase
        .from("tasks")
        .update({ google_event_id: null })
        .eq("id", id);
    }
    result = { ok: true, google: "skipped" };
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  return result;
}

export async function toggleTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const done = formData.get("done") === "true";
  if (!id) return;

  if (serviceSupabaseConfigured) {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("tasks")
      .update({ done: !done })
      .eq("id", id);
    if (error) console.error("toggleTask update failed:", error);
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export type SyncResult = { ok: true } | { ok: false; error: string };

export async function syncTaskToGoogle(taskId: string): Promise<SyncResult> {
  const id = taskId.trim();
  if (!id) return { ok: false, error: "잘못된 요청 (id 없음)" };
  if (!serviceSupabaseConfigured) {
    return { ok: false, error: "서버 DB가 설정돼 있지 않습니다." };
  }

  const supabase = getServiceSupabase();
  const { data: existing } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    console.warn(`[syncTaskToGoogle] task ${id} not found`);
    return { ok: false, error: "할 일을 찾을 수 없습니다." };
  }
  if (!existing.due_at) {
    console.warn(`[syncTaskToGoogle] task ${id} has no due_at; skipping`);
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
    if (e === s) {
      endsAtStr = null;
    } else if (e < s) {
      endsAtStr = new Date(e + 24 * 60 * 60 * 1000).toISOString();
    }
  }
  if (endsAtStr !== originalEnds) {
    const { error: fixErr } = await supabase
      .from("tasks")
      .update({ ends_at: endsAtStr })
      .eq("id", id);
    if (fixErr) {
      console.error("[syncTaskToGoogle] failed to persist corrected ends_at:", fixErr);
    } else {
      console.log(
        `[syncTaskToGoogle] corrected ends_at for task ${id}: ${originalEnds} -> ${endsAtStr ?? "null"}`,
      );
    }
  }

  const locationStr = (existing.location as string | null) ?? null;

  let result: SyncResult;
  if (existing.google_event_id) {
    const updated = await updateTaskEvent(String(existing.google_event_id), {
      title: String(existing.title),
      dueAt: dueAtStr,
      endsAt: endsAtStr,
      description,
      location: locationStr,
    });
    result = updated.ok ? { ok: true } : { ok: false, error: updated.reason };
  } else {
    const created = await createTaskEvent({
      title: String(existing.title),
      dueAt: dueAtStr,
      endsAt: endsAtStr,
      description,
      location: locationStr,
    });
    if (created.ok) {
      const { error } = await supabase
        .from("tasks")
        .update({ google_event_id: created.id })
        .eq("id", id);
      if (error) {
        console.error("[syncTaskToGoogle] save google_event_id failed:", error);
        result = {
          ok: false,
          error: "Google 이벤트는 만들었지만 DB에 id 저장 실패",
        };
      } else {
        console.log(
          `[syncTaskToGoogle] linked task ${id} -> google event ${created.id}`,
        );
        result = { ok: true };
      }
    } else {
      console.warn(
        `[syncTaskToGoogle] task ${id} failed: ${created.reason}`,
      );
      result = { ok: false, error: created.reason };
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  return result;
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  if (serviceSupabaseConfigured) {
    const supabase = getServiceSupabase();
    const { data: existing } = await supabase
      .from("tasks")
      .select("google_event_id")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("deleteTask failed:", error);
    } else if (existing?.google_event_id) {
      await deleteTaskEvent(String(existing.google_event_id));
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function createNote(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  if (serviceSupabaseConfigured) {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from("notes").insert({ content });
    if (error) console.error("createNote insert failed:", error);
  }

  revalidatePath("/");
}
