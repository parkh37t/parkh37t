const APP_TIMEZONE = process.env.APP_TIMEZONE?.trim() || "Asia/Seoul";

function formatWith(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: APP_TIMEZONE,
    ...options,
  }).format(date);
}

export function formatTimeKst(value: string | Date): string {
  return formatWith(value, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDayNumberKst(value: string | Date): number {
  const formatted = formatWith(value, { day: "numeric" });
  return Number.parseInt(formatted.replace(/\D/g, ""), 10);
}

export function formatYearMonthKst(value: string | Date): string {
  return formatWith(value, { year: "numeric", month: "long" });
}

export function formatMonthDayKst(value: string | Date): string {
  return formatWith(value, { month: "numeric", day: "numeric" });
}

export function isSameDayKst(a: string | Date, b: string | Date): boolean {
  const fmt: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return formatWith(a, fmt) === formatWith(b, fmt);
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function shiftToKst(d: Date): Date {
  return new Date(d.getTime() + KST_OFFSET_MS);
}

export function startOfDayKst(d: Date = new Date()): Date {
  const shifted = shiftToKst(d);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - KST_OFFSET_MS);
}

export function endOfDayKst(d: Date = new Date()): Date {
  const start = startOfDayKst(d);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function startOfWeekKst(
  d: Date = new Date(),
  weekStartsOn: 0 | 1 = 1,
): Date {
  const dayStart = startOfDayKst(d);
  const kstAsUtc = shiftToKst(dayStart);
  const dow = kstAsUtc.getUTCDay();
  const diff = (dow - weekStartsOn + 7) % 7;
  return new Date(dayStart.getTime() - diff * 24 * 60 * 60 * 1000);
}

export function endOfWeekKst(
  d: Date = new Date(),
  weekStartsOn: 0 | 1 = 1,
): Date {
  return new Date(
    startOfWeekKst(d, weekStartsOn).getTime() + 7 * 24 * 60 * 60 * 1000 - 1,
  );
}

export function formatTodayLabelKst(d: Date = new Date()): string {
  const month = formatWith(d, { month: "numeric" }).replace(/\D/g, "");
  const day = formatWith(d, { day: "numeric" }).replace(/\D/g, "");
  const weekday = formatWith(d, { weekday: "long" });
  return `${month}월 ${day}일 (${weekday})`;
}

export function formatFullDateLabelKst(d: Date = new Date()): string {
  const year = formatWith(d, { year: "numeric" }).replace(/\D/g, "");
  const month = formatWith(d, { month: "numeric" }).replace(/\D/g, "");
  const day = formatWith(d, { day: "numeric" }).replace(/\D/g, "");
  const weekday = formatWith(d, { weekday: "long" });
  return `${year}년 ${month}월 ${day}일 · ${weekday}`;
}
