"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Category, Priority } from "@/types";

const VALID_PRIORITIES: Priority[] = ["low", "med", "high"];
const VALID_CATEGORIES: Category[] = [
  "work",
  "personal",
  "health",
  "study",
  "default",
];

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
  const due_at = dueRaw ? new Date(dueRaw).toISOString() : null;
  if (!title) return;

  if (supabaseConfigured) {
    const supabase = await getServerSupabase();
    await supabase
      .from("tasks")
      .insert({ title, priority, category, due_at });
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function toggleTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const done = formData.get("done") === "true";
  if (!id) return;

  if (supabaseConfigured) {
    const supabase = await getServerSupabase();
    await supabase.from("tasks").update({ done: !done }).eq("id", id);
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  if (supabaseConfigured) {
    const supabase = await getServerSupabase();
    await supabase.from("tasks").delete().eq("id", id);
  }

  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
}

export async function createNote(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  if (supabaseConfigured) {
    const supabase = await getServerSupabase();
    await supabase.from("notes").insert({ content });
  }

  revalidatePath("/");
}
