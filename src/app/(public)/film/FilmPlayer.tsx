"use client";

// FilmPlayer — the /film page's client shell. `ssr: false` is only legal in a
// client component, and it keeps the film engine out of the page's server
// payload; the chunk loads once this component mounts.

import dynamic from "next/dynamic";

const BrandFilm = dynamic(() => import("@/components/film/BrandFilm"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video w-full items-center justify-center bg-[#0c0d10]">
      <p className="font-mono text-[11px] tracking-[0.14em] text-[#6b6f76] uppercase">
        Loading the film…
      </p>
    </div>
  ),
});

export function FilmPlayer({ cut }: { cut: "60" | "30" | "15" }) {
  return (
    <div className="aspect-video w-full bg-[#0c0d10]">
      {/* key remounts the timeline cleanly when the cut changes */}
      <BrandFilm key={cut} cut={cut} className="h-full w-full" />
    </div>
  );
}
