import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { listWeekEvents } from "@/lib/google-calendar";
import { categoryColors } from "@/lib/theme";

export async function WeekView({ expanded = false }: { expanded?: boolean }) {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const events = await listWeekEvents().catch(() => []);

  return (
    <div className="card flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">이번 주</h2>
        <span className="text-sm text-ink-muted">
          {format(start, "M.d", { locale: ko })} —{" "}
          {format(addDays(start, 6), "M.d", { locale: ko })}
        </span>
      </header>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.startsAt), day));
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={`flex flex-col gap-1.5 rounded-lg border p-2 ${
                isToday
                  ? "border-accent-violet/50 bg-accent-violet/5"
                  : "border-zinc-100 dark:border-zinc-800"
              } ${expanded ? "min-h-[180px]" : "min-h-[100px]"}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-ink-muted">
                  {format(day, "EEE", { locale: ko })}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    isToday ? "text-accent-violet" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
              <ul className="flex flex-col gap-1">
                {dayEvents.slice(0, expanded ? 8 : 3).map((ev) => (
                  <li
                    key={ev.id}
                    className="truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                    style={{
                      backgroundColor: categoryColors[ev.category ?? "default"],
                    }}
                  >
                    {ev.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
