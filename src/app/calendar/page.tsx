import { WeekView } from "@/components/dashboard/week-view";

export default function CalendarPage() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">캘린더</h1>
        <a
          href="/api/google/auth"
          className="chip bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20"
        >
          Google Calendar 연결
        </a>
      </header>
      <WeekView expanded />
    </div>
  );
}
