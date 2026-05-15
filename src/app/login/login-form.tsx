"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { LogIn } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function LoginForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("비밀번호는 숫자 6자리여야 합니다.");
      return;
    }
    startTransition(async () => {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pin,
      });
      if (authError) {
        if (authError.message.toLowerCase().includes("invalid")) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
          setError(authError.message);
        }
        return;
      }
      router.replace(((next || "/") as Route));
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-zinc-600">
          이메일
        </span>
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[15px] focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-zinc-600">
          비밀번호 (숫자 6자리)
        </span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="\d{6}"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          placeholder="● ● ● ● ● ●"
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-center text-[20px] tracking-[0.45em] focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
        />
      </label>
      {error ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white shadow-sm transition disabled:opacity-50"
        style={{
          background: "#7C6BF6",
          boxShadow: "0 6px 16px -4px rgba(124,107,246,0.55)",
        }}
      >
        <LogIn className="h-4 w-4" />
        {pending ? "로그인 중…" : "로그인"}
      </button>
    </form>
  );
}
