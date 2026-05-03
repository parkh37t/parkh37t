import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE, makeOAuthClient } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing auth code" }, { status: 400 });
  }
  const oauth = makeOAuthClient();
  const { tokens } = await oauth.getToken(code);
  const res = NextResponse.redirect(new URL("/calendar", req.url));
  res.cookies.set(TOKEN_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
