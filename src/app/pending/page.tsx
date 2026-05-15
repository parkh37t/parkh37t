import { Clock, LogOut } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function PendingPage() {
  const profile = await getCurrentProfile();
  const status = profile?.status ?? "pending";
  const isRejected = status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 py-10 text-center">
        <span
          className={
            "mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm " +
            (isRejected ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600")
          }
        >
          <Clock className="h-6 w-6" />
        </span>
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink">
          {isRejected ? "가입이 거절되었습니다" : "관리자 승인 대기 중"}
        </h1>
        <p className="mt-2 text-[13.5px] text-zinc-500">
          {isRejected
            ? "관리자에게 문의하시거나 다른 계정으로 가입해주세요."
            : "관리자가 회원가입을 검토하고 있어요. 승인이 완료되면 바로 사용하실 수 있어요."}
        </p>
        {profile ? (
          <div className="mt-6 w-full rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-left">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              가입 정보
            </div>
            <div className="mt-1 text-[14px] font-semibold text-ink">
              {profile.name}
            </div>
            <div className="text-[12.5px] text-zinc-500">{profile.email}</div>
          </div>
        ) : null}
        <div className="mt-6 w-full">
          <LogoutButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-[14px] font-semibold text-ink transition hover:border-zinc-300">
            <LogOut className="h-4 w-4" />
            로그아웃
          </LogoutButton>
        </div>
      </div>
    </div>
  );
}
