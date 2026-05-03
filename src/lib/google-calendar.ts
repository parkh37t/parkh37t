import { google } from "googleapis";
import { cookies } from "next/headers";
import {
  endOfDayKst,
  endOfWeekKst,
  startOfDayKst,
  startOfWeekKst,
} from "@/lib/format-time";
import type { Event } from "@/types";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? "";

const TARGET_CALENDAR_NAME =
  process.env.GOOGLE_CALENDAR_NAME?.trim() || "Wylie 컨버전스 2본부";

const APP_TIMEZONE = process.env.APP_TIMEZONE?.trim() || "Asia/Seoul";

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

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function matchesTargetCalendar(summary: string | null | undefined) {
  if (!summary) return false;
  return normalize(summary) === normalize(TARGET_CALENDAR_NAME);
}

async function resolveCalendarIds(
  auth: NonNullable<Awaited<ReturnType<typeof getAuthorizedClient>>>,
): Promise<string[]> {
  const calendar = google.calendar({ version: "v3", auth });
  const list = await calendar.calendarList.list();
  const items = list.data.items ?? [];
  const matched = items.filter((c) =>
    matchesTargetCalendar(c.summary ?? c.summaryOverride),
  );
  if (matched.length === 0) {
    const available = items
      .map((c) => c.summary ?? c.summaryOverride)
      .filter(Boolean);
    console.warn(
      `[google-calendar] no calendar matched "${TARGET_CALENDAR_NAME}". Available: ${JSON.stringify(available)}`,
    );
  }
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
  return fetchEvents(startOfDayKst(now), endOfDayKst(now));
}

export async function listWeekEvents(): Promise<Event[]> {
  const now = new Date();
  return fetchEvents(startOfWeekKst(now), endOfWeekKst(now));
}

export async function listEventsBetween(
  start: Date,
  end: Date,
): Promise<Event[]> {
  return fetchEvents(start, end);
}

async function getTargetCalendarId(): Promise<{
  auth: Awaited<ReturnType<typeof getAuthorizedClient>>;
  calendarId: string | null;
}> {
  const auth = await getAuthorizedClient();
  if (!auth) return { auth: null, calendarId: null };
  const ids = await resolveCalendarIds(auth);
  return { auth, calendarId: ids[0] ?? null };
}

export async function createTaskEvent(input: {
  title: string;
  dueAt: string;
  endsAt?: string | null;
  description?: string;
}): Promise<string | null> {
  const { auth, calendarId } = await getTargetCalendarId();
  if (!auth) {
    console.warn(
      "[createTaskEvent] skipped: no Google auth (missing token cookie or env vars)",
    );
    return null;
  }
  if (!calendarId) {
    console.warn(
      `[createTaskEvent] skipped: no calendar matching "${TARGET_CALENDAR_NAME}"`,
    );
    return null;
  }
  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date(input.dueAt);
  const end = input.endsAt
    ? new Date(input.endsAt)
    : new Date(start.getTime() + 30 * 60 * 1000);

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: input.title,
        description:
          input.description ?? "Parkh37t Dashboard 할 일에서 동기화됨",
        start: { dateTime: start.toISOString(), timeZone: APP_TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: APP_TIMEZONE },
      },
    });
    console.log(
      `[createTaskEvent] inserted event id=${res.data.id} into calendar=${calendarId}`,
    );
    return res.data.id ?? null;
  } catch (e) {
    console.error("[createTaskEvent] insert failed:", e);
    return null;
  }
}

export async function updateTaskEvent(
  eventId: string,
  input: {
    title: string;
    dueAt: string;
    endsAt?: string | null;
    description?: string;
  },
): Promise<void> {
  const { auth, calendarId } = await getTargetCalendarId();
  if (!auth || !calendarId) return;
  const calendar = google.calendar({ version: "v3", auth });

  const start = new Date(input.dueAt);
  const end = input.endsAt
    ? new Date(input.endsAt)
    : new Date(start.getTime() + 30 * 60 * 1000);

  try {
    await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        summary: input.title,
        description:
          input.description ?? "Parkh37t Dashboard 할 일에서 동기화됨",
        start: { dateTime: start.toISOString(), timeZone: APP_TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: APP_TIMEZONE },
      },
    });
  } catch (e) {
    console.error("updateTaskEvent failed:", e);
  }
}

export async function deleteTaskEvent(eventId: string): Promise<void> {
  const { auth, calendarId } = await getTargetCalendarId();
  if (!auth || !calendarId) return;
  const calendar = google.calendar({ version: "v3", auth });
  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (e) {
    console.error("deleteTaskEvent failed:", e);
  }
}
