"use client";

import { Clock, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import {
  deleteTask,
  syncTaskToGoogle,
  toggleTask,
  updateTask,
} from "@/lib/actions";
import { categoryLabels, priorityBadge, priorityColors } from "@/lib/theme";
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
  const [syncing, startSyncTransition] = useTransition();
  const [syncError, setSyncError] = useState<string | null>(null);
  const start = isoToParts(task.dueAt);
  const end = isoToParts(task.endsAt);
  const priority = task.priority ?? "med";
  const category = task.category ?? "default";
  const badge = priorityBadge[priority];
  const range = formatRange(task.dueAt, task.endsAt);
  const needsGoogleSync = Boolean(task.dueAt) && !task.googleEventId;

  if (editing) {
    return (
      <li className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3.5">
        <form
          action={(fd) => {
            startTransition(async () => {
              await updateTask(fd);
              setEditing(false);
            });
          }}
          className="flex flex-col gap-2.5"
        >
          <input type="hidden" name="id" value={task.id} />
          <input
            name="title"
            defaultValue={task.title}
            required
            className="w-full h-11 px-3.5 rounded-xl bg-white border border-zinc-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-violet-300/40 focus:border-violet-300"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              name="priority"
              defaultValue={priority}
              className="h-11 px-3.5 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
            >
              <option value="low">low · 낮음</option>
              <option value="med">med · 보통</option>
              <option value="high">high · 높음</option>
            </select>
            <select
              name="category"
              defaultValue={category}
              className="h-11 px-3.5 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
            >
              <option value="default">{categoryLabels.default}</option>
              <option value="work">{categoryLabels.work}</option>
              <option value="health">{categoryLabels.health}</option>
              <option value="study">{categoryLabels.study}</option>
              <option value="personal">{categoryLabels.personal}</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
            <input
              type="date"
              name="due_date"
              defaultValue={start.date}
              className="h-11 w-full min-w-0 px-3.5 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
            />
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="time"
                name="due_time"
                defaultValue={start.time}
                className="flex-1 min-w-0 h-11 px-2 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
              />
              <span className="text-zinc-400 text-sm shrink-0">~</span>
              <input
                type="time"
                name="end_time"
                defaultValue={end.time}
                className="flex-1 min-w-0 h-11 px-2 rounded-xl bg-white border border-zinc-200 text-[13.5px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-300/40"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex h-10 items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 text-[13px] font-semibold text-ink-muted transition hover:border-zinc-300"
            >
              <X className="h-4 w-4" />
              취소
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center gap-1 rounded-full px-5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
              style={{
                background: "#7C6BF6",
                boxShadow: "0 4px 14px -4px rgba(124,107,246,0.55)",
              }}
            >
              {pending ? "저장중…" : "저장"}
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group relative flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-2xl hover:bg-[#FAFAFC] border border-transparent hover:border-zinc-100 transition">
      <span
        className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full"
        style={{ background: priorityColors[priority] }}
      />
      <form action={toggleTask}>
        <input type="hidden" name="id" value={task.id} />
        <input type="hidden" name="done" value={String(task.done)} />
        <button
          type="submit"
          aria-label={task.done ? "완료 취소" : "완료"}
          className={
            "ml-1.5 h-5 w-5 rounded-md border-[1.5px] inline-flex items-center justify-center transition " +
            (task.done
              ? "border-accent-lavenderDeep"
              : "border-zinc-300 hover:border-accent-lavender bg-white")
          }
          style={
            task.done
              ? {
                  background: "linear-gradient(135deg,#7C6BF6,#5046A8)",
                }
              : undefined
          }
        >
          {task.done ? (
            <svg
              viewBox="0 0 16 16"
              className="h-3 w-3 text-white"
              fill="currentColor"
            >
              <path d="M13.485 4.515a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L6.778 9.808l5.293-5.293a1 1 0 0 1 1.414 0z" />
            </svg>
          ) : null}
        </button>
      </form>
      <div className="flex-1 min-w-0">
        <div
          className={
            "text-[14px] font-semibold leading-snug " +
            (task.done ? "line-through opacity-50" : "text-ink")
          }
        >
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-zinc-400">
          {range ? (
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock className="h-[11px] w-[11px]" />
              {range}
            </span>
          ) : null}
          {range ? <span className="text-zinc-200">·</span> : null}
          <span>{categoryLabels[category]}</span>
          {needsGoogleSync ? (
            <>
              <span className="text-zinc-200">·</span>
              <button
                type="button"
                disabled={syncing}
                onClick={() => {
                  setSyncError(null);
                  startSyncTransition(async () => {
                    const result = await syncTaskToGoogle(task.id);
                    if (!result.ok) setSyncError(result.error);
                  });
                }}
                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-[2px] text-[10.5px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                title="구글 캘린더에 동기화되지 않았습니다. 클릭하여 재시도"
              >
                <RefreshCw
                  className={
                    "h-[10px] w-[10px] " + (syncing ? "animate-spin" : "")
                  }
                />
                {syncing ? "동기화중…" : "구글 미동기화"}
              </button>
            </>
          ) : null}
        </div>
        {syncError ? (
          <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-rose-50 border border-rose-100 px-2 py-1.5 text-[10.5px] leading-snug text-rose-700">
            <span className="flex-1">{syncError}</span>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="text-rose-500 hover:text-rose-700 shrink-0"
              aria-label="닫기"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
      </div>
      <span
        className="px-2 h-[22px] rounded-full text-[10.5px] font-semibold flex items-center"
        style={{ background: badge.bg, color: badge.fg }}
      >
        {priority}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="수정"
        className="opacity-0 transition group-hover:opacity-100 text-zinc-400 hover:text-accent-lavender"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <form action={deleteTask}>
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label="삭제"
          className="opacity-0 transition group-hover:opacity-100 text-zinc-400 hover:text-rose-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </form>
    </li>
  );
}
