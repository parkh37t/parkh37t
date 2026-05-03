import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarRange } from "lucide-react";
import { listWeekEvents } from "@/lib/google-calendar";
import { listWeekTaskEvents } from "@/lib/tasks";
import { categoryColors } from "@/lib/theme";
import type { Event } from "@/types";

export async function WeekView({ expanded = false }: { expanded?: boolean }) {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const [calendarEvents, taskEvents] = await Promise.all([
    listWeekEvents().catch(() => [] as Event[]),
    listWeekTaskEvents().catch(() => [] as Event[]),
  ]);
  const events = [...calendarEvents, ...taskEvents];

  return (
    <div className="card-interactive flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent-violet/10 p-1.5 text-accent-violet">
            <CalendarRange className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-semibold">이번 주</h2>
        </div>
        <span className="text-sm text-ink-muted">
          {format(start, "M.d", { locale: ko })} —{" "}
          {format(addDays(start, 6), "M.d", { locale: ko })}
        </span>
      </header>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.startsAt), day),
          );
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={`flex flex-col gap-1.5 rounded-xl border p-2 transition hover:-translate-y-px hover:shadow-sm ${
                isToday
                  ? "border-accent-violet/50 bg-gradient-to-b from-accent-violet/10 to-accent-violet/5"
                  : "border-zinc-100 dark:border-zinc-800"
              } ${expanded ? "min-h-[180px]" : "min-h-[100px]"}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-medium text-ink-muted">
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
                    className="truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white shadow-sm"
                    style={{
                      backgroundColor: categoryColors[ev.category ?? "default"],
                    }}
                    title={ev.title}
                  >
                    {ev.source === "local" ? "✓ " : ""}
                    {ev.title}
                  </li>
                ))}
                {dayEvents.length > (expanded ? 8 : 3) ? (
                  <li className="text-[10px] text-ink-muted">
                    +{dayEvents.length - (expanded ? 8 : 3)} more
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
