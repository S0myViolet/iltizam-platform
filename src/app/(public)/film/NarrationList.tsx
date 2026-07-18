"use client";

// Renders the locked narration from the ONE timing table in BrandFilm.tsx.
// (A client component so the server page never has to unwrap the client
// module's exports — the table itself stays single-sourced.)
import { NARRATION } from "@/components/film/BrandFilm";

export function NarrationList() {
  return (
    <ol className="mt-4 flex flex-col">
      {NARRATION.map((n) => (
        <li
          key={n.at}
          className="flex items-baseline gap-x-4 border-b border-line py-2 first:border-t"
        >
          <span className="w-10 shrink-0 font-mono text-[11px] tabular-nums text-ink3">
            {`${Math.floor(n.at / 60)}:${Math.floor(n.at % 60)
              .toString()
              .padStart(2, "0")}`}
          </span>
          <span className="text-[13.5px] leading-6 text-ink">{n.text}</span>
        </li>
      ))}
    </ol>
  );
}
