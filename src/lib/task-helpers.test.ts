import { describe, expect, it } from "vitest";
import {
  combineDateAndTime,
  descriptionFor,
  isFetchFailedError,
  isMissingLocationColumn,
  readCategory,
  readDateRange,
  readLocation,
  readPriority,
  summarizeError,
} from "./task-helpers";

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

describe("combineDateAndTime", () => {
  it("returns null for empty date", () => {
    expect(combineDateAndTime("", "10:00")).toBeNull();
  });

  it("defaults to 00:00 when time is missing or invalid", () => {
    const a = combineDateAndTime("2026-05-21", null);
    const b = combineDateAndTime("2026-05-21", "bad");
    expect(a).toBe("2026-05-20T15:00:00.000Z");
    expect(b).toBe(a);
  });

  it("converts KST input to ISO UTC", () => {
    expect(combineDateAndTime("2026-05-21", "09:00")).toBe(
      "2026-05-21T00:00:00.000Z",
    );
    expect(combineDateAndTime("2026-05-21", "23:30")).toBe(
      "2026-05-21T14:30:00.000Z",
    );
  });
});

describe("readDateRange", () => {
  it("returns nulls when no date provided", () => {
    expect(readDateRange(fd({}))).toEqual({ due_at: null, ends_at: null });
  });

  it("returns due_at only when no end provided", () => {
    const out = readDateRange(fd({ due_date: "2026-05-21", due_time: "10:00" }));
    expect(out.due_at).toBe("2026-05-21T01:00:00.000Z");
    expect(out.ends_at).toBeNull();
  });

  it("treats all_day as 00:00 → 23:59 on the same day", () => {
    const out = readDateRange(
      fd({ due_date: "2026-05-21", end_date: "2026-05-21", all_day: "true" }),
    );
    expect(out.due_at).toBe("2026-05-20T15:00:00.000Z");
    expect(out.ends_at).toBe("2026-05-21T14:59:00.000Z");
  });

  it("collapses ends_at to null when end equals start", () => {
    const out = readDateRange(
      fd({
        due_date: "2026-05-21",
        due_time: "10:00",
        end_date: "2026-05-21",
        end_time: "10:00",
      }),
    );
    expect(out.ends_at).toBeNull();
  });

  it("pushes ends_at to next day when end is earlier than start (overnight)", () => {
    const out = readDateRange(
      fd({
        due_date: "2026-05-21",
        due_time: "23:00",
        end_date: "2026-05-21",
        end_time: "01:00",
      }),
    );
    expect(out.due_at).toBe("2026-05-21T14:00:00.000Z");
    expect(out.ends_at).toBe("2026-05-21T16:00:00.000Z");
  });

  it("keeps a normal in-day range as-is", () => {
    const out = readDateRange(
      fd({
        due_date: "2026-05-21",
        due_time: "10:00",
        end_date: "2026-05-21",
        end_time: "11:30",
      }),
    );
    expect(out.due_at).toBe("2026-05-21T01:00:00.000Z");
    expect(out.ends_at).toBe("2026-05-21T02:30:00.000Z");
  });
});

describe("readPriority", () => {
  it("returns the priority when valid", () => {
    expect(readPriority(fd({ priority: "low" }))).toBe("low");
    expect(readPriority(fd({ priority: "med" }))).toBe("med");
    expect(readPriority(fd({ priority: "high" }))).toBe("high");
  });
  it("falls back to med for unknown or missing", () => {
    expect(readPriority(fd({ priority: "bogus" }))).toBe("med");
    expect(readPriority(fd({}))).toBe("med");
  });
});

describe("readCategory", () => {
  it("returns category when valid", () => {
    expect(readCategory(fd({ category: "work" }))).toBe("work");
  });
  it("falls back to default for unknown", () => {
    expect(readCategory(fd({ category: "bogus" }))).toBe("default");
    expect(readCategory(fd({}))).toBe("default");
  });
});

describe("readLocation", () => {
  it("trims input", () => {
    expect(readLocation(fd({ location: "  서울  " }))).toBe("서울");
  });
  it("returns empty string when missing", () => {
    expect(readLocation(fd({}))).toBe("");
  });
});

describe("descriptionFor", () => {
  it("omits category when default", () => {
    expect(descriptionFor("high", "default")).toBe("우선순위: high");
  });
  it("includes category when non-default", () => {
    expect(descriptionFor("med", "work")).toBe("우선순위: med · 카테고리: work");
  });
});

describe("isMissingLocationColumn", () => {
  it("detects Postgres 42703 (undefined_column)", () => {
    expect(isMissingLocationColumn({ code: "42703", message: "" })).toBe(true);
  });

  it("detects via message text mentioning location and column", () => {
    expect(
      isMissingLocationColumn({
        message: 'column "location" of relation "tasks" does not exist',
      }),
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isMissingLocationColumn({ code: "23505", message: "duplicate" })).toBe(
      false,
    );
    expect(isMissingLocationColumn(null)).toBe(false);
  });
});

describe("isFetchFailedError", () => {
  it("matches the undici 'TypeError: fetch failed' message", () => {
    expect(isFetchFailedError({ message: "TypeError: fetch failed" })).toBe(true);
    expect(isFetchFailedError({ message: "fetch failed" })).toBe(true);
  });

  it("walks the cause chain for known system error codes", () => {
    const err = new TypeError("fetch failed");
    (err as Error & { cause?: unknown }).cause = Object.assign(new Error("dns"), {
      code: "ENOTFOUND",
    });
    expect(isFetchFailedError(err)).toBe(true);

    const refused = { message: "x", cause: { code: "ECONNREFUSED" } };
    expect(isFetchFailedError(refused)).toBe(true);

    const timeout = {
      message: "x",
      cause: { cause: { code: "UND_ERR_CONNECT_TIMEOUT" } },
    };
    expect(isFetchFailedError(timeout)).toBe(true);
  });

  it("returns false for Postgres errors and other non-network errors", () => {
    expect(isFetchFailedError({ code: "23505", message: "duplicate key" })).toBe(
      false,
    );
    expect(isFetchFailedError({ message: "permission denied" })).toBe(false);
    expect(isFetchFailedError(null)).toBe(false);
    expect(isFetchFailedError(undefined)).toBe(false);
  });
});

describe("summarizeError", () => {
  it("returns a placeholder for null/undefined", () => {
    expect(summarizeError(null)).toBe("(no error)");
    expect(summarizeError(undefined)).toBe("(no error)");
  });

  it("serializes a single error with code", () => {
    expect(summarizeError({ message: "boom", code: "23505" })).toBe(
      "boom code=23505",
    );
  });

  it("walks the cause chain", () => {
    const err = new TypeError("fetch failed");
    (err as Error & { cause?: unknown }).cause = Object.assign(
      new Error("getaddrinfo ENOTFOUND db.example"),
      { code: "ENOTFOUND" },
    );
    expect(summarizeError(err)).toBe(
      "fetch failed ← caused by ← getaddrinfo ENOTFOUND db.example code=ENOTFOUND",
    );
  });
});
