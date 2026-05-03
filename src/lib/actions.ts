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
  const startTime = String(formData.get("due_time") ?? "").trim() || null;
  const endTime = String(formData.get("end_time") ?? "").trim() || null;
  const due_at = combineDateAndTime(date, startTime);
  const ends_at = endTime ? combineDateAndTime(date, endTime) : null;
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

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const priority = readPriority(formData);
  const category = readCategory(formData);
  const { due_at, ends_at } = readDateRange(formData);

  if (serviceSupabaseConfigured) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, priority, category, due_at, ends_at })
      .select("id")
      .single();
    if (error) {
      console.error("createTask insert failed:", error);
    } else if (data && due_at) {
      const eventId = await createTaskEvent({
        title,
        dueAt: due_at,
        endsAt: ends_at,
        description: descriptionFor(priority, category) || undefined,
      });
      if (eventId) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ google_event_id: eventId })
          .eq("id", data.id);
        if (updateError) {
          console.error("createTask save google_event_id failed:", updateError);
        }
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function updateTask(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;
  const priority = readPriority(formData);
  const category = readCategory(formData);
  const { due_at, ends_at } = readDateRange(formData);

  if (!serviceSupabaseConfigured) {
    revalidatePath("/");
    revalidatePath("/tasks");
    revalidatePath("/calendar");
    return;
  }

  const supabase = getServiceSupabase();
  const { data: existing } = await supabase
    .from("tasks")
    .select("google_event_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("tasks")
    .update({ title, priority, category, due_at, ends_at })
    .eq("id", id);
  if (error) {
    console.error("updateTask failed:", error);
  } else if (due_at) {
    const description = descriptionFor(priority, category) || undefined;
    if (existing?.google_event_id) {
      await updateTaskEvent(String(existing.google_event_id), {
        title,
        dueAt: due_at,
        endsAt: ends_at,
        description,
      });
    } else {
      const eventId = await createTaskEvent({
        title,
        dueAt: due_at,
        endsAt: ends_at,
        description,
      });
      if (eventId) {
        await supabase
          .from("tasks")
          .update({ google_event_id: eventId })
          .eq("id", id);
      }
    }
  } else if (existing?.google_event_id) {
    await deleteTaskEvent(String(existing.google_event_id));
    await supabase
      .from("tasks")
      .update({ google_event_id: null })
      .eq("id", id);
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
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
