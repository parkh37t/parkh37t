"use server";

import { revalidatePath } from "next/cache";
import {
  createTaskEvent,
  deleteTaskEvent,
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

function parseDueAt(raw: string): string | null {
  if (!raw) return null;
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)
    ? `${raw}:00`
    : raw;
  const parsed = new Date(`${withSeconds}${APP_TIMEZONE_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "");
  const categoryRaw = String(formData.get("category") ?? "");
  const dueRaw = String(formData.get("due_at") ?? "").trim();

  const priority = VALID_PRIORITIES.includes(priorityRaw as Priority)
    ? (priorityRaw as Priority)
    : "med";
  const category = VALID_CATEGORIES.includes(categoryRaw as Category)
    ? (categoryRaw as Category)
    : "default";
  const due_at = parseDueAt(dueRaw);
  if (!title) return;

  if (serviceSupabaseConfigured) {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title, priority, category, due_at })
      .select("id")
      .single();
    if (error) {
      console.error("createTask insert failed:", error);
    } else if (data && due_at) {
      const description = [
        `우선순위: ${priority}`,
        category !== "default" ? `카테고리: ${category}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const eventId = await createTaskEvent({
        title,
        dueAt: due_at,
        description: description || undefined,
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
