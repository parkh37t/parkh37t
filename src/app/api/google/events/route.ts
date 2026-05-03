import { NextResponse } from "next/server";
import { listTodaysEvents } from "@/lib/google-calendar";

export async function GET() {
  const events = await listTodaysEvents().catch(() => []);
  return NextResponse.json({ events });
}
