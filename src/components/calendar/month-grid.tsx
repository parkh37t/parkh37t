import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { categoryColors } from "@/lib/theme";
import type { Event } from "@/types";

const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function MonthGrid({
  reference,
  events,
}: {
  reference: Date;
  events: Event[];
}) {
  const today = new Date();
  const monthStart = startOfMonth(reference);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(reference), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  return (
    <div className="card-interactive flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {format(reference, "yyyy년 M월", { locale: ko })}
        </h2>
      </div>
      <div className="grid grid-cols-7 gap-px rounded-xl border border-zinc-100 bg-zinc-100 text-[11px] dark:border-zinc-800 dark:bg-zinc-800">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={d}
            className={`bg-white px-2 py-1.5 font-medium dark:bg-zinc-900 ${
              i === 6 ? "text-accent-rose" : "text-ink-muted"
            }`}
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, reference);
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.startsAt), day),
          );
          const isSunday = day.getDay() === 0;
          return (
            <div
              key={day.toISOString()}
              className={`flex min-h-[96px] flex-col gap-1 bg-white p-1.5 dark:bg-zinc-900 ${
                isCurrentMonth ? "" : "opacity-40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-semibold ${
                    isToday
                      ? "bg-accent-violet text-white"
                      : isSunday
                        ? "text-accent-rose"
                        : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 3 ? (
                  <span className="text-[10px] text-ink-muted">
                    +{dayEvents.length - 3}
                  </span>
                ) : null}
              </div>
              <ul className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <li
                    key={ev.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white shadow-sm"
                    style={{
                      backgroundColor: categoryColors[ev.category ?? "default"],
                    }}
                    title={ev.title}
                  >
                    {ev.source === "local" ? "✓ " : ""}
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
