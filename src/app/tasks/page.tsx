import { TaskList } from "@/components/dashboard/task-list";

export default function TasksPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">할 일</h1>
        <span className="text-sm text-ink-muted">우선순위와 마감일로 정리</span>
      </header>
      <TaskList expanded />
    </div>
  );
}
