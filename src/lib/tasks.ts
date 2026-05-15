import {
  endOfDayKst,
  endOfWeekKst,
  startOfDayKst,
  startOfWeekKst,
} from "@/lib/format-time";
import {
  getServerSupabase,
  getServiceSupabase,
  serviceSupabaseConfigured,
  supabaseConfigured,
} from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/auth";
import type { Event, Task } from "@/types";

const FALLBACK: Task[] = [
  {
    id: "demo-1",
    title: "Supabase 프로젝트 생성하기",
    done: false,
    priority: "high",
    category: "work",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Google Calendar OAuth 클라이언트 발급",
    done: false,
    priority: "med",
    category: "work",
    createdAt: new Date().toISOString(),
  },
];

async function currentUserId(): Promise<string | null> {
  if (!supabaseConfigured) return null;
  const profile = await getCurrentProfile();
  return profile?.id ?? null;
}

export async function listTasks(): Promise<Task[]> {
  if (!supabaseConfigured) return FALLBACK;
  const userId = await currentUserId();
  if (!userId) return [];
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToTask);
}

export async function listTasksWithDueBetween(
  from: Date,
  to: Date,
): Promise<Task[]> {
  if (!supabaseConfigured) {
    return FALLBACK.filter((t) => {
      if (!t.dueAt) return false;
      const d = new Date(t.dueAt).getTime();
      return d >= from.getTime() && d <= to.getTime();
    });
  }
  const userId = await currentUserId();
  if (!userId) return [];
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .not("due_at", "is", null)
    .gte("due_at", from.toISOString())
    .lte("due_at", to.toISOString())
    .order("due_at", { ascending: true });
  if (error || !data) return [];
  return data.map(rowToTask);
}

export async function listTodaysTaskEvents(): Promise<Event[]> {
  const now = new Date();
  const tasks = await listTasksWithDueBetween(
    startOfDayKst(now),
    endOfDayKst(now),
  );
  return tasks.map((t) => taskToEvent(t));
}

export async function listWeekTaskEvents(): Promise<Event[]> {
  const now = new Date();
  const tasks = await listTasksWithDueBetween(
    startOfWeekKst(now),
    endOfWeekKst(now),
  );
  return tasks.map((t) => taskToEvent(t));
}

export async function listTaskEventsBetween(
  start: Date,
  end: Date,
): Promise<Event[]> {
  const tasks = await listTasksWithDueBetween(start, end);
  return tasks.map((t) => taskToEvent(t));
}

/**
 * Lists tasks belonging to OTHER users that the current user has opted in to
 * view via calendar_views. Uses the service role to bypass RLS so a single
 * query can fetch everything (we still scope to allowed user_ids).
 */
export async function listSharedTaskEventsBetween(
  start: Date,
  end: Date,
): Promise<Event[]> {
  if (!serviceSupabaseConfigured) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const supabase = getServiceSupabase();
  const { data: views } = await supabase
    .from("calendar_views")
    .select("viewed_user_id")
    .eq("user_id", userId);
  const allowed = (views ?? []).map((r) => String(r.viewed_user_id));
  if (allowed.length === 0) return [];
  const { data: rows, error } = await supabase
    .from("tasks")
    .select("*, profiles!inner(name)")
    .in("user_id", allowed)
    .not("due_at", "is", null)
    .gte("due_at", start.toISOString())
    .lte("due_at", end.toISOString())
    .order("due_at", { ascending: true });
  if (error || !rows) return [];
  return rows.map((row) => {
    const t = rowToTask(row);
    const ownerName =
      ((row as Record<string, unknown>).profiles as
        | { name?: string }
        | undefined)?.name ?? "회원";
    return taskToEvent(t, { ownerName });
  });
}

function taskToEvent(
  task: Task,
  opts: { ownerName?: string } = {},
): Event {
  const startsAt = task.dueAt ?? new Date().toISOString();
  const endsAt = task.endsAt ?? startsAt;
  return {
    id: `task-${task.id}`,
    title: opts.ownerName ? `[${opts.ownerName}] ${task.title}` : task.title,
    startsAt,
    endsAt,
    location: null,
    category: task.category ?? "default",
    priority: task.priority ?? "med",
    source: "local",
    googleEventId: task.googleEventId ?? null,
    taskId: task.id,
    ownerName: opts.ownerName ?? null,
  };
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    done: Boolean(row.done),
    priority: row.priority as Task["priority"],
    category: row.category as Task["category"],
    dueAt: (row.due_at as string | null) ?? null,
    endsAt: (row.ends_at as string | null) ?? null,
    googleEventId: (row.google_event_id as string | null) ?? null,
    createdAt: String(row.created_at),
  };
}
