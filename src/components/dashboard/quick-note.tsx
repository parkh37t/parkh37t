import { listRecentNotes } from "@/lib/notes";
import { createNote } from "@/lib/actions";
import { format } from "date-fns";
import { Save, StickyNote } from "lucide-react";
import { linkify } from "@/lib/linkify";

export async function QuickNote() {
  const notes = await listRecentNotes().catch(() => []);

  return (
    <section className="card flex flex-col">
      <header className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-amber-400 to-orange-500">
            <StickyNote className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] lg:text-[20px] font-bold leading-tight text-ink truncate">
              메모
            </div>
            <div className="text-[12.5px] text-zinc-400 mt-0.5">
              떠오르는 생각
            </div>
          </div>
        </div>
        <div className="px-2.5 h-7 rounded-full flex items-center text-[12px] font-semibold whitespace-nowrap bg-amber-50 text-amber-700">
          빠른 캡처
        </div>
      </header>

      <form
        action={createNote}
        className="bg-[#FAFAFC] border border-zinc-100 rounded-2xl p-3.5 mb-4"
      >
        <textarea
          name="content"
          rows={3}
          required
          placeholder="떠오른 생각을 적어두세요..."
          className="w-full p-3 rounded-xl bg-white border border-zinc-200 text-[14px] resize-none placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-300/40 focus:border-violet-300"
        />
        <div className="flex justify-end mt-2.5">
          <button
            type="submit"
            className="h-10 px-4 rounded-full text-white font-semibold text-[13px] flex items-center gap-1.5 hover:opacity-95 active:scale-[.98] transition"
            style={{
              background: "#5046A8",
              boxShadow: "0 4px 14px -4px rgba(80,70,168,0.55)",
            }}
          >
            <Save className="h-[14px] w-[14px]" strokeWidth={2.2} />
            저장
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="text-center py-4 text-[13px] text-zinc-400">
          아직 메모가 없습니다.
        </div>
      ) : (
        <ul className="flex flex-col gap-2 max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
          {notes.map((note) => {
            const d = new Date(note.createdAt);
            return (
              <li
                key={note.id}
                className="group flex gap-3 px-3.5 py-3 rounded-2xl bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-ink whitespace-pre-wrap break-words leading-relaxed">
                    {linkify(note.content)}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1.5 font-medium">
                    {format(d, "M.d HH:mm")}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
