"use client";

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
import { isSameDayKst } from "@/lib/format-time";
import { categoryColors } from "@/lib/theme";
import { useTaskModal } from "@/components/task-modal/provider";
import type { Event } from "@/types";

const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function dateToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function MiniMonth({
  reference,
  events,
}: {
  reference: Date;
  events: Event[];
}) {
  const { openCreate } = useTaskModal();
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
            isSameDayKst(e.startsAt, day),
          );
          const dot = dayEvents[0];
          const dotColor = dot
            ? categoryColors[dot.category ?? "default"]
            : null;
          const isSunday = day.getDay() === 0;
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => openCreate({ initialDate: dateToYmd(day) })}
              className="relative flex aspect-square items-center justify-center rounded transition hover:bg-violet-50/60 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
              title={
                dayEvents.length > 0
                  ? dayEvents.map((e) => e.title).join("\n")
                  : "새 일정 추가"
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
