import { google } from "googleapis";
import { cookies } from "next/headers";
import {
  endOfDayKst,
  endOfWeekKst,
  startOfDayKst,
  startOfWeekKst,
} from "@/lib/format-time";
import {
  clearStoredTokens,
  getStoredTokens,
  saveStoredTokens,
  type StoredTokens,
} from "@/lib/google-tokens";
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

async function loadTokensWithCookieFallback(): Promise<StoredTokens | null> {
  const stored = await getStoredTokens();
  if (stored) return stored;

  const cookieToken = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!cookieToken) return null;

  try {
    const parsed = JSON.parse(cookieToken);
    if (!parsed?.access_token) return null;
    const migrated: StoredTokens = {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token ?? null,
      expiry_date: parsed.expiry_date ?? null,
      scope: parsed.scope ?? null,
      token_type: parsed.token_type ?? null,
    };
    await saveStoredTokens(migrated);
    console.log("[google] migrated tokens from cookie to DB");
    return migrated;
  } catch (e) {
    console.warn("[google] cookie migration failed:", e);
    return null;
  }
}

export async function googleConnected(): Promise<boolean> {
  if (!googleConfigured()) return false;
  const stored = await loadTokensWithCookieFallback();
  return Boolean(stored);
}

const REFRESH_LEEWAY_MS = 60 * 1000;

function isInvalidGrantError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as {
    response?: { data?: { error?: string; error_description?: string } };
    message?: string;
  };
  if (err.response?.data?.error === "invalid_grant") return true;
  if (typeof err.message === "string" && err.message.includes("invalid_grant"))
    return true;
  return false;
}

function attachTokenPersistence(
  oauth: ReturnType<typeof makeOAuthClient>,
  base: StoredTokens,
) {
  // googleapis emits 'tokens' whenever it auto-refreshes the access_token
  // mid-call. Persist those tokens so the next call doesn't refresh again.
  oauth.on("tokens", (refreshed) => {
    const merged: StoredTokens = {
      access_token: refreshed.access_token ?? base.access_token,
      refresh_token: refreshed.refresh_token ?? base.refresh_token,
      expiry_date: refreshed.expiry_date ?? base.expiry_date,
      scope: refreshed.scope ?? base.scope,
      token_type: refreshed.token_type ?? base.token_type,
    };
    saveStoredTokens(merged)
      .then(() =>
        console.log(
          `[google] auto-refresh persisted, expiry=${merged.expiry_date}`,
        ),
      )
      .catch((e) => console.error("[google] auto-refresh persist failed:", e));
  });
}

async function getAuthorizedClient() {
  if (!googleConfigured()) {
    console.warn("[google] not configured (missing CLIENT_ID/SECRET/REDIRECT)");
    return null;
  }

  const stored = await loadTokensWithCookieFallback();
  if (!stored) {
    console.warn(
      "[google] no stored tokens; user must reconnect at /api/google/auth",
    );
    return null;
  }

  const oauth = makeOAuthClient();
  oauth.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token ?? undefined,
    expiry_date: stored.expiry_date ?? undefined,
    scope: stored.scope ?? undefined,
    token_type: stored.token_type ?? undefined,
  });
  attachTokenPersistence(oauth, stored);

  const expired =
    typeof stored.expiry_date === "number" &&
    stored.expiry_date <= Date.now() + REFRESH_LEEWAY_MS;

  if (expired) {
    if (!stored.refresh_token) {
      console.warn(
        "[google] access_token expired but no refresh_token; user must reconnect",
      );
      return null;
    }
    try {
      const { credentials: refreshed } = await oauth.refreshAccessToken();
      const merged: StoredTokens = {
        access_token: refreshed.access_token ?? stored.access_token,
        refresh_token: refreshed.refresh_token ?? stored.refresh_token,
        expiry_date: refreshed.expiry_date ?? stored.expiry_date,
        scope: refreshed.scope ?? stored.scope,
        token_type: refreshed.token_type ?? stored.token_type,
      };
      oauth.setCredentials({
        access_token: merged.access_token,
        refresh_token: merged.refresh_token ?? undefined,
        expiry_date: merged.expiry_date ?? undefined,
        scope: merged.scope ?? undefined,
        token_type: merged.token_type ?? undefined,
      });
      await saveStoredTokens(merged);
      console.log(
        `[google] refreshed access_token, new expiry=${merged.expiry_date}`,
      );
    } catch (e) {
      if (isInvalidGrantError(e)) {
        console.error(
          "[google] refresh_token rejected (invalid_grant) — clearing stored tokens; user must reconnect at /api/google/auth",
        );
        await clearStoredTokens().catch((err) =>
          console.error("[google] failed to clear dead tokens:", err),
        );
      } else {
        console.error("[google] refresh failed:", e);
      }
      return null;
    }
  }

  return oauth;
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function matchesTargetCalendar(summary: string | null | undefined) {
  if (!summary) return false;
  return normalize(summary) === normalize(TARGET_CALENDAR_NAME);
}

