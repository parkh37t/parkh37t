"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { TaskItem } from "@/components/dashboard/task-item";
import type { Task } from "@/types";

type Props = {
  tasks: Task[];
  pageSize?: number;
  emptyMessage?: string;
};

export function TaskPager({
  tasks,
  pageSize = 5,
  emptyMessage = "할 일이 없습니다.",
}: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tasks.slice(start, start + pageSize);
  }, [tasks, page, pageSize]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="rounded-full bg-zinc-100 p-3 text-zinc-400">
          <ListChecks className="h-5 w-5" />
        </span>
        <p className="text-[13px] text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ul
        key={page}
        className="flex flex-col gap-2 animate-fadeInUp"
        aria-live="polite"
      >
        {visible.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>

      {totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          totalItems={tasks.length}
          pageSize={pageSize}
        />
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
  totalItems,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const pages = generatePageNumbers(page, totalPages);

  return (
    <nav
      aria-label="페이지 네비게이션"
      className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3"
    >
      <span className="text-[11.5px] font-medium text-zinc-400 tabular-nums">
        {start}–{end} <span className="text-zinc-300">/</span> {totalItems}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="이전 페이지"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-[12px] text-zinc-300"
              aria-hidden
            >
              ···
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                "inline-flex h-8 min-w-[32px] items-center justify-center rounded-full px-2 text-[12px] font-semibold tabular-nums transition " +
                (p === page
                  ? "bg-accent-lavender text-white shadow-sm"
                  : "text-ink-muted hover:bg-zinc-100 hover:text-ink")
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="다음 페이지"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

function generatePageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}
