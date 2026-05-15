"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, LayoutGrid, ListTodo, Menu, Sparkles, X } from "lucide-react";

const links = [
  { href: "/", label: "대시보드", icon: LayoutGrid },
  { href: "/tasks", label: "할 일", icon: ListTodo },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
] as const;

export function Nav() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  // Close drawer when navigating
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/55 border-b border-white/60">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-xl shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg,#f472b6 0%,#a855f7 50%,#22d3ee 100%)",
              }}
            />
            <span className="flex items-baseline gap-2">
              <span className="text-[18px] font-bold tracking-tight text-ink">
                Dashboard
              </span>
              <span className="hidden sm:inline text-[12px] text-zinc-400 font-medium">
                parkh37t
              </span>
            </span>
          </Link>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-zinc-100">
            {links.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
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

          {/* Mobile menu button */}
          <button
            onClick={() => setDrawer(true)}
            className="md:hidden w-10 h-10 rounded-full hover:bg-white/80 flex items-center justify-center text-ink"
            aria-label="menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setDrawer(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-[78%] max-w-[320px] bg-white p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-8">
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
            <div className="mt-auto text-[12px] text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="h-[14px] w-[14px]" />
              데이터는 자동 저장됩니다
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
