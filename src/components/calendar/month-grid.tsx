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

export function MonthGrid({
  reference,
  events,
}: {
  reference: Date;
  events: Event[];
}) {
  const { openCreate, openEdit } = useTaskModal();
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
        <span className="text-[11px] text-zinc-400">
          날짜를 누르면 새 일정 · 일정을 누르면 수정
        </span>
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
          const dayEvents = events.filter((e) => isSameDayKst(e.startsAt, day));
          const isSunday = day.getDay() === 0;
          const ymd = dateToYmd(day);
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => openCreate({ initialDate: ymd })}
              className={`group flex min-h-[96px] flex-col gap-1 bg-white p-1.5 text-left transition hover:bg-violet-50/40 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-300/40 dark:bg-zinc-900 ${
                isCurrentMonth ? "" : "opacity-40"
              }`}
              aria-label={`${ymd} 새 일정 추가`}
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
                {dayEvents.slice(0, 3).map((ev) => {
                  const isLocal = ev.source === "local" && ev.taskId;
                  return (
                    <li key={ev.id}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocal) return;
                          openEdit({
                            id: ev.taskId as string,
                            title: ev.title,
                            priority: ev.priority,
                            category: ev.category,
                            dueAt: ev.startsAt,
                            endsAt: ev.endsAt,
                            location: ev.location,
                          });
                        }}
                        disabled={!isLocal}
                        className={
                          "block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white shadow-sm transition " +
                          (isLocal
                            ? "hover:brightness-95 cursor-pointer"
                            : "cursor-default opacity-90")
                        }
                        style={{
                          backgroundColor:
                            categoryColors[ev.category ?? "default"],
                        }}
                        title={
                          isLocal
                            ? `${ev.title} (수정하려면 클릭)`
                            : `${ev.title} (Google Calendar)`
                        }
                      >
                        {ev.source === "local" ? "✓ " : ""}
                        {ev.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
