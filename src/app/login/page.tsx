import Link from "next/link";
import type { Route } from "next";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  return <LoginPageInner searchParams={searchParams} />;
}

async function LoginPageInner({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
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
            로그인
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            이메일과 6자리 비밀번호로 로그인하세요.
          </p>
        </header>
        <LoginForm next={sp.next} initialError={sp.error} />
        <p className="mt-6 text-center text-[13px] text-zinc-500">
          아직 계정이 없으신가요?{" "}
          <Link
            href={"/signup" as Route}
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
