import { listRecentNotes } from "@/lib/notes";
import { format } from "date-fns";

export async function QuickNote() {
  const notes = await listRecentNotes().catch(() => []);

  return (
    <div className="card flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">메모</h2>
        <span className="chip bg-accent-amber/10 text-accent-amber">빠른 캡처</span>
      </header>

      <form action="/api/notes" method="post" className="flex flex-col gap-2">
        <textarea
          name="content"
          rows={3}
          placeholder="떠오른 생각을 적어두세요…"
          className="resize-none rounded-lg border border-zinc-200 bg-white p-2 text-sm focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="self-end rounded-md bg-accent-violet px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-violet/90"
        >
          저장
        </button>
      </form>

      {notes.length > 0 ? (
        <ul className="flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {notes.map((note) => (
            <li key={note.id} className="text-sm">
              <p className="line-clamp-2 text-ink">{note.content}</p>
              <time className="text-[11px] text-ink-muted">
                {format(new Date(note.createdAt), "M.d HH:mm")}
              </time>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
