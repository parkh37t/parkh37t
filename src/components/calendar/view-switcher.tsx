import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import {
  type CalendarView,
  VIEW_LABELS,
} from "@/lib/calendar-range";

const VIEWS: CalendarView[] = ["month", "quarter", "half", "year"];

function buildHref(view: CalendarView, offset: number) {
  const query: Record<string, string> = {};
  if (!(view === "month" && offset === 0)) {
    query.view = view;
    if (offset !== 0) query.offset = String(offset);
  }
  return { pathname: "/calendar" as const, query };
}

export function ViewSwitcher({
  view,
  offset,
  label,
}: {
  view: CalendarView;
  offset: number;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="기간 선택"
          className="flex items-center gap-1 rounded-full border border-zinc-200/80 bg-white/70 p-1 text-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          {VIEWS.map((v) => {
            const active = v === view;
            return (
              <Link
                key={v}
                role="tab"
                aria-selected={active}
                href={buildHref(v, 0)}
                className={`rounded-full px-3 py-1.5 transition ${
                  active
                    ? "bg-accent-violet text-white shadow-sm"
                    : "text-ink-muted hover:bg-zinc-100 hover:text-ink dark:hover:bg-zinc-800"
                }`}
              >
                {VIEW_LABELS[v]}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildHref(view, offset - 1)}
          aria-label="이전"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm transition hover:border-accent-violet hover:text-accent-violet dark:border-zinc-700 dark:bg-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </Link>
        <Link
          href={buildHref(view, 0)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm transition hover:border-accent-violet hover:text-accent-violet dark:border-zinc-700 dark:bg-zinc-900"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          오늘
        </Link>
        <Link
          href={buildHref(view, offset + 1)}
          aria-label="다음"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm transition hover:border-accent-violet hover:text-accent-violet dark:border-zinc-700 dark:bg-zinc-900"
        >
          다음
          <ChevronRight className="h-4 w-4" />
        </Link>
        <span className="ml-2 text-base font-semibold">{label}</span>
      </div>
    </div>
  );
}
