import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { TaskList } from "@/components/dashboard/task-list";
import { WeekView } from "@/components/dashboard/week-view";
import { QuickNote } from "@/components/dashboard/quick-note";
import { formatFullDateLabelKst } from "@/lib/format-time";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const now = new Date();
  return (
    <>
      <div className="mb-7 lg:mb-9">
        <div className="text-[13px] text-ink-muted font-medium mb-1.5">
          {formatFullDateLabelKst(now)}
        </div>
        <h1 className="text-[32px] lg:text-[44px] font-extrabold tracking-tight leading-[1.05]">
          안녕하세요, <span className="grad-text">오늘</span>도 가볍게.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        <TodaySchedule />
        <TaskList />
        <WeekView />
        <QuickNote />
      </div>
    </>
  );
}
