import { ListChecks, Plus } from "lucide-react";
import { listTasks } from "@/lib/tasks";
import { createTask } from "@/lib/actions";
import { TaskItem } from "@/components/dashboard/task-item";

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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="task-due-date"
            className="text-[11px] text-ink-muted"
          >
            날짜
          </label>
          <input
            id="task-due-date"
            type="date"
            name="due_date"
            aria-label="날짜"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <label
            htmlFor="task-due-time"
            className="text-[11px] text-ink-muted"
          >
            시작
          </label>
          <input
            id="task-due-time"
            type="time"
            name="due_time"
            aria-label="시작 시각"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span className="text-ink-muted">~</span>
          <label
            htmlFor="task-end-time"
            className="text-[11px] text-ink-muted"
          >
            종료
          </label>
          <input
            id="task-end-time"
            type="time"
            name="end_time"
            aria-label="종료 시각"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="ml-auto inline-flex min-w-[96px] items-center justify-center gap-1 rounded-lg bg-accent-violet px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-violet/90 hover:shadow active:translate-y-px"
          >
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>
        <p className="text-[11px] text-ink-muted">
          날짜만 입력해도 캘린더에 표시됩니다. 시각을 비워두면 시작 0시
          기준으로 등록됩니다. 등록한 후 ✏️ 아이콘으로 수정할 수 있습니다.
        </p>
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
          {visible.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}
