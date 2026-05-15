"use client";

import { useState, useTransition } from "react";
import { Check, Users } from "lucide-react";
import { setCalendarViews } from "@/lib/actions";

export type MemberOption = {
  id: string;
  name: string;
};

export function MemberSelector({
  members,
  selected,
}: {
  members: MemberOption[];
  selected: string[];
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(selected);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function save() {
    startTransition(async () => {
      const result = await setCalendarViews(picked);
      if (result.ok) setOpen(false);
    });
  }

  const count = selected.length;

  if (members.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[12.5px] font-semibold text-ink transition hover:border-zinc-300"
      >
        <Users className="h-3.5 w-3.5" />
        다른 회원 일정
        {count > 0 ? (
          <span className="inline-flex items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
            {count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-30 w-[260px] rounded-2xl border border-zinc-100 bg-white p-2 shadow-xl">
          <div className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            함께 볼 회원 선택
          </div>
          <ul className="max-h-[260px] overflow-y-auto">
            {members.map((m) => {
              const on = picked.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    className={
                      "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[13px] transition " +
                      (on ? "bg-violet-50 text-violet-800" : "hover:bg-zinc-50")
                    }
                  >
                    <span
                      className={
                        "inline-flex h-5 w-5 items-center justify-center rounded border " +
                        (on
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-zinc-300")
                      }
                    >
                      {on ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="font-semibold">{m.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex items-center justify-end gap-2 border-t border-zinc-100 pt-2">
            <button
              type="button"
              onClick={() => {
                setPicked(selected);
                setOpen(false);
              }}
              className="inline-flex h-8 items-center rounded-full border border-zinc-200 px-3 text-[12px] font-semibold text-zinc-600"
            >
              취소
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="inline-flex h-8 items-center rounded-full px-3.5 text-[12px] font-semibold text-white"
              style={{ background: "#7C6BF6" }}
            >
              {pending ? "저장 중…" : "적용"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
