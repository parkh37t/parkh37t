import { ListChecks, Plus, Trash2 } from "lucide-react";
import { listTasks } from "@/lib/tasks";
import { categoryColors, priorityColors } from "@/lib/theme";
import { createTask, deleteTask, toggleTask } from "@/lib/actions";

export async function TaskList({ expanded = false }: { expanded?: boolean }) {
  const tasks = await listTasks().catch(() => []);
  const visible = expanded ? tasks : tasks.slice(0, 6);

  return (
    <div className="card-interactive flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent-emerald/10 p-1.5 text-accent-emerald">
            <ListChecks className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-semibold">할 일</h2>
        </div>
        <span className="chip bg-accent-emerald/10 text-accent-emerald">
          {tasks.filter((t) => !t.done).length}개 진행중
        </span>
      </header>

      <form
        action={createTask}
        className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-800/40"
      >
        <input
          name="title"
          required
          placeholder="새 할 일 추가…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="priority"
            defaultValue="med"
            aria-label="우선순위"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="low">low</option>
            <option value="med">med</option>
            <option value="high">high</option>
          </select>
          <select
            name="category"
            defaultValue="default"
            aria-label="카테고리"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="default">분류</option>
            <option value="work">work</option>
            <option value="personal">personal</option>
            <option value="health">health</option>
            <option value="study">study</option>
          </select>
          <input
            type="datetime-local"
            name="due_at"
            aria-label="마감일"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="inline-flex min-w-[96px] items-center justify-center gap-1 rounded-lg bg-accent-violet px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-violet/90 hover:shadow active:translate-y-px"
          >
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>
      </form>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="rounded-full bg-zinc-100 p-3 text-ink-muted dark:bg-zinc-800">
            <ListChecks className="h-5 w-5" />
          </span>
          <p className="text-sm text-ink-muted">
            할 일이 없습니다. 오늘은 쉬어가요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visible.map((task) => {
            const catColor = categoryColors[task.category ?? "default"];
            return (
              <li
                key={task.id}
                className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:-translate-y-px hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
                style={{ borderLeft: `3px solid ${catColor}` }}
              >
                <form action={toggleTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="done" value={String(task.done)} />
                  <button
                    type="submit"
                    aria-label={task.done ? "완료 취소" : "완료"}
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                      task.done
                        ? "border-accent-violet bg-accent-violet text-white"
                        : "border-zinc-300 hover:border-accent-violet dark:border-zinc-600"
                    }`}
                  >
                    {task.done ? (
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="currentColor"
                      >
                        <path d="M13.485 4.515a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L6.778 9.808l5.293-5.293a1 1 0 0 1 1.414 0z" />
                      </svg>
                    ) : null}
                  </button>
                </form>
                <span
                  className={`flex-1 text-sm ${
                    task.done ? "text-ink-muted line-through" : ""
                  }`}
                >
                  {task.title}
                </span>
                {task.dueAt ? (
                  <time className="hidden font-mono text-[11px] text-ink-muted sm:inline">
                    {new Date(task.dueAt).toLocaleString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                ) : null}
                {task.priority ? (
                  <span
                    className="chip"
                    style={{
                      backgroundColor: `${priorityColors[task.priority]}20`,
                      color: priorityColors[task.priority],
                    }}
                  >
                    {task.priority}
                  </span>
                ) : null}
                <form action={deleteTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <button
                    type="submit"
                    aria-label="삭제"
                    className="opacity-0 transition group-hover:opacity-100 text-ink-muted hover:text-accent-rose"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
