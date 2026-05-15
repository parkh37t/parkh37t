"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { UserPlus } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("이름을 입력해주세요.");
    if (!email.trim()) return setError("이메일을 입력해주세요.");
    if (!/^\d{6}$/.test(pin)) return setError("비밀번호는 숫자 6자리여야 합니다.");
    if (pin !== pin2) return setError("비밀번호 확인이 일치하지 않습니다.");

    startTransition(async () => {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: pin,
        options: {
          data: { name: name.trim(), phone: phone.trim() || null },
        },
      });
      if (authError) {
        if (authError.message.toLowerCase().includes("already")) {
          setError("이미 가입된 이메일입니다.");
        } else {
          setError(authError.message);
        }
        return;
      }
      setDone(true);
      // After signup, sign out so they can't access app until approved.
      await supabase.auth.signOut();
      setTimeout(() => router.replace("/login" as Route), 1800);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-6 text-center">
        <div className="text-[14px] font-semibold text-emerald-800">
          회원가입이 접수되었어요.
        </div>
        <div className="mt-1.5 text-[12.5px] text-emerald-700">
          관리자가 승인하면 로그인할 수 있어요. 잠시 후 로그인 화면으로 이동합니다…
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-zinc-600">이름</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[15px] focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-zinc-600">
          전화번호
        </span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-1234-5678"
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-[15px] focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-zinc-600">
          이메일 (아이디)
        </span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          autoComplete="new-password"
          pattern="\d{6}"
          maxLength={6}
          required
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="● ● ● ● ● ●"
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-center text-[20px] tracking-[0.45em] focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-semibold text-zinc-600">
          비밀번호 확인
        </span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          pattern="\d{6}"
          maxLength={6}
          required
          value={pin2}
          onChange={(e) =>
            setPin2(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
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
        <UserPlus className="h-4 w-4" />
        {pending ? "가입 중…" : "회원가입"}
      </button>
    </form>
  );
}
