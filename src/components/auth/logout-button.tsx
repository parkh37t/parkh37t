"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useTransition, type ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function LogoutButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function logout() {
    startTransition(async () => {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
      await supabase.auth.signOut();
      router.replace("/login" as Route);
      router.refresh();
    });
  }
  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className={(className ?? "") + " disabled:opacity-50"}
    >
      {children}
    </button>
  );
}
