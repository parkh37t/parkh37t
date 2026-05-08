import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { googleConfigured, googleConnected } from "@/lib/google-calendar";

export async function GoogleReconnectBanner() {
  if (!googleConfigured()) return null;
  const connected = await googleConnected();
  if (connected) return null;

  return (
    <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-10 pt-4">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center gap-3 text-[13px] shadow-sm">
        <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
        <div className="flex-1 text-rose-900 font-medium leading-snug">
          Google Calendar 연결이 끊어졌습니다. 새 일정이 동기화되지 않습니다.
        </div>
        <Link
          href="/api/google/auth"
          className="inline-flex items-center rounded-full bg-rose-500 hover:bg-rose-600 px-3.5 h-8 text-white text-[12px] font-semibold transition shrink-0"
        >
          재연결
        </Link>
      </div>
    </div>
  );
}
