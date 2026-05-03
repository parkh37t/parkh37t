import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { TaskList } from "@/components/dashboard/task-list";
import { WeekView } from "@/components/dashboard/week-view";
import { QuickNote } from "@/components/dashboard/quick-note";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
      <section className="lg:col-span-2">
        <TodaySchedule />
      </section>
      <section>
        <TaskList />
      </section>
      <section className="lg:col-span-2">
        <WeekView />
      </section>
      <section>
        <QuickNote />
      </section>
    </div>
  );
}
