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
