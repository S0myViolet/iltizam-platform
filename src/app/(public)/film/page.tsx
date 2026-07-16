// /film — the cinema page for "What You Don't See". A dark room: the film
// large and centered, the full voiceover as a readable transcript beneath it
// for accessibility, and quiet cut selection via ?cut= links.

import type { Metadata } from "next";
import Link from "next/link";
import { FilmPlayer } from "./FilmPlayer";

export const metadata: Metadata = {
  title: "What You Don't See — an Iltizam film",
  description:
    "A 60-second film about invisible data — and the moment a business finally sees it.",
};

const CUTS = [
  { value: "60", label: "60-second film", href: "/film" },
  { value: "30", label: "30-second cut", href: "/film?cut=30" },
  { value: "15", label: "15-second cut", href: "/film?cut=15" },
] as const;

type Cut = (typeof CUTS)[number]["value"];

/** The full 60-second voiceover, in order, as spoken. */
const TRANSCRIPT = [
  "Every morning, a business wakes up and begins to move.",
  "Files open. Payroll runs. A contract goes out for signature.",
  "And underneath all of it — something you don't see. Data, moving.",
  "Most of it flows exactly where it should.",
  "But some of it frays. Some of it quietly copies itself.",
  "Some of it slips outside the walls built to hold it, or crosses a border no one meant it to cross.",
  "And some of it simply sits — forgotten, and still yours to protect.",
  "You can't act on what you can't see.",
  "Iltizam watches the movement itself — deterministic rules, mapped to Egypt's PDPL and the GDPR — and brings every finding to a person.",
  "Automated finding. Human review. A name against every risk.",
  "See what matters. Act with confidence.",
  "Iltizam. Automated data protection monitoring, built around human review.",
];

export default async function FilmPage({
  searchParams,
}: {
  searchParams: Promise<{ cut?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.cut) ? params.cut[0] : params.cut;
  const cut: Cut = raw === "30" || raw === "15" ? raw : "60";

  return (
    <main className="min-h-full bg-[#0c0d10] pb-20 text-[#e8e2d6]">
      <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:px-10">
        {/* top bar */}
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-mono text-[10px] tracking-[0.18em] text-[#8d867a] uppercase">
            An Iltizam film
          </p>
          <Link
            href="/"
            className="text-[13px] text-[#8d867a] underline-offset-4 transition-colors hover:text-[#e8e2d6] hover:underline"
          >
            ← Back to the site
          </Link>
        </div>
        <h1 className="display mt-3 text-3xl font-semibold sm:text-4xl">
          What You Don&apos;t See
        </h1>

        {/* the film */}
        <div className="mt-8 overflow-hidden rounded-xl border border-[#23262c] shadow-[0_50px_110px_-60px_rgba(0,0,0,0.95)]">
          <FilmPlayer cut={cut} />
        </div>

        {/* cut selector */}
        <nav aria-label="Film cuts" className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2">
          {CUTS.map((c) => (
            <Link
              key={c.value}
              href={c.href}
              aria-current={cut === c.value ? "true" : undefined}
              className={`text-[13px] underline-offset-4 transition-colors hover:underline ${
                cut === c.value ? "text-[#e8e2d6]" : "text-[#8d867a] hover:text-[#e8e2d6]"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {/* transcript */}
        <section aria-label="Voiceover transcript" className="mt-16 max-w-3xl">
          <p className="font-mono text-[10px] tracking-[0.18em] text-[#8d867a] uppercase">
            Transcript
          </p>
          <div className="mt-6 flex flex-col gap-5 border-l border-[#23262c] pl-6">
            {TRANSCRIPT.map((line) => (
              <p key={line} className="display text-[17px] leading-8 text-[#b9b2a4]">
                {line}
              </p>
            ))}
          </div>
          <p className="mt-10 text-[12.5px] leading-6 text-[#6b6f76]">
            All people and data in this film are fictional. Every risk shown is one
            Iltizam&apos;s deterministic rules detect.
          </p>
        </section>
      </div>
    </main>
  );
}
