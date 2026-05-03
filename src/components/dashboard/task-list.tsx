import { listTasks } from "@/lib/tasks";
import { priorityColors } from "@/lib/theme";
import { createTask, deleteTask, toggleTask } from "@/lib/actions";
import { Trash2 } from "lucide-react";

export async function TaskList({ expanded = false }: { expanded?: boolean }) {
  const tasks = await listTasks().catch(() => []);
  const visible = expanded ? tasks : tasks.slice(0, 6);

  return (
    <div className="card flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">할 일</h2>
        <span className="chip bg-accent-emerald/10 text-accent-emerald">
          {tasks.filter((t) => !t.done).length}개 진행중
        </span>
      </header>

      <form action={createTask} className="flex items-center gap-2">
        <input
          name="title"
          required
          placeholder="새 할 일 추가…"
          className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          name="priority"
          defaultValue="med"
          className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="low">low</option>
          <option value="med">med</option>
          <option value="high">high</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-accent-violet px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-violet/90"
        >
          추가
        </button>
      </form>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-muted">
          할 일이 없습니다. 오늘은 쉬어가요.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {visible.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            >
              <form action={toggleTask}>
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="done" value={String(task.done)} />
                <button
                  type="submit"
                  aria-label={task.done ? "완료 취소" : "완료"}
                  className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                    task.done
                      ? "border-accent-violet bg-accent-violet text-white"
                      : "border-zinc-300 hover:border-accent-violet dark:border-zinc-600"
                  }`}
                >
                  {task.done ? (
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
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
          ))}
        </ul>
      )}
    </div>
  );
}
