import { NextResponse } from "next/server";
import { buildDiagnosticReport } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await buildDiagnosticReport();
  return NextResponse.json(report, {
    headers: { "Cache-Control": "no-store" },
  });
}
