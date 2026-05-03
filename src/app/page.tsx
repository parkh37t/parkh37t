import { CheckCircle2, Link as LinkIcon, XCircle } from "lucide-react";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { TaskList } from "@/components/dashboard/task-list";
import { WeekView } from "@/components/dashboard/week-view";
import { QuickNote } from "@/components/dashboard/quick-note";
import { formatFullDateLabelKst } from "@/lib/format-time";
import { googleConnected } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const connected = await googleConnected();

  return (
    <>
      <div className="mb-7 lg:mb-9 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[13px] text-ink-muted font-medium mb-1.5">
            {formatFullDateLabelKst(now)}
          </div>
          <h1 className="text-[32px] lg:text-[44px] font-extrabold tracking-tight leading-[1.05]">
            안녕하세요, <span className="grad-text">오늘</span>도 가볍게.
          </h1>
        </div>
        {connected ? (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Google 연결됨
          </span>
        ) : (
          <a
            href="/api/google/auth"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-rose-50 px-3 text-[12px] font-semibold text-rose-700 hover:bg-rose-100 transition"
            title="이 브라우저에서 Google Calendar 미연결. 클릭하여 연결"
          >
            <XCircle className="h-3.5 w-3.5" />
            Google 미연결
            <LinkIcon className="h-3 w-3 ml-0.5" />
          </a>
        )}
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
