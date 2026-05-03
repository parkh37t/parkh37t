import { addMonths, startOfMonth } from "date-fns";
import { CalendarRange, Link as LinkIcon } from "lucide-react";
import { listEventsBetween } from "@/lib/google-calendar";
import { listTaskEventsBetween } from "@/lib/tasks";
import {
  parseOffset,
  parseView,
  rangeFor,
  type CalendarView,
} from "@/lib/calendar-range";
import { MonthGrid } from "@/components/calendar/month-grid";
import { MiniMonth } from "@/components/calendar/mini-month";
import { ViewSwitcher } from "@/components/calendar/view-switcher";
import type { Event } from "@/types";

type SearchParams = Promise<{ view?: string; offset?: string }>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const view: CalendarView = parseView(sp.view);
  const offset = parseOffset(sp.offset);
  const range = rangeFor(view, offset);

  const [calendarEvents, taskEvents] = await Promise.all([
    listEventsBetween(range.start, range.end).catch(() => [] as Event[]),
    listTaskEventsBetween(range.start, range.end).catch(() => [] as Event[]),
  ]);
  const events = [...calendarEvents, ...taskEvents];

  return (
    <div className="grid grid-cols-1 gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent-violet/10 p-2 text-accent-violet">
            <CalendarRange className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">캘린더</h1>
            <p className="text-xs text-ink-muted">
              Wylie 컨버전스 2본부 캘린더 + 마감일 있는 할 일
            </p>
          </div>
        </div>
        <a
          href="/api/google/auth"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-violet px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-violet/90 hover:shadow"
        >
          <LinkIcon className="h-4 w-4" />
          Google Calendar 연결
        </a>
      </header>

      <ViewSwitcher view={view} offset={offset} label={range.label} />

      {view === "month" ? (
        <MonthGrid reference={range.reference} events={events} />
      ) : (
        <MultiMonthGrid view={view} reference={range.reference} events={events} />
      )}
    </div>
  );
}

function MultiMonthGrid({
  view,
  reference,
  events,
}: {
  view: CalendarView;
  reference: Date;
  events: Event[];
}) {
  const months = monthsForView(view, reference);
  const cols =
    view === "quarter"
      ? "grid-cols-1 sm:grid-cols-3"
      : view === "half"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  return (
    <div className={`grid gap-3 ${cols}`}>
      {months.map((m) => (
        <MiniMonth key={m.toISOString()} reference={m} events={events} />
      ))}
    </div>
  );
}

function monthsForView(view: CalendarView, reference: Date): Date[] {
  const count = view === "quarter" ? 3 : view === "half" ? 6 : 12;
  const base = startOfMonth(
    view === "year" ? new Date(reference.getFullYear(), 0, 1) : reference,
  );
  return Array.from({ length: count }, (_, i) => addMonths(base, i));
}
