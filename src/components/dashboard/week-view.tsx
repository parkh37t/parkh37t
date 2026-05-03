import { addDays, format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { mergeWithoutDuplicates } from "@/lib/event-merge";
import { isSameDayKst, startOfWeekKst } from "@/lib/format-time";
import { listWeekEvents } from "@/lib/google-calendar";
import { listWeekTaskEvents } from "@/lib/tasks";
import type { Event } from "@/types";

export async function WeekView({ expanded = false }: { expanded?: boolean }) {
  const today = new Date();
  const start = startOfWeekKst(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const [calendarEvents, taskEvents] = await Promise.all([
    listWeekEvents().catch(() => [] as Event[]),
    listWeekTaskEvents().catch(() => [] as Event[]),
  ]);
  const events = mergeWithoutDuplicates(calendarEvents, taskEvents);
  const range = `${format(start, "M.d", { locale: ko })} — ${format(
    addDays(start, 6),
    "M.d",
    { locale: ko },
  )}`;
  const KOR = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <section className="card flex flex-col">
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-blue-400 to-indigo-500">
            <CalendarDays className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] lg:text-[20px] font-bold leading-tight text-ink truncate">
              이번 주
            </div>
            <div className="text-[12.5px] text-zinc-400 mt-0.5">주간 스냅샷</div>
          </div>
        </div>
        <div className="px-2.5 h-7 rounded-full flex items-center text-[12px] font-semibold whitespace-nowrap bg-blue-50 text-blue-700">
          {range}
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d) => {
          const dayEvents = events.filter((e) => isSameDayKst(e.startsAt, d));
          const count = dayEvents.length;
          const isToday = isSameDayKst(d, today);
          const dow = (d.getDay() + 6) % 7;
          const label = KOR[d.getDay()];
          return (
            <div
              key={d.toISOString()}
              className={
                "rounded-2xl p-2.5 sm:p-3 flex flex-col items-center min-h-[88px] border transition " +
                (isToday
                  ? "bg-violet-50 border-violet-200 animate-softPulse"
                  : "bg-[#FAFAFC] border-zinc-100")
              }
            >
              <div
                className={
                  "text-[11px] font-semibold " +
                  (isToday
                    ? "text-violet-700"
                    : dow >= 5
                      ? "text-rose-400"
                      : "text-zinc-400")
                }
              >
                {label}
              </div>
              <div
                className={
                  "text-[18px] sm:text-[20px] font-extrabold mt-1 " +
                  (isToday ? "text-violet-700" : "text-ink")
                }
              >
                {format(d, "d")}
              </div>
              <div className="mt-auto pt-2 flex items-center gap-0.5 h-3">
                {count > 0 &&
                  Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                    <span
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: isToday ? "#7C6BF6" : "#C4B5FD" }}
                    />
                  ))}
                {count > 3 && (
                  <span className="text-[9px] text-zinc-400 ml-0.5 font-bold">
                    +{count - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {expanded ? (
        <p className="mt-4 text-[12px] text-zinc-400">
          상세 일정은 캘린더 페이지의 월간 뷰에서 확인할 수 있어요.
        </p>
      ) : null}
    </section>
  );
}
