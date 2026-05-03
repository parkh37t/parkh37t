import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { formatTimeKst } from "@/lib/format-time";
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
    <div className="card-interactive flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent-sky/10 p-1.5 text-accent-sky">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">오늘의 일정</h2>
            <p className="text-xs text-ink-muted">
              {format(now, "M월 d일 (EEEE)", { locale: ko })}
            </p>
          </div>
        </div>
        <span className="chip bg-accent-sky/10 text-accent-sky">
          {events.length}개
        </span>
      </header>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="rounded-full bg-zinc-100 p-3 text-ink-muted dark:bg-zinc-800">
            <CalendarClock className="h-5 w-5" />
          </span>
          <p className="text-sm text-ink-muted">
            오늘 예정된 일정이 없습니다.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
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
                className="group flex items-start gap-3 rounded-xl border border-transparent p-2.5 transition hover:-translate-y-px hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
              >
                <span
                  className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-900"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {isTask ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-violet" />
                    ) : null}
                    <span className="truncate">{ev.title}</span>
                  </p>
                  {ev.location ? (
                    <p className="truncate text-xs text-ink-muted">
                      {ev.location}
                    </p>
                  ) : null}
                </div>
                <time className="shrink-0 font-mono text-xs text-ink-muted">
                  {endLabel ? `${startLabel} ~ ${endLabel}` : startLabel}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
