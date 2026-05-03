import { endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { getServerSupabase, supabaseConfigured } from "@/lib/supabase";
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
  {
    id: "demo-3",
    title: "대시보드 첫 사용해보기",
    done: true,
    priority: "low",
    category: "personal",
    createdAt: new Date().toISOString(),
  },
];

export async function listTasks(): Promise<Task[]> {
  if (!supabaseConfigured) return FALLBACK;
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return FALLBACK;
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
  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .not("due_at", "is", null)
    .gte("due_at", from.toISOString())
    .lte("due_at", to.toISOString())
    .order("due_at", { ascending: true });
  if (error || !data) return [];
  return data.map(rowToTask);
}

export async function listTodaysTaskEvents(): Promise<Event[]> {
  const now = new Date();
  const tasks = await listTasksWithDueBetween(startOfDay(now), endOfDay(now));
  return tasks.map(taskToEvent);
}

export async function listWeekTaskEvents(): Promise<Event[]> {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  const tasks = await listTasksWithDueBetween(start, end);
  return tasks.map(taskToEvent);
}

export async function listTaskEventsBetween(
  start: Date,
  end: Date,
): Promise<Event[]> {
  const tasks = await listTasksWithDueBetween(start, end);
  return tasks.map(taskToEvent);
}

function taskToEvent(task: Task): Event {
  const startsAt = task.dueAt ?? new Date().toISOString();
  return {
    id: `task-${task.id}`,
    title: task.title,
    startsAt,
    endsAt: startsAt,
    location: null,
    category: task.category ?? "default",
    source: "local",
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
    createdAt: String(row.created_at),
  };
}
