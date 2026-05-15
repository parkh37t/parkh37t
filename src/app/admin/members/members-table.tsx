"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import {
  approveMember,
  createMember,
  deleteMember,
  rejectMember,
  setMemberRole,
  updateMember,
} from "./actions";

export type MemberRow = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "admin" | "member";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export function MembersTable({ members }: { members: MemberRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [creating, setCreating] = useState(false);

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  function startEdit(m: MemberRow) {
    setEditingId(m.id);
    setEditName(m.name);
    setEditPhone(m.phone ?? "");
  }

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold text-ink">회원 목록</h2>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-white shadow-sm"
          style={{ background: "#7C6BF6" }}
        >
          <Plus className="h-3.5 w-3.5" />
          회원 추가
        </button>
      </div>
      {error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
          {error}
        </div>
      ) : null}
      {creating ? (
        <CreateForm
          onCancel={() => setCreating(false)}
          onCreate={(input) =>
            run(async () => {
              const r = await createMember(input);
              if (r.ok) setCreating(false);
              return r;
            })
          }
          pending={pending}
        />
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] font-semibold uppercase tracking-wide text-zinc-400">
              <th className="px-2 py-2">이름</th>
              <th className="px-2 py-2">이메일</th>
              <th className="px-2 py-2 hidden sm:table-cell">전화</th>
              <th className="px-2 py-2">상태</th>
              <th className="px-2 py-2">권한</th>
              <th className="px-2 py-2 text-right">동작</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-10 text-center text-zinc-400">
                  아직 가입한 회원이 없어요.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const editing = editingId === m.id;
                return (
                  <tr key={m.id} className="border-t border-zinc-100">
                    <td className="px-2 py-2.5 align-middle">
                      {editing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-[13px]"
                        />
                      ) : (
                        <span className="font-semibold text-ink">{m.name}</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 align-middle text-zinc-600">
                      {m.email}
                    </td>
                    <td className="px-2 py-2.5 align-middle text-zinc-500 hidden sm:table-cell">
                      {editing ? (
                        <input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="h-9 w-full rounded-lg border border-zinc-200 px-2 text-[13px]"
                          placeholder="010-..."
                        />
                      ) : (
                        m.phone || "—"
                      )}
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <select
                        disabled={pending}
                        value={m.role}
                        onChange={(e) =>
                          run(() =>
                            setMemberRole(
                              m.id,
                              e.target.value as "admin" | "member",
                            ),
                          )
                        }
                        className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-[12.5px] font-medium"
                      >
                        <option value="member">회원</option>
                        <option value="admin">관리자</option>
                      </select>
                    </td>
                    <td className="px-2 py-2.5 align-middle text-right">
                      <div className="inline-flex items-center gap-1">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() =>
                                run(async () => {
                                  const r = await updateMember(m.id, {
                                    name: editName,
                                    phone: editPhone.trim() || null,
                                  });
                                  if (r.ok) setEditingId(null);
                                  return r;
                                })
                              }
                              className="inline-flex h-8 items-center gap-1 rounded-full bg-violet-600 px-3 text-[12px] font-semibold text-white"
                            >
                              <Check className="h-3.5 w-3.5" />
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200 px-3 text-[12px] font-semibold text-zinc-600"
                            >
                              <X className="h-3.5 w-3.5" />
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            {m.status === "pending" ? (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => run(() => approveMember(m.id))}
                                className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                승인
                              </button>
                            ) : null}
                            {m.status !== "rejected" ? (
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => run(() => rejectMember(m.id))}
                                className="inline-flex h-8 items-center gap-1 rounded-full bg-amber-50 px-3 text-[12px] font-semibold text-amber-700 hover:bg-amber-100"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                                거절
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => startEdit(m)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-ink"
                              aria-label="수정"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                if (
                                  typeof window !== "undefined" &&
                                  window.confirm(
                                    `${m.name} 회원을 정말 삭제할까요? (관련 일정도 모두 삭제됩니다)`,
                                  )
                                ) {
                                  run(() => deleteMember(m.id));
                                }
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                              aria-label="삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MemberRow["status"] }) {
  const map = {
    pending: { bg: "bg-amber-100", fg: "text-amber-800", label: "승인 대기" },
    approved: {
      bg: "bg-emerald-100",
      fg: "text-emerald-800",
      label: "승인됨",
    },
    rejected: { bg: "bg-rose-100", fg: "text-rose-800", label: "거절됨" },
  } as const;
  const s = map[status];
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold " +
        s.bg +
        " " +
        s.fg
      }
    >
      {s.label}
    </span>
  );
}

function CreateForm({
  onCreate,
  onCancel,
  pending,
}: {
  onCreate: (input: {
    email: string;
    name: string;
    phone: string | null;
    password: string;
    role: "admin" | "member";
  }) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({
          email,
          name,
          phone: phone.trim() || null,
          password,
          role,
        });
      }}
      className="rounded-2xl border border-violet-100 bg-violet-50/40 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름"
        required
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px]"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px]"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="전화번호 (선택)"
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px]"
      />
      <input
        type="password"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        value={password}
        onChange={(e) =>
          setPassword(e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        placeholder="비밀번호 (숫자 6자리)"
        required
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px]"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "admin" | "member")}
        className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[13px]"
      >
        <option value="member">회원</option>
        <option value="admin">관리자</option>
      </select>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-3 text-[12.5px] font-semibold text-ink"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg px-4 text-[12.5px] font-semibold text-white"
          style={{ background: "#7C6BF6" }}
        >
          {pending ? "추가 중…" : "추가"}
        </button>
      </div>
    </form>
  );
}
