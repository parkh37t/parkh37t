"use client";

import {
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Flag,
  MapPin,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { createTask, deleteTask, updateTask } from "@/lib/actions";
import {
  categoryColors,
  categoryLabels,
  priorityColors,
} from "@/lib/theme";
import type { Category, Priority, Task } from "@/types";

const APP_TIMEZONE = "Asia/Seoul";

const CATEGORY_OPTIONS: Category[] = [
  "default",
  "work",
  "health",
  "study",
  "personal",
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "낮음" },
  { value: "med", label: "보통" },
  { value: "high", label: "높음" },
];

function isoToParts(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function formatKoreanDate(yyyymmdd: string): string {
  if (!yyyymmdd) return "날짜 선택";
  const [y, m, d] = yyyymmdd.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return yyyymmdd;
  return `${y}년 ${m}월 ${d}일`;
}

function formatKoreanTime(hhmm: string): string {
  if (!hhmm) return "시간";
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return hhmm;
  const ampm = h < 12 ? "오전" : "오후";
  const hour12 = h === 0 ? 12 : h <= 12 ? h : h - 12;
  return `${ampm} ${hour12}:${mStr ?? "00"}`;
}

function todayLocalDate(): string {
  return isoToParts(new Date().toISOString()).date;
}

function isoToday(): string {
  return new Date().toISOString();
}

export type TaskModalEditInput = {
  id: string;
  title: string;
  priority?: Priority;
  category?: Category;
  dueAt?: string | null;
  endsAt?: string | null;
};

export type TaskModalMode =
  | {
      kind: "create";
      initialDate?: string;
      initialStartTime?: string;
      initialEndTime?: string;
    }
  | { kind: "edit"; task: TaskModalEditInput };

export function TaskModal({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  mode: TaskModalMode;
}) {
  const isEdit = mode.kind === "edit";

  const initial = useMemo(() => {
    if (isEdit) {
      const t = (mode as { kind: "edit"; task: TaskModalEditInput }).task;
      const start = isoToParts(t.dueAt);
      const end = isoToParts(t.endsAt ?? t.dueAt);
      return {
        title: t.title,
        startDate: start.date || todayLocalDate(),
        startTime: start.time || "09:00",
        endDate: end.date || start.date || todayLocalDate(),
        endTime: end.time || start.time || "10:00",
        priority: t.priority ?? "med",
        category: t.category ?? "default",
        allDay: Boolean(t.dueAt) && !start.time,
      } as const;
    }
    const m = mode as {
      kind: "create";
      initialDate?: string;
      initialStartTime?: string;
      initialEndTime?: string;
    };
    const date = m.initialDate || todayLocalDate();
    const start = m.initialStartTime || isoToParts(isoToday()).time;
    const end =
      m.initialEndTime ||
      (() => {
        const [hStr, mmStr] = start.split(":");
        const h = parseInt(hStr, 10);
        const min = parseInt(mmStr, 10);
        if (Number.isNaN(h) || Number.isNaN(min)) return start;
        const total = h * 60 + min + 30;
        const nh = Math.floor(total / 60) % 24;
        const nm = total % 60;
        return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
      })();
    return {
      title: "",
      startDate: date,
      startTime: start,
      endDate: date,
      endTime: end,
      priority: "med" as Priority,
      category: "default" as Category,
      allDay: false,
    } as const;
  }, [isEdit, mode]);

  const [title, setTitle] = useState(initial.title);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [category, setCategory] = useState<Category>(initial.category);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial.title);
    setStartDate(initial.startDate);
    setStartTime(initial.startTime);
    setEndDate(initial.endDate);
    setEndTime(initial.endTime);
    setPriority(initial.priority);
    setCategory(initial.category);
    setAllDay(initial.allDay);
    setError(null);
    requestAnimationFrame(() => titleRef.current?.focus());
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  function save(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("제목을 입력해주세요.");
      titleRef.current?.focus();
      return;
    }
    setError(null);

    const fd = new FormData();
    if (isEdit) fd.append("id", (mode as { task: TaskModalEditInput }).task.id);
    fd.append("title", trimmed);
    fd.append("priority", priority);
    fd.append("category", category);
    if (startDate) {
      fd.append("due_date", startDate);
      fd.append("end_date", endDate || startDate);
      if (allDay) {
        fd.append("all_day", "true");
      } else {
        if (startTime) fd.append("due_time", startTime);
        if (endTime) fd.append("end_time", endTime);
      }
    }

    startTransition(async () => {
      try {
        if (isEdit) await updateTask(fd);
        else await createTask(fd);
        onClose();
      } catch (err) {
        console.error("[TaskModal] save failed", err);
        setError("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    });
  }

  function handleDelete() {
    if (!isEdit) return;
    if (typeof window !== "undefined" && !window.confirm("이 할 일을 삭제할까요?")) {
      return;
    }
    const fd = new FormData();
    fd.append("id", (mode as { task: TaskModalEditInput }).task.id);
    startDeleteTransition(async () => {
      try {
        await deleteTask(fd);
        onClose();
      } catch (err) {
        console.error("[TaskModal] delete failed", err);
        setError("삭제에 실패했어요.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/30 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "할 일 수정" : "할 일 추가"}
    >
      <div className="flex w-full max-w-[720px] flex-col bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-100 px-3 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 추가"
              className="w-full border-0 border-b-2 border-transparent bg-transparent px-1 py-2 text-[18px] font-medium text-ink placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none sm:text-[22px]"
            />
          </div>
          <button
            type="button"
            onClick={() => save()}
            disabled={pending || !title.trim()}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-full px-5 text-[13px] font-semibold text-white shadow-sm transition disabled:opacity-50"
            style={{
              background: "#7C6BF6",
              boxShadow: "0 4px 14px -4px rgba(124,107,246,0.55)",
            }}
          >
            {pending ? "저장중…" : "저장"}
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={save}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
        >
          {/* Date/time row */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <PillInput
                type="date"
                value={startDate}
                onChange={(v) => {
                  setStartDate(v);
                  if (!endDate || endDate < v) setEndDate(v);
                }}
                display={formatKoreanDate(startDate)}
              />
              {!allDay ? (
                <PillInput
                  type="time"
                  value={startTime}
                  onChange={setStartTime}
                  display={formatKoreanTime(startTime)}
                  className="min-w-[120px]"
                />
              ) : null}
              <span className="px-1 text-sm text-zinc-400">-</span>
              {!allDay ? (
                <PillInput
                  type="time"
                  value={endTime}
                  onChange={setEndTime}
                  display={formatKoreanTime(endTime)}
                  className="min-w-[120px]"
                />
              ) : null}
              <PillInput
                type="date"
                value={endDate}
                onChange={setEndDate}
                display={formatKoreanDate(endDate)}
                min={startDate || undefined}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-1">
              <label className="inline-flex cursor-pointer items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-300/40 accent-violet-600"
                />
                <span className="text-[13px] font-medium text-ink">종일</span>
              </label>
              <span className="text-[12px] text-zinc-400">
                {allDay
                  ? "하루 종일 일정으로 저장됩니다"
                  : "시작 후로 끝나는 시간이면 자동으로 다음날로 인식돼요"}
              </span>
            </div>
          </section>

          <div className="border-t border-zinc-100" />

          {/* Category */}
          <Row
            icon={<Tag className="h-5 w-5 text-zinc-400" />}
            label="카테고리"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORY_OPTIONS.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-3 h-9 text-[13px] font-medium transition " +
                      (active
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-zinc-200 bg-white text-ink hover:border-zinc-300")
                    }
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: categoryColors[c] }}
                    />
                    {categoryLabels[c]}
                  </button>
                );
              })}
            </div>
          </Row>

          {/* Priority */}
          <Row
            icon={<Flag className="h-5 w-5 text-zinc-400" />}
            label="우선순위"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {PRIORITY_OPTIONS.map((p) => {
                const active = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={
                      "inline-flex items-center gap-1.5 rounded-full border px-3 h-9 text-[13px] font-medium transition " +
                      (active
                        ? "border-violet-300 bg-violet-50 text-violet-700"
                        : "border-zinc-200 bg-white text-ink hover:border-zinc-300")
                    }
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: priorityColors[p.value] }}
                    />
                    {p.label}
                    <span className="ml-1 hidden text-[11px] text-zinc-400 sm:inline">
                      {p.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </Row>

          {/* Hint rows (placeholders to mirror GCal layout — disabled in this app) */}
          <Row
            icon={<MapPin className="h-5 w-5 text-zinc-300" />}
            label="위치"
          >
            <span className="text-[12.5px] text-zinc-400">
              위치 입력은 추후 지원 예정입니다.
            </span>
          </Row>
          <Row
            icon={<Bell className="h-5 w-5 text-zinc-300" />}
            label="알림"
          >
            <span className="text-[12.5px] text-zinc-400">
              알림은 Google Calendar 설정을 따릅니다.
            </span>
          </Row>

          {error ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
              {error}
            </div>
          ) : null}
        </form>

        {/* Footer */}
        {isEdit ? (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || pending}
              className="inline-flex items-center gap-1.5 rounded-full px-4 h-10 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "삭제중…" : "삭제"}
            </button>
            <span className="text-[11.5px] text-zinc-400">
              {isEdit ? "수정 내용은 즉시 저장됩니다." : null}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="mt-1 shrink-0" aria-hidden>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

function PillInput({
  type,
  value,
  onChange,
  display,
  className,
  min,
}: {
  type: "date" | "time";
  value: string;
  onChange: (v: string) => void;
  display: string;
  className?: string;
  min?: string;
}) {
  const isDate = type === "date";
  return (
    <label
      className={
        "relative inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-100 px-3 text-[13.5px] font-medium text-ink transition hover:bg-zinc-200/70 " +
        (className ?? "")
      }
    >
      {isDate ? (
        <CalendarIcon className="h-4 w-4 text-zinc-500" aria-hidden />
      ) : (
        <Clock className="h-4 w-4 text-zinc-500" aria-hidden />
      )}
      <span className="tabular-nums">{display}</span>
      <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
      <input
        type={type}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={isDate ? "날짜 선택" : "시간 선택"}
      />
    </label>
  );
}
