import { ListChecks } from "lucide-react";
import { TaskList } from "@/components/dashboard/task-list";

export default function TasksPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent-emerald/10 p-2 text-accent-emerald">
            <ListChecks className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">할 일</h1>
            <p className="text-xs text-ink-muted">
              마감일을 정하면 캘린더에 자동 표시됩니다
            </p>
          </div>
        </div>
      </header>
      <TaskList expanded />
    </div>
  );
}
