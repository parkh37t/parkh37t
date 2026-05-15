import {
  endOfDayKst,
  endOfWeekKst,
  startOfDayKst,
  startOfWeekKst,
} from "@/lib/format-time";
import {
  getServiceSupabase,
  serviceSupabaseConfigured,
} from "@/lib/supabase";
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
  if (!serviceSupabaseConfigured) return FALLBACK;
  const supabase = getServiceSupabase();
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
  if (!serviceSupabaseConfigured) {
    return FALLBACK.filter((t) => {
      if (!t.dueAt) return false;
      const d = new Date(t.dueAt).getTime();
      return d >= from.getTime() && d <= to.getTime();
    });
  }
  const supabase = getServiceSupabase();
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
  const tasks = await listTasksWithDueBetween(
    startOfDayKst(now),
    endOfDayKst(now),
  );
  return tasks.map(taskToEvent);
}

export async function listWeekTaskEvents(): Promise<Event[]> {
  const now = new Date();
  const tasks = await listTasksWithDueBetween(
    startOfWeekKst(now),
    endOfWeekKst(now),
  );
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
  const endsAt = task.endsAt ?? startsAt;
  return {
    id: `task-${task.id}`,
    title: task.title,
    startsAt,
    endsAt,
    location: null,
    category: task.category ?? "default",
    priority: task.priority ?? "med",
    source: "local",
    googleEventId: task.googleEventId ?? null,
    taskId: task.id,
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
