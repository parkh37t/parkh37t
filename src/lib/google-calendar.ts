import { google } from "googleapis";
import { addDays, endOfDay, startOfDay, startOfWeek } from "date-fns";
import { cookies } from "next/headers";
import type { Event } from "@/types";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "";

const TARGET_CALENDAR_NAME =
  process.env.GOOGLE_CALENDAR_NAME?.trim() || "컨버전스";

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

function matchesTargetCalendar(summary: string | null | undefined) {
  if (!summary) return false;
  const target = TARGET_CALENDAR_NAME.toLowerCase();
  const name = summary.toLowerCase();
  return name.includes(target) || name.includes("convergence");
}

async function resolveCalendarIds(
  auth: NonNullable<Awaited<ReturnType<typeof getAuthorizedClient>>>,
): Promise<string[]> {
  const calendar = google.calendar({ version: "v3", auth });
  const list = await calendar.calendarList.list();
  const matched = (list.data.items ?? []).filter((c) =>
    matchesTargetCalendar(c.summary ?? c.summaryOverride),
  );
  return matched
    .map((c) => c.id)
    .filter((id): id is string => Boolean(id));
}

async function fetchEvents(timeMin: Date, timeMax: Date): Promise<Event[]> {
  const auth = await getAuthorizedClient();
  if (!auth) return [];
  const calendar = google.calendar({ version: "v3", auth });
  const calendarIds = await resolveCalendarIds(auth);
  if (calendarIds.length === 0) return [];

  const all: Event[] = [];
  for (const calendarId of calendarIds) {
    const res = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });
    for (const it of res.data.items ?? []) {
      all.push({
        id: String(it.id),
        title: it.summary ?? "(제목 없음)",
        startsAt: it.start?.dateTime ?? it.start?.date ?? new Date().toISOString(),
        endsAt: it.end?.dateTime ?? it.end?.date ?? new Date().toISOString(),
        location: it.location ?? null,
        category: "default",
        source: "google",
      });
    }
  }
  return all.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}

export async function listTodaysEvents(): Promise<Event[]> {
  const now = new Date();
  return fetchEvents(startOfDay(now), endOfDay(now));
}

export async function listWeekEvents(): Promise<Event[]> {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  return fetchEvents(start, addDays(start, 7));
}
