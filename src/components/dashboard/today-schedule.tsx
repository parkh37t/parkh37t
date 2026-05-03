import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { listTodaysEvents } from "@/lib/google-calendar";
import { categoryColors } from "@/lib/theme";

export async function TodaySchedule() {
  const events = await listTodaysEvents().catch(() => []);
  const now = new Date();

  return (
    <div className="card flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold">오늘의 일정</h2>
          <p className="text-sm text-ink-muted">
            {format(now, "M월 d일 (EEEE)", { locale: ko })}
          </p>
        </div>
        <span className="chip bg-accent-sky/10 text-accent-sky">
          {events.length}개
        </span>
      </header>

      {events.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-muted">
          오늘 예정된 일정이 없습니다.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {events.map((ev) => {
            const color = categoryColors[ev.category ?? "default"];
            return (
              <li
                key={ev.id}
                className="flex items-start gap-3 rounded-lg p-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <span
                  className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{ev.title}</p>
                  {ev.location ? (
                    <p className="truncate text-xs text-ink-muted">{ev.location}</p>
                  ) : null}
                </div>
                <time className="shrink-0 font-mono text-xs text-ink-muted">
                  {format(new Date(ev.startsAt), "HH:mm")}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
