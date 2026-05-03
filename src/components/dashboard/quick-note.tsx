import { format } from "date-fns";
import { Save, StickyNote } from "lucide-react";
import { listRecentNotes } from "@/lib/notes";
import { createNote } from "@/lib/actions";

export async function QuickNote() {
  const notes = await listRecentNotes().catch(() => []);

  return (
    <div className="card-interactive flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-accent-amber/10 p-1.5 text-accent-amber">
            <StickyNote className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-semibold">메모</h2>
        </div>
        <span className="chip bg-accent-amber/10 text-accent-amber">
          빠른 캡처
        </span>
      </header>

      <form action={createNote} className="flex flex-col gap-2">
        <textarea
          name="content"
          rows={3}
          required
          placeholder="떠오른 생각을 적어두세요…"
          className="resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm focus:border-accent-violet focus:outline-none focus:ring-1 focus:ring-accent-violet dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="inline-flex min-w-[96px] items-center justify-center gap-1 self-end rounded-lg bg-accent-violet px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-violet/90 hover:shadow active:translate-y-px"
        >
          <Save className="h-4 w-4" />
          저장
        </button>
      </form>

      {notes.length > 0 ? (
        <ul className="flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg p-2 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            >
              <p className="line-clamp-2 text-sm text-ink">{note.content}</p>
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
