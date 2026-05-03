"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { priorityBadge } from "@/lib/theme";
import type { Task } from "@/types";

type Props = {
  tasks?: Task[];
};

export function MonthlyGrid({ tasks = [] }: Props) {
  const today = new Date();
  const [cursor, setCursor] = useState<Date>(startOfMonth(today));

  const monthLabel = format(cursor, "yyyy년 M월", { locale: ko });

  const cells = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const out: { date: Date; outside: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push({ date: d, outside: !isSameMonth(d, cursor) });
    }
    return out;
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (!t.dueAt) return;
      const d = new Date(t.dueAt);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    });
    return m;
  }, [tasks]);

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
        <div>
          <div className="text-[13px] text-ink-muted font-medium mb-1.5">
            Monthly
          </div>
          <h1 className="text-[32px] lg:text-[40px] font-extrabold tracking-tight">
            {monthLabel}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="w-10 h-10 rounded-full bg-white border border-zinc-200 hover:border-ink flex items-center justify-center"
            aria-label="이전 달"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => setCursor(startOfMonth(today))}
            className="h-10 px-4 rounded-full bg-white border border-zinc-200 hover:border-ink text-[13px] font-semibold"
          >
            오늘
          </button>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="w-10 h-10 rounded-full bg-white border border-zinc-200 hover:border-ink flex items-center justify-center"
            aria-label="다음 달"
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <section className="card p-4 lg:p-6">
        <div className="grid grid-cols-7 mb-2">
          {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
            <div
              key={d}
              className={
                "text-[11.5px] font-semibold text-center pb-2 " +
                (i >= 5 ? "text-rose-400" : "text-zinc-400")
              }
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {cells.map((c, i) => {
            const isToday = isSameDay(c.date, today);
            const dow = (c.date.getDay() + 6) % 7;
            const items = tasksByDay.get(dayKey(c.date)) || [];
            return (
              <div
                key={i}
                className={
                  "rounded-2xl p-2 sm:p-2.5 min-h-[68px] sm:min-h-[100px] border flex flex-col gap-1 transition " +
                  (c.outside
                    ? "bg-[#FAFAFC]/40 border-transparent"
                    : isToday
                    ? "bg-violet-50 border-violet-200"
                    : "bg-white border-zinc-100 hover:border-zinc-200")
                }
              >
                <div className="flex items-center justify-between">
                  <span
                    className={
                      "text-[12px] sm:text-[13px] font-bold " +
                      (c.outside
                        ? "text-zinc-300"
                        : isToday
                        ? "text-violet-700"
                        : dow >= 5
                        ? "text-rose-400"
                        : "text-ink")
                    }
                  >
                    {format(c.date, "d")}
                  </span>
                  {isToday && !c.outside && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  )}
                </div>
                {!c.outside && items.length > 0 && (
                  <div className="flex flex-col gap-1 mt-0.5">
                    {items.slice(0, 2).map((t) => {
                      const badge = priorityBadge[t.priority ?? "med"];
                      return (
                        <div
                          key={t.id}
                          className="text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-md truncate"
                          style={{ background: badge.bg, color: badge.fg }}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                    {items.length > 2 && (
                      <div className="text-[10px] text-zinc-400 font-bold px-1">
                        +{items.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
