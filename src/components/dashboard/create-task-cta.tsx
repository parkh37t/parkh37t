"use client";

import { Plus } from "lucide-react";
import { useTaskModal } from "@/components/task-modal/provider";

export function CreateTaskCta() {
  const { openCreate } = useTaskModal();
  return (
    <button
      type="button"
      onClick={() => openCreate()}
      className="mb-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 text-[14px] font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-50 active:scale-[.99]"
    >
      <Plus className="h-4 w-4" strokeWidth={2.4} />
      새 할 일 만들기
    </button>
  );
}