type CalendarIdCache = { value: string; expiresAt: number };
let calendarIdCache: CalendarIdCache | null = null;
const CALENDAR_ID_TTL_MS = 5 * 60 * 1000;

function clearCalendarIdCache() {
  calendarIdCache = null;
}

async function resolveCalendarIds(
  auth: NonNullable<Awaited<ReturnType<typeof getAuthorizedClient>>>,
): Promise<string[]> {
  try {
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
  } catch (e) {
    console.error("[google-calendar] calendarList.list failed:", e);
    return [];
  }
}

async function fetchEvents(timeMin: Date, timeMax: Date): Promise<Event[]> {
  const auth = await getAuthorizedClient();
  if (!auth) return [];
  const calendar = google.calendar({ version: "v3", auth });
  const calendarIds = await resolveCalendarIds(auth);
  if (calendarIds.length === 0) return [];

  const all: Event[] = [];
  for (const calendarId of calendarIds) {
    try {
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
          startsAt:
            it.start?.dateTime ?? it.start?.date ?? new Date().toISOString(),
          endsAt:
            it.end?.dateTime ?? it.end?.date ?? new Date().toISOString(),
          location: it.location ?? null,
          category: "default",
          source: "google",
        });
      }
    } catch (e) {
      console.error(`[google-calendar] events.list failed for ${calendarId}:`, e);
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

  if (calendarIdCache && calendarIdCache.expiresAt > Date.now()) {
    return { auth, calendarId: calendarIdCache.value };
  }

  const ids = await resolveCalendarIds(auth);
  const id = ids[0] ?? null;
  if (id) {
    calendarIdCache = { value: id, expiresAt: Date.now() + CALENDAR_ID_TTL_MS };
  }
  return { auth, calendarId: id };
}

function formatGoogleError(e: unknown): string {
  if (!e || typeof e !== "object") return String(e);
  const err = e as { code?: number; message?: string; status?: number };
  return `code=${err.code ?? err.status ?? "?"} message=${err.message ?? "(no message)"}`;
}

async function tryInsertEvent(
  auth: NonNullable<Awaited<ReturnType<typeof getAuthorizedClient>>>,
  calendarId: string,
  input: {
    title: string;
    dueAt: string;
    endsAt?: string | null;
    description?: string;
  },
): Promise<{ id: string | null; transient: boolean; error?: unknown }> {
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
    return { id: res.data.id ?? null, transient: false };
  } catch (e) {
    const code = (e as { code?: number; status?: number }).code;
    const status = (e as { code?: number; status?: number }).status;
    const httpCode = code ?? status ?? 0;
    const transient =
      httpCode === 401 ||
      httpCode === 403 ||
      httpCode === 404 ||
      httpCode === 429 ||
      (httpCode >= 500 && httpCode < 600);
    return { id: null, transient, error: e };
  }
}

export type CreateEventOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: string };

export async function createTaskEvent(input: {
  title: string;
  dueAt: string;
  endsAt?: string | null;
  description?: string;
}): Promise<CreateEventOutcome> {
  const { auth, calendarId } = await getTargetCalendarId();
  if (!auth) {
    console.warn(
      `[createTaskEvent] skipped: no Google auth (title="${input.title}")`,
    );
    return {
      ok: false,
      reason:
        "Google 인증 토큰이 없거나 만료됐습니다. 우측 상단 '재연결' 버튼으로 다시 연결해 주세요.",
    };
  }
  if (!calendarId) {
    console.warn(
      `[createTaskEvent] skipped: no calendar matching "${TARGET_CALENDAR_NAME}" (title="${input.title}")`,
    );
    return {
      ok: false,
      reason: `타겟 캘린더 "${TARGET_CALENDAR_NAME}"를 찾을 수 없습니다 (이름이 바뀌었거나 권한이 없을 수 있음).`,
    };
  }

  const first = await tryInsertEvent(auth, calendarId, input);
  if (first.id) {
    console.log(
      `[createTaskEvent] inserted event id=${first.id} into calendar=${calendarId} (title="${input.title}")`,
    );
    return { ok: true, id: first.id };
  }

  console.warn(
    `[createTaskEvent] first attempt failed (title="${input.title}", transient=${first.transient}): ${formatGoogleError(first.error)}`,
  );

  if (!first.transient) {
    return {
      ok: false,
      reason: `Google API 오류: ${formatGoogleError(first.error)}`,
    };
  }

  // Retry once with a fresh client + fresh calendar id (may have rotated).
  clearCalendarIdCache();
  const retry = await getTargetCalendarId();
  if (!retry.auth || !retry.calendarId) {
    console.error(
      `[createTaskEvent] retry skipped: auth=${Boolean(retry.auth)} calendarId=${retry.calendarId}`,
    );
    return {
      ok: false,
      reason: !retry.auth
        ? "재시도 실패: Google 토큰이 만료됐습니다. 재연결이 필요합니다."
        : `재시도 실패: 캘린더 "${TARGET_CALENDAR_NAME}"를 못 찾았습니다.`,
    };
  }
  const second = await tryInsertEvent(retry.auth, retry.calendarId, input);
  if (second.id) {
    console.log(
      `[createTaskEvent] inserted on retry id=${second.id} into calendar=${retry.calendarId}`,
    );
    return { ok: true, id: second.id };
  }
  console.error(
    `[createTaskEvent] retry failed (title="${input.title}"): ${formatGoogleError(second.error)}`,
  );
  return {
    ok: false,
    reason: `재시도 후 실패: ${formatGoogleError(second.error)}`,
  };
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
    console.error(
      `[updateTaskEvent] failed (eventId=${eventId}): ${formatGoogleError(e)}`,
    );
  }
}

