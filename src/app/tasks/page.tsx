import { TaskList } from "@/components/dashboard/task-list";

export default function TasksPage() {
  return (
    <>
      <div className="mb-7">
        <div className="text-[13px] text-ink-muted font-medium mb-1.5">
          All Tasks
        </div>
        <h1 className="text-[32px] lg:text-[40px] font-extrabold tracking-tight">
          할 일
        </h1>
      </div>
      <TaskList expanded />
    </>
  );
}
