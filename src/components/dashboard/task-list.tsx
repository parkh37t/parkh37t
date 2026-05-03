import { listTasks } from "@/lib/tasks";
import { priorityBadge, priorityColors, categoryLabels } from "@/lib/theme";
import { createTask, deleteTask, toggleTask } from "@/lib/actions";
import { CheckSquare, Clock, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/types";

const CATEGORIES: Category[] = ["default", "work", "health", "study", "personal"];

export async function TaskList({ expanded = false }: { expanded?: boolean }) {
  const tasks = await listTasks().catch(() => []);
  const ongoing = tasks.filter((t) => !t.done);
  const visible = expanded ? tasks : ongoing.slice(0, 30);

  return (
    <section className="card flex flex-col">
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-emerald-400 to-teal-500">
            <CheckSquare className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] lg:text-[20px] font-bold leading-tight text-ink truncate">
              할 일
            </div>
            <div className="text-[12.5px] text-zinc-400 mt-0.5">오늘의 진행</div>
          </div>
        </div>
        <div className="px-2.5 h-7 rounded-full flex items-center text-[12px] font-semibold whitespace-nowrap bg-emerald-50 text-emerald-700">
          {ongoing.length}개 진행중
        </div>
      </header>

      {/* Add form */}
      <form
        action={createTask}
        className="bg-[#FAFAFC] border border-zinc-100 rounded-2xl p-3.5 flex flex-col gap-2.5 mb-4"
      >
        <input
          name="title"
          required
          placeholder="새 할 일 추가..."
          className="w-full h-11 px-3.5 rounded-xl bg-white border border-zinc-200 text-[14px] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-300/40 focus:border-violet-300"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            name="priority"
            defaultValue="med"
            className="h-11 px-3.5 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
          >
            <option value="low">low · 낮음</option>
            <option value="med">med · 보통</option>
            <option value="high">high · 높음</option>
          </select>
          <select
            name="category"
            defaultValue="default"
            className="h-11 px-3.5 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="datetime-local"
            name="dueAt"
            className="flex-1 h-11 px-3.5 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-full text-white font-semibold text-[13.5px] flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[.98] transition"
            style={{
              background: "#7C6BF6",
              boxShadow: "0 4px 14px -4px rgba(124,107,246,0.55)",
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            추가
          </button>
        </div>
      </form>

      {visible.length === 0 ? (
        <div className="text-center py-6 text-[13px] text-zinc-400">
          진행중인 할 일이 없습니다.
        </div>
      ) : (
        <ul className="flex flex-col gap-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
          {visible.map((task) => {
            const due = task.dueAt ? new Date(task.dueAt) : null;
            const priority = task.priority ?? "med";
            const category = task.category ?? "default";
            const badge = priorityBadge[priority];
            return (
              <li
                key={task.id}
                className="group relative flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-2xl hover:bg-[#FAFAFC] border border-transparent hover:border-zinc-100 transition"
              >
                <span
                  className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
                  style={{ background: priorityColors[priority] }}
                />
                <form action={toggleTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <input type="hidden" name="done" value={String(task.done)} />
                  <button
                    type="submit"
                    aria-label={task.done ? "완료 취소" : "완료"}
                    className={
                      "ml-1.5 h-5 w-5 rounded-md border-[1.5px] inline-flex items-center justify-center transition " +
                      (task.done
                        ? "border-accent-lavenderDeep"
                        : "border-zinc-300 hover:border-accent-lavender bg-white")
                    }
                    style={
                      task.done
                        ? {
                            background:
                              "linear-gradient(135deg,#7C6BF6,#5046A8)",
                          }
                        : undefined
                    }
                  >
                    {task.done ? (
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3 w-3 text-white"
                        fill="currentColor"
                      >
                        <path d="M13.485 4.515a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L6.778 9.808l5.293-5.293a1 1 0 0 1 1.414 0z" />
                      </svg>
                    ) : null}
                  </button>
                </form>
                <div className="flex-1 min-w-0">
                  <div
                    className={
                      "text-[14px] font-semibold leading-snug " +
                      (task.done ? "line-through opacity-50" : "text-ink")
                    }
                  >
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-zinc-400">
                    {due && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-[11px] w-[11px]" />
                        {`${due.getMonth() + 1}.${due.getDate()} ${String(
                          due.getHours()
                        ).padStart(2, "0")}:${String(due.getMinutes()).padStart(
                          2,
                          "0"
                        )}`}
                      </span>
                    )}
                    {due && <span className="text-zinc-200">·</span>}
                    <span>{categoryLabels[category]}</span>
                  </div>
                </div>
                <span
                  className="px-2 h-[22px] rounded-full text-[10.5px] font-semibold flex items-center"
                  style={{ background: badge.bg, color: badge.fg }}
                >
                  {priority}
                </span>
                <form action={deleteTask}>
                  <input type="hidden" name="id" value={task.id} />
                  <button
                    type="submit"
                    aria-label="삭제"
                    className="opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-full hover:bg-pink-50 text-zinc-400 hover:text-pink-600 flex items-center justify-center"
                  >
                    <Trash2 className="h-[14px] w-[14px]" />
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
