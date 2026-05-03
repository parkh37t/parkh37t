"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteTask, toggleTask, updateTask } from "@/lib/actions";
import { categoryColors, priorityColors } from "@/lib/theme";
import type { Task } from "@/types";

const APP_TIMEZONE = "Asia/Seoul";

function isoToParts(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

function formatRange(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string | null {
  if (!startIso) return null;
  const start = isoToParts(startIso);
  const end = endIso ? isoToParts(endIso) : null;
  const dateLabel = start.date.replace(/-/g, ".");
  if (!end || end.time === start.time) return `${dateLabel} ${start.time}`;
  if (end.date === start.date) {
    return `${dateLabel} ${start.time} ~ ${end.time}`;
  }
  return `${dateLabel} ${start.time} ~ ${end.date.replace(/-/g, ".")} ${end.time}`;
}

export function TaskItem({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const start = isoToParts(task.dueAt);
  const end = isoToParts(task.endsAt);
  const catColor = categoryColors[task.category ?? "default"];
  const range = formatRange(task.dueAt, task.endsAt);

  if (editing) {
    return (
      <li
        className="flex flex-col gap-2 rounded-xl border border-accent-violet/40 bg-accent-violet/5 p-3"
        style={{ borderLeft: `3px solid ${catColor}` }}
      >
        <form
          action={(fd) => {
            startTransition(async () => {
              await updateTask(fd);
              setEditing(false);
            });
          }}
          className="flex flex-col gap-2"
        >
          <input type="hidden" name="id" value={task.id} />
          <input
            name="title"
            defaultValue={task.title}
            required
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="priority"
              defaultValue={task.priority ?? "med"}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="low">low</option>
              <option value="med">med</option>
              <option value="high">high</option>
            </select>
            <select
              name="category"
              defaultValue={task.category ?? "default"}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="default">분류</option>
              <option value="work">work</option>
              <option value="personal">personal</option>
              <option value="health">health</option>
              <option value="study">study</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[11px] text-ink-muted">날짜</label>
            <input
              type="date"
              name="due_date"
              defaultValue={start.date}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <label className="text-[11px] text-ink-muted">시작</label>
            <input
              type="time"
              name="due_time"
              defaultValue={start.time}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <span className="text-ink-muted">~</span>
            <label className="text-[11px] text-ink-muted">종료</label>
            <input
              type="time"
              name="end_time"
              defaultValue={end.time}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-ink-muted transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-w-[72px] items-center justify-center gap-1 rounded-lg bg-accent-violet px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-violet/90 disabled:opacity-50"
            >
              {pending ? "저장중…" : "저장"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:-translate-y-px hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
      style={{ borderLeft: `3px solid ${catColor}` }}
    >
      <form action={toggleTask}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="done" value={String(task.done)} />
        <button
          type="submit"
          aria-label={task.done ? "완료 취소" : "완료"}
          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
            task.done
              ? "border-accent-violet bg-accent-violet text-white"
              : "border-zinc-300 hover:border-accent-violet dark:border-zinc-600"
          }`}
        >
          {task.done ? (
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="currentColor"
            >
              <path d="M13.485 4.515a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L6.778 9.808l5.293-5.293a1 1 0 0 1 1.414 0z" />
            </svg>
          ) : null}
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            task.done ? "text-ink-muted line-through" : ""
          }`}
        >
          {task.title}
        </p>
        {range ? (
          <p className="truncate font-mono text-[11px] text-ink-muted">
            {range}
          </p>
        ) : null}
      </div>
      {task.priority ? (
        <span
          className="chip"
          style={{
            backgroundColor: `${priorityColors[task.priority]}20`,
            color: priorityColors[task.priority],
          }}
        >
          {task.priority}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="수정"
        className="opacity-0 transition group-hover:opacity-100 text-ink-muted hover:text-accent-violet"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <form action={deleteTask}>
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label="삭제"
          className="opacity-0 transition group-hover:opacity-100 text-ink-muted hover:text-accent-rose"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </form>
    </li>
  );
}
