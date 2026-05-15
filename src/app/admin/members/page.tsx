import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { isAdmin } from "@/lib/auth";
import { getServiceSupabase, serviceSupabaseConfigured } from "@/lib/supabase";
import { MembersTable, type MemberRow } from "./members-table";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const admin = await isAdmin();
  if (!admin) redirect("/");

  let members: MemberRow[] = [];
  if (serviceSupabaseConfigured) {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("id, email, name, phone, role, status, created_at")
      .order("created_at", { ascending: false });
    if (data) {
      members = data.map((row) => ({
        id: String(row.id),
        email: String(row.email ?? ""),
        name: String(row.name ?? ""),
        phone: (row.phone as string | null) ?? null,
        role: (row.role as MemberRow["role"]) ?? "member",
        status: (row.status as MemberRow["status"]) ?? "pending",
        createdAt: String(row.created_at ?? ""),
      }));
    }
  }

  const pending = members.filter((m) => m.status === "pending").length;
  const approved = members.filter((m) => m.status === "approved").length;

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[13px] text-ink-muted font-medium mb-1.5">
            Admin
          </div>
          <h1 className="text-[28px] lg:text-[36px] font-extrabold tracking-tight">
            회원 관리
          </h1>
          <p className="mt-1.5 text-[12.5px] text-zinc-400">
            가입 신청 승인, 회원 정보 수정·삭제·추가
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 h-8 text-[12px] font-semibold text-amber-700">
            <Users className="h-3.5 w-3.5" /> 대기 {pending}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 h-8 text-[12px] font-semibold text-emerald-700">
            승인 {approved}
          </span>
        </div>
      </div>

      <MembersTable members={members} />
    </>
  );
}
