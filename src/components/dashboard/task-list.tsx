import { CheckSquare, Plus } from "lucide-react";
import { listTasks } from "@/lib/tasks";
import { categoryLabels } from "@/lib/theme";
import { createTask } from "@/lib/actions";
import { TaskItem } from "@/components/dashboard/task-item";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="date"
            name="due_date"
            aria-label="날짜"
            className="h-11 px-3.5 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
          />
          <div className="flex items-center gap-2">
            <input
              type="time"
              name="due_time"
              aria-label="시작 시각"
              className="flex-1 h-11 px-3 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
            />
            <span className="text-zinc-400 text-sm">~</span>
            <input
              type="time"
              name="end_time"
              aria-label="종료 시각"
              className="flex-1 h-11 px-3 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-zinc-400 flex-1">
            날짜만 입력해도 캘린더에 표시됩니다. 등록 후 ✏️로 수정 가능.
          </p>
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
        <ul className="flex flex-col gap-2 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
          {visible.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}
