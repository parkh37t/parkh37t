import { google } from "googleapis";
import { addDays, endOfDay, startOfDay, startOfWeek } from "date-fns";
import { cookies } from "next/headers";
import type { Event } from "@/types";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export const TOKEN_COOKIE = "g_cal_token";

export function googleConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI);
}

export function makeOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl() {
  return makeOAuthClient().generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

async function getAuthorizedClient() {
  if (!googleConfigured()) return null;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const oauth = makeOAuthClient();
  oauth.setCredentials(JSON.parse(token));
  return oauth;
}

async function fetchEvents(timeMin: Date, timeMax: Date): Promise<Event[]> {
  const auth = await getAuthorizedClient();
  if (!auth) return [];
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });
  return (res.data.items ?? []).map((it) => ({
    id: String(it.id),
    title: it.summary ?? "(제목 없음)",
    startsAt: it.start?.dateTime ?? it.start?.date ?? new Date().toISOString(),
    endsAt: it.end?.dateTime ?? it.end?.date ?? new Date().toISOString(),
    location: it.location ?? null,
    category: "default",
    source: "google",
  }));
}

export async function listTodaysEvents(): Promise<Event[]> {
  const now = new Date();
  return fetchEvents(startOfDay(now), endOfDay(now));
}

export async function listWeekEvents(): Promise<Event[]> {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  return fetchEvents(start, addDays(start, 7));
}
