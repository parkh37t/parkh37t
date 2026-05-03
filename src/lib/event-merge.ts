import type { Event } from "@/types";

export function mergeWithoutDuplicates(
  googleEvents: Event[],
  taskEvents: Event[],
): Event[] {
  const linkedGoogleIds = new Set(
    taskEvents
      .map((t) => t.googleEventId)
      .filter((id): id is string => Boolean(id)),
  );
  const dedupedGoogle = googleEvents.filter((e) => !linkedGoogleIds.has(e.id));
  return [...dedupedGoogle, ...taskEvents].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
}
