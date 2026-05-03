"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Category, Priority } from "@/types";

const VALID_PRIORITIES: Priority[] = ["low", "med", "high"];
const VALID_CATEGORIES: Category[] = [
  "default",
  "work",
  "personal",
  "health",
  "study",
];

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "");
  const categoryRaw = String(formData.get("category") ?? "");
  const dueAtRaw = String(formData.get("dueAt") ?? "");

  const priority: Priority = VALID_PRIORITIES.includes(priorityRaw as Priority)
    ? (priorityRaw as Priority)
    : "med";
  const category: Category = VALID_CATEGORIES.includes(categoryRaw as Category)
    ? (categoryRaw as Category)
    : "default";
  const due_at = dueAtRaw ? new Date(dueAtRaw).toISOString() : null;

  if (!title) return;

  if (supabaseConfigured) {
    const supabase = await getServerSupabase();
    await supabase.from("tasks").insert({ title, priority, category, due_at });
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
