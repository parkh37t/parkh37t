import { CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { formatTimeKst, formatTodayLabelKst } from "@/lib/format-time";
import { listTodaysEvents } from "@/lib/google-calendar";
import { listTodaysTaskEvents } from "@/lib/tasks";
import { categoryColors } from "@/lib/theme";
import type { Event } from "@/types";

export async function TodaySchedule() {
  const [calendarEvents, taskEvents] = await Promise.all([
    listTodaysEvents().catch(() => [] as Event[]),
    listTodaysTaskEvents().catch(() => [] as Event[]),
  ]);
  const events = [...calendarEvents, ...taskEvents].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  const now = new Date();

  return (
    <section className="card flex flex-col">
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-cyan-400 to-teal-400">
            <CalendarClock className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] lg:text-[20px] font-bold leading-tight text-ink truncate">
              오늘의 일정
            </div>
            <div className="text-[12.5px] text-zinc-400 mt-0.5 truncate">
              {formatTodayLabelKst(now)}
            </div>
          </div>
        </div>
        <div className="px-2.5 h-7 rounded-full flex items-center text-[12px] font-semibold whitespace-nowrap bg-cyan-50 text-cyan-700">
          {events.length}개
        </div>
      </header>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-zinc-400 mb-3">
            <CalendarClock className="h-[22px] w-[22px]" />
          </div>
          <div className="text-[14px] text-ink-muted font-medium">
            오늘 예정된 일정이 없습니다.
          </div>
          <div className="text-[12px] text-zinc-400 mt-1">
            우측 카드에서 빠르게 추가해보세요.
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {events.map((ev) => {
            const color = categoryColors[ev.category ?? "default"];
            const isTask = ev.source === "local";
            const startLabel = formatTimeKst(ev.startsAt);
            const endLabel =
              ev.endsAt && ev.endsAt !== ev.startsAt
                ? formatTimeKst(ev.endsAt)
                : null;
            return (
              <li
                key={ev.id}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#FAFAFC] border border-zinc-100"
              >
                <div
                  className="w-1 h-9 rounded-full"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[14.5px] font-semibold text-ink truncate flex items-center gap-1.5">
                    {isTask ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-lavender" />
                    ) : null}
                    <span className="truncate">{ev.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[12px] text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {endLabel ? `${startLabel} ~ ${endLabel}` : startLabel}
                    </span>
                    {ev.location ? (
                      <>
                        <span className="text-zinc-200">·</span>
                        <span className="truncate">{ev.location}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
