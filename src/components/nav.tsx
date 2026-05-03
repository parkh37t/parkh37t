import Link from "next/link";
import { CalendarDays, LayoutDashboard, ListTodo } from "lucide-react";

const links = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/tasks", label: "할 일", icon: ListTodo },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
] as const;

export function Nav() {
  return (
    <nav className="flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-accent-violet to-accent-rose" />
        <span>Dashboard</span>
      </Link>
      <ul className="flex items-center gap-1 rounded-full border border-zinc-200/80 bg-white/70 p-1 text-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ink-muted transition hover:bg-zinc-100 hover:text-ink dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
