"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  LayoutGrid,
  ListTodo,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

type NavUser = {
  name: string;
  email: string;
  role: "admin" | "member";
};

const baseLinks = [
  { href: "/", label: "대시보드", icon: LayoutGrid },
  { href: "/tasks", label: "할 일", icon: ListTodo },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
] as const;

const HIDE_NAV_PREFIXES = ["/login", "/signup", "/pending"];

export function Nav({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  if (HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const links = user?.role === "admin"
    ? [...baseLinks, { href: "/admin/members", label: "회원 관리", icon: ShieldCheck } as const]
    : baseLinks;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initial = user ? user.name.slice(0, 1) : "";

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/55 border-b border-white/60">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <span
              className="w-8 h-8 rounded-xl shadow-sm shrink-0"
              style={{
                background:
                  "linear-gradient(135deg,#f472b6 0%,#a855f7 50%,#22d3ee 100%)",
              }}
            />
            <span className="flex items-baseline gap-2 min-w-0">
              <span className="text-[18px] font-bold tracking-tight text-ink truncate">
                Dashboard
              </span>
              <span className="hidden sm:inline text-[12px] text-zinc-400 font-medium">
                parkh37t
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-zinc-100">
            {links.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href as Route}
                  className={
                    "px-4 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap inline-flex items-center transition " +
                    (active
                      ? "bg-ink text-white"
                      : "text-ink-muted hover:text-ink")
                  }
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white border border-zinc-100 px-2.5 h-9 shadow-sm">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[11.5px] font-bold text-violet-700">
                    {initial}
                  </span>
                  <span className="text-[13px] font-semibold text-ink">
                    {user.name}
                  </span>
                  {user.role === "admin" ? (
                    <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 text-[10px] font-bold text-violet-700">
                      ADMIN
                    </span>
                  ) : null}
                </span>
                <LogoutButton className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white border border-zinc-100 px-3 text-[12.5px] font-semibold text-zinc-600 hover:text-rose-500">
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </LogoutButton>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href={"/login" as Route}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white border border-zinc-100 px-3.5 text-[12.5px] font-semibold text-ink shadow-sm hover:border-zinc-200"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  로그인
                </Link>
                <Link
                  href={"/signup" as Route}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-white shadow-sm"
                  style={{
                    background: "#7C6BF6",
                    boxShadow: "0 4px 14px -4px rgba(124,107,246,0.55)",
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  회원가입
                </Link>
              </div>
            )}
            <button
              onClick={() => setDrawer(true)}
              className="md:hidden w-10 h-10 rounded-full hover:bg-white/80 flex items-center justify-center text-ink"
              aria-label="menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-[78%] max-w-[320px] bg-white p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg,#f472b6 0%,#a855f7 50%,#22d3ee 100%)",
                  }}
                />
                <span className="font-bold text-[16px]">Dashboard</span>
              </div>
              <button
                onClick={() => setDrawer(false)}
                className="w-9 h-9 rounded-full hover:bg-surface flex items-center justify-center"
                aria-label="close"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            {user ? (
              <div className="mb-5 flex items-center gap-3 rounded-2xl bg-violet-50 p-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[14px] font-bold text-violet-700">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink truncate">
                    {user.name}
                    {user.role === "admin" ? (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-violet-200 px-1.5 text-[10px] font-bold text-violet-800">
                        ADMIN
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[12px] text-zinc-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-5 flex flex-col gap-2">
                <Link
                  href={"/login" as Route}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-[14px] font-semibold text-ink"
                >
                  <LogIn className="h-4 w-4" />
                  로그인
                </Link>
                <Link
                  href={"/signup" as Route}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white"
                  style={{
                    background: "#7C6BF6",
                    boxShadow: "0 4px 14px -4px rgba(124,107,246,0.55)",
                  }}
                >
                  <UserPlus className="h-4 w-4" />
                  회원가입
                </Link>
              </div>
            )}
            <nav className="flex flex-col gap-1.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={
                      "flex items-center gap-3 h-12 px-4 rounded-2xl text-[15px] font-semibold transition " +
                      (active
                        ? "bg-ink text-white"
                        : "text-ink hover:bg-surface")
                    }
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              {user ? (
                <LogoutButton className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-[14px] font-semibold text-ink">
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </LogoutButton>
              ) : null}
              <div className="text-[12px] text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-[14px] w-[14px]" />
                데이터는 자동 저장됩니다
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
