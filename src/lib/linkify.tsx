import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s]+)/g;

export function linkify(text: string): ReactNode[] {
  const parts = text.split(URL_RE);
  return parts.map((p, i) => {
    if (URL_RE.test(p)) {
      // reset lastIndex since URL_RE is global
      URL_RE.lastIndex = 0;
      return (
        <a
          key={i}
          href={p}
          target="_blank"
          rel="noreferrer"
          className="text-accent-lavender hover:underline inline-flex items-center gap-0.5 break-all"
        >
          {p}
          <ExternalLink className="ml-0.5 h-[11px] w-[11px]" />
        </a>
      );
    }
    return <span key={i}>{p}</span>;
  });
}
