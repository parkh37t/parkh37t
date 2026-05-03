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

export function MiniMonth({
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
    <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-100 bg-white p-2.5 transition hover:-translate-y-px hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">
          {format(reference, "M월", { locale: ko })}
        </span>
        <span className="text-[10px] text-ink-muted">
          {format(reference, "yyyy")}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-px text-center text-[9px]">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={d}
            className={i === 6 ? "text-accent-rose/70" : "text-ink-muted"}
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, reference);
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter((e) =>
            isSameDay(new Date(e.startsAt), day),
          );
          const dot = dayEvents[0];
          const dotColor = dot
            ? categoryColors[dot.category ?? "default"]
            : null;
          const isSunday = day.getDay() === 0;
          return (
            <div
              key={day.toISOString()}
              className="relative flex aspect-square items-center justify-center"
              title={
                dayEvents.length > 0
                  ? dayEvents.map((e) => e.title).join("\n")
                  : undefined
              }
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  isToday
                    ? "bg-accent-violet font-semibold text-white"
                    : inMonth
                      ? isSunday
                        ? "text-accent-rose"
                        : "text-ink"
                      : "text-ink-muted/50"
                }`}
              >
                {format(day, "d")}
              </span>
              {dotColor ? (
                <span
                  className="absolute bottom-0 right-1 h-1 w-1 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
