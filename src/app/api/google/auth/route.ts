import { NextResponse } from "next/server";
import { getAuthUrl, googleConfigured } from "@/lib/google-calendar";

export async function GET() {
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth env vars not configured" },
      { status: 500 },
    );
  }
  return NextResponse.redirect(getAuthUrl());
}
