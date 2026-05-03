import { getServerSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Task } from "@/types";

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
