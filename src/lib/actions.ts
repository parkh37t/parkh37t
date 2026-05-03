"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Priority } from "@/types";

const VALID_PRIORITIES: Priority[] = ["low", "med", "high"];

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "");
  const priority = VALID_PRIORITIES.includes(priorityRaw as Priority)
    ? (priorityRaw as Priority)
    : "med";
  if (!title) return;

  if (supabaseConfigured) {
    const supabase = await getServerSupabase();
    await supabase.from("tasks").insert({ title, priority });
  }

  revalidatePath("/");
  revalidatePath("/tasks");
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
