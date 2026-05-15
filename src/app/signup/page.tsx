import Link from "next/link";
import type { Route } from "next";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <header className="mb-8 text-center">
          <span
            className="mx-auto mb-4 inline-block h-12 w-12 rounded-2xl shadow-sm"
            style={{
              background:
                "linear-gradient(135deg,#f472b6 0%,#a855f7 50%,#22d3ee 100%)",
            }}
          />
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">
            회원가입
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            가입 후 관리자 승인이 완료되면 사용하실 수 있어요.
          </p>
        </header>
        <SignupForm />
        <p className="mt-6 text-center text-[13px] text-zinc-500">
          이미 가입하셨나요?{" "}
          <Link
            href={"/login" as Route}
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
