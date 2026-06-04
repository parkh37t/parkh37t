import type { Category, Priority } from "@/types";

export const VALID_PRIORITIES: Priority[] = ["low", "med", "high"];
export const VALID_CATEGORIES: Category[] = [
  "work",
  "personal",
  "health",
  "study",
  "default",
];

export const APP_TIMEZONE_OFFSET =
  process.env.APP_TIMEZONE_OFFSET?.trim() || "+09:00";

export type TaskSaveResult = {
  ok: boolean;
  google: "synced" | "skipped" | "failed";
  googleError?: string;
  saveError?: string;
};

export function combineDateAndTime(
  date: string,
  time: string | null,
): string | null {
  if (!date) return null;
  const t = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const parsed = new Date(`${date}T${t}:00${APP_TIMEZONE_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function readPriority(formData: FormData): Priority {
  const raw = String(formData.get("priority") ?? "");
  return VALID_PRIORITIES.includes(raw as Priority)
    ? (raw as Priority)
    : "med";
}

export function readCategory(formData: FormData): Category {
  const raw = String(formData.get("category") ?? "");
  return VALID_CATEGORIES.includes(raw as Category)
    ? (raw as Category)
    : "default";
}

export function readLocation(formData: FormData): string {
  return String(formData.get("location") ?? "").trim();
}

export function readDateRange(formData: FormData): {
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

export function descriptionFor(
  priority: Priority,
  category: Category,
): string {
  return [
    `우선순위: ${priority}`,
    category !== "default" ? `카테고리: ${category}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function isMissingLocationColumn(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false;
  if (error.code === "42703") return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("location") && m.includes("column");
}
