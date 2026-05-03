import { addMonths, startOfMonth } from "date-fns";
import { Link as LinkIcon } from "lucide-react";
import { listEventsBetween } from "@/lib/google-calendar";
import { listTaskEventsBetween } from "@/lib/tasks";
import { mergeWithoutDuplicates } from "@/lib/event-merge";
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
  const events = mergeWithoutDuplicates(calendarEvents, taskEvents);

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[13px] text-ink-muted font-medium mb-1.5">
            Calendar
          </div>
          <h1 className="text-[32px] lg:text-[40px] font-extrabold tracking-tight">
            {range.label}
          </h1>
          <p className="mt-1.5 text-[12.5px] text-zinc-400">
            Wylie 컨버전스 2본부 + 마감일 있는 할 일
          </p>
        </div>
        <a
          href="/api/google/auth"
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[.98]"
          style={{
            background: "#7C6BF6",
            boxShadow: "0 4px 14px -4px rgba(124,107,246,0.55)",
          }}
        >
          <LinkIcon className="h-4 w-4" />
          Google Calendar 연결
        </a>
      </div>

      <div className="mb-5">
        <ViewSwitcher view={view} offset={offset} label={range.label} />
      </div>

      {view === "month" ? (
        <MonthGrid reference={range.reference} events={events} />
      ) : (
        <MultiMonthGrid view={view} reference={range.reference} events={events} />
      )}
    </>
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
