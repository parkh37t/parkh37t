import { CheckSquare } from "lucide-react";
import { listTasks } from "@/lib/tasks";
import { TaskPager } from "@/components/dashboard/task-pager";
import { CreateTaskCta } from "@/components/dashboard/create-task-cta";

export async function TaskList({ expanded = false }: { expanded?: boolean }) {
  const tasks = await listTasks().catch(() => []);
  const ongoing = tasks.filter((t) => !t.done);
  const listed = expanded ? tasks : ongoing;
  const pageSize = expanded ? 10 : 5;

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

      <CreateTaskCta />

      <TaskPager
        tasks={listed}
        pageSize={pageSize}
        emptyMessage={
          expanded ? "할 일이 없습니다. 오늘은 쉬어가요." : "진행중인 할 일이 없습니다."
        }
      />
    </section>
  );
}
