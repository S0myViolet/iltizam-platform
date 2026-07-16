"use client";

// FilmSection — the landing page's cinematic frame for "What You Don't See".
// The film engine is heavy relative to the landing page, so nothing beyond
// this tiny wrapper ships on initial load: a static poster renders first, and
// BrandFilm is dynamically imported only when the visitor presses play.

import { useState } from "react";
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

/** Static poster art in the film's visual language — threads over charcoal. */
function PosterArt() {
  return (
    <svg
      viewBox="0 0 1600 900"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="fs-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#131518" />
          <stop offset="1" stopColor="#1c1f24" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#fs-bg)" />
      <polygon points="0,120 300,190 300,740 0,830" fill="#e8dcc4" opacity="0.05" />
      <rect x="1150" width="450" height="900" fill="#23262c" opacity="0.35" />
      <g fill="none" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 14">
        <path d="M 140 560 C 460 480 820 420 1120 400 C 1300 388 1460 380 1600 372" stroke="#6fa39c" strokeOpacity="0.5" />
        <path d="M 140 600 C 480 570 860 540 1160 500 C 1330 478 1470 470 1600 458" stroke="#6fa39c" strokeOpacity="0.35" />
        <path d="M 140 640 C 460 660 800 620 1100 590 C 1290 572 1460 566 1600 556" stroke="#6fa39c" strokeOpacity="0.42" />
        <path d="M 820 470 C 1000 430 1200 350 1380 300 C 1460 278 1540 262 1600 250" stroke="#b0762a" strokeOpacity="0.45" strokeWidth="1.2" />
        <path d="M 820 470 C 990 460 1180 420 1360 410 C 1450 405 1540 400 1600 396" stroke="#b0762a" strokeOpacity="0.3" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

export function FilmSection() {
  const [started, setStarted] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-brand-line bg-[#0c0d10] shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)]">
      {started ? (
        <div className="aspect-video w-full">
          <BrandFilm cut="60" className="h-full w-full" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="group relative block aspect-video w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold-bright"
          aria-label="Play the film: What You Don't See, 60 seconds"
        >
          <PosterArt />
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#8d867a]/40 bg-[#131518]/70 transition-colors group-hover:border-[#e8e2d6]/60">
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" aria-hidden="true">
                <path d="M7 4.5 19 12 7 19.5 Z" fill="#e8e2d6" />
              </svg>
            </span>
            <span className="flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.18em] text-[#8d867a] uppercase">
                An Iltizam film · 60 seconds
              </span>
              <span className="display text-2xl text-[#e8e2d6] sm:text-3xl">
                What You Don&apos;t See
              </span>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
