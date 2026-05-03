import { listTasks } from "@/lib/tasks";
import { priorityColors } from "@/lib/theme";

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
              <input
                type="checkbox"
                defaultChecked={task.done}
                className="h-4 w-4 rounded border-zinc-300 text-accent-violet focus:ring-accent-violet"
              />
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
