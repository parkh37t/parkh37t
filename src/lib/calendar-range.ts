import {
  addMonths,
  addQuarters,
  addYears,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  getQuarter,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import { ko } from "date-fns/locale";

export type CalendarView = "month" | "quarter" | "half" | "year";

export const VIEW_LABELS: Record<CalendarView, string> = {
  month: "월",
  quarter: "분기",
  half: "반년",
  year: "1년",
};

export function parseView(raw: string | undefined): CalendarView {
  if (raw === "quarter" || raw === "half" || raw === "year") return raw;
  return "month";
}

export function parseOffset(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

export type CalendarRange = {
  start: Date;
  end: Date;
  label: string;
  reference: Date;
};

export function rangeFor(view: CalendarView, offset: number): CalendarRange {
  const now = new Date();
  switch (view) {
    case "month": {
      const ref = addMonths(now, offset);
      return {
        reference: ref,
        start: startOfMonth(ref),
        end: endOfMonth(ref),
        label: format(ref, "yyyy년 M월", { locale: ko }),
      };
    }
    case "quarter": {
      const ref = addQuarters(now, offset);
      return {
        reference: ref,
        start: startOfQuarter(ref),
        end: endOfQuarter(ref),
        label: `${format(ref, "yyyy년", { locale: ko })} ${getQuarter(ref)}분기`,
      };
    }
    case "half": {
      const month = now.getMonth();
      const isH1 = month < 6;
      const currentHalfIndex = now.getFullYear() * 2 + (isH1 ? 0 : 1);
      const targetIndex = currentHalfIndex + offset;
      const year = Math.floor(targetIndex / 2);
      const half = ((targetIndex % 2) + 2) % 2;
      const startMonth = half === 0 ? 0 : 6;
      const start = new Date(year, startMonth, 1);
      const end = endOfMonth(new Date(year, startMonth + 5, 1));
      const ref = new Date(year, startMonth, 1);
      return {
        reference: ref,
        start,
        end,
        label: `${year}년 ${half === 0 ? "상반기" : "하반기"}`,
      };
    }
    case "year": {
      const ref = addYears(now, offset);
      return {
        reference: ref,
        start: startOfYear(ref),
        end: endOfYear(ref),
        label: format(ref, "yyyy년", { locale: ko }),
      };
    }
  }
}
