import { CalendarRange, Link as LinkIcon } from "lucide-react";
import { WeekView } from "@/components/dashboard/week-view";

export default function CalendarPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent-violet/10 p-2 text-accent-violet">
            <CalendarRange className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">캘린더</h1>
            <p className="text-xs text-ink-muted">
              컨버전스 캘린더 + 마감일 있는 할 일
            </p>
          </div>
        </div>
        <a
          href="/api/google/auth"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-violet px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-violet/90 hover:shadow"
        >
          <LinkIcon className="h-4 w-4" />
          Google Calendar 연결
        </a>
      </header>
      <WeekView expanded />
    </div>
  );
}