export async function deleteTaskEvent(eventId: string): Promise<void> {
  const { auth, calendarId } = await getTargetCalendarId();
  if (!auth || !calendarId) return;
  const calendar = google.calendar({ version: "v3", auth });
  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (e) {
    console.error(
      `[deleteTaskEvent] failed (eventId=${eventId}): ${formatGoogleError(e)}`,
    );
  }
}

export type DiagnosticReport = {
  env: {
    googleConfigured: boolean;
    targetCalendarName: string;
    appTimezone: string;
    redirectUri: string;
  };
  tokens: {
    hasStored: boolean;
    hasRefreshToken: boolean;
    expiryDate: number | null;
    expired: boolean | null;
    msUntilExpiry: number | null;
  };
  calendars: {
    listed: { summary: string | null; summaryOverride: string | null; id: string | null; matched: boolean }[];
    matchedId: string | null;
    listError: string | null;
  };
  testInsert: {
    attempted: boolean;
    eventId: string | null;
    error: string | null;
  };
};

export async function buildDiagnosticReport(): Promise<DiagnosticReport> {
  const stored = await loadTokensWithCookieFallback();
  const expiryDate =
    typeof stored?.expiry_date === "number" ? stored.expiry_date : null;
  const msUntilExpiry = expiryDate ? expiryDate - Date.now() : null;

  const report: DiagnosticReport = {
    env: {
      googleConfigured: googleConfigured(),
      targetCalendarName: TARGET_CALENDAR_NAME,
      appTimezone: APP_TIMEZONE,
      redirectUri: REDIRECT_URI || "(not set)",
    },
    tokens: {
      hasStored: Boolean(stored),
      hasRefreshToken: Boolean(stored?.refresh_token),
      expiryDate,
      expired: expiryDate !== null ? expiryDate <= Date.now() : null,
      msUntilExpiry,
    },
    calendars: { listed: [], matchedId: null, listError: null },
    testInsert: { attempted: false, eventId: null, error: null },
  };

  const auth = await getAuthorizedClient();
  if (!auth) {
    report.calendars.listError = "no authorized client (token refresh failed or no tokens)";
    return report;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const list = await calendar.calendarList.list();
    const items = list.data.items ?? [];
    report.calendars.listed = items.map((c) => ({
      summary: c.summary ?? null,
      summaryOverride: c.summaryOverride ?? null,
      id: c.id ?? null,
      matched: matchesTargetCalendar(c.summary ?? c.summaryOverride),
    }));
    const match = report.calendars.listed.find((c) => c.matched);
    report.calendars.matchedId = match?.id ?? null;

    if (match?.id) {
      report.testInsert.attempted = true;
      const start = new Date(Date.now() + 60_000);
      const end = new Date(Date.now() + 90_000);
      try {
        const inserted = await calendar.events.insert({
          calendarId: match.id,
          requestBody: {
            summary: "[diagnose] test event — auto-deleted",
            description: "Diagnostic test event from Parkh37t Dashboard",
            start: { dateTime: start.toISOString(), timeZone: APP_TIMEZONE },
            end: { dateTime: end.toISOString(), timeZone: APP_TIMEZONE },
          },
        });
        report.testInsert.eventId = inserted.data.id ?? null;
        if (inserted.data.id) {
          await calendar.events
            .delete({ calendarId: match.id, eventId: inserted.data.id })
            .catch(() => {});
        }
      } catch (e) {
        report.testInsert.error = formatGoogleError(e);
      }
    }
  } catch (e) {
    report.calendars.listError = formatGoogleError(e);
  }

  return report;
}
