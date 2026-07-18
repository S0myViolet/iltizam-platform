import type { Metadata } from "next";
import Link from "next/link";
import { BrandFilm, type CutId } from "@/components/film/BrandFilm";
import type { Orientation } from "@/components/film/scenes";
import { NarrationList } from "./NarrationList";

export const metadata: Metadata = {
  title: "From Exposure to Control — an Iltizam film",
  description:
    "One publicly listed company, ninety days: Diagnose, Build, Operationalise — from scattered, exposed data to a controlled, organised, protected system. A 78-second narrated film.",
};

/* Key printed type inside the world. */
const ON_SCREEN_TEXT = [
  { text: "DATA → EXPOSURE", where: "the customer form" },
  { text: "SCATTERED RECORDS · WEAK CONTROLS · UNANSWERED RISKS", where: "the inspection passage" },
  { text: "THOUSANDS OF RECORDS · ONE BUSINESS · MANY LOCATIONS", where: "the company cutaway" },
  { text: "VALUABLE → UNPROTECTED", where: "the quiet beat" },
  { text: "THE 90-DAY INSPECTION-READY PLAN · DAY 1 · DAY 20 · DAY 60 · DAY 90", where: "the plan path" },
  { text: "PHASE ONE DIAGNOSE · PHASE TWO BUILD · PHASE THREE OPERATIONALISE", where: "the phase gates" },
  { text: "ACCESS TOO BROAD · CONSENT EVIDENCE MISSING · TRANSFER REVIEW REQUIRED · RETENTION UNDEFINED", where: "the gaps, beside their sources" },
  { text: "DATA MAPPED · GAPS IDENTIFIED · REQUIREMENTS DEFINED", where: "printed on the path" },
  { text: "POLICIES ESTABLISHED · LOGS CREATED · ACCOUNTABILITY ASSIGNED", where: "printed on the path" },
  { text: "DATA PROTECTION OFFICER — APPOINTED", where: "the table moment" },
  { text: "FROM PAPER · TO PRACTICE / TEAMS TRAINED · CONTROLS ACTIVE", where: "Operationalise" },
  { text: "SIMULATION STARTED → INCIDENT CONTAINED → RESPONSE VERIFIED", where: "the breach simulation" },
  { text: "DAY 90 · INSPECTION-READY · EVIDENCE PACK", where: "the halt" },
  { text: "DEFENSIBLE · STRUCTURED · BUILT TO LAST", where: "the indexed system" },
  { text: "NO DELAYS · NO SURPRISES · JUST CLARITY", where: "the closing beats" },
  { text: "CONTROLLED · ORGANISED · PROTECTED", where: "the transformation" },
  { text: "Regulator review — external timeline", where: "beyond Day 90" },
];

export default async function FilmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawT = typeof sp.filmt === "string" ? Number.parseFloat(sp.filmt) : NaN;
  const initialTime = Number.isFinite(rawT) ? rawT : undefined;
  const initialCut: CutId = sp.cut === "30" || sp.cut === "15" ? sp.cut : "90";
  const orientation: Orientation = sp.ar === "916" ? "9:16" : "16:9";

  return (
    <main className="pb-16">
      <header className="band">
        <div className="shell pt-12 pb-10 sm:pt-14">
          <p className="eyebrow text-gold-bright">The Iltizam film · 78 seconds</p>
          <h1 className="display mt-4 max-w-2xl text-4xl leading-[1.15] font-semibold">
            From Exposure to Control
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-brand-muted">
            {"One publicly listed company, ninety days. Diagnose, Build, Operationalise — scattered records, weak controls and unanswered risks rebuilt into a controlled, organised, protected system. The full cut plays the recorded narration; the same lines run as captions, so the film works with sound on or off."}
          </p>
          <p className="mt-5 flex items-center gap-2 text-[12px] text-brand-muted">
            <span className="mr-1">Format:</span>
            <Link
              href="/film"
              className={`rounded-md border px-2.5 py-1 font-medium transition-colors ${
                orientation === "16:9"
                  ? "border-gold/70 text-gold-bright"
                  : "border-brand-line hover:text-brand-ink"
              }`}
            >
              Landscape 16:9
            </Link>
            <Link
              href="/film?ar=916"
              className={`rounded-md border px-2.5 py-1 font-medium transition-colors ${
                orientation === "9:16"
                  ? "border-gold/70 text-gold-bright"
                  : "border-brand-line hover:text-brand-ink"
              }`}
            >
              Vertical 9:16
            </Link>
          </p>
        </div>
      </header>

      <div className="shell -mt-2 pt-6">
        <BrandFilm
          initialTime={initialTime}
          initialCut={initialCut}
          orientation={orientation}
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section aria-label="The narration">
            <p className="eyebrow text-gold-text">The narration</p>
            <NarrationList />
          </section>

          <section aria-label="Printed in the world">
            <p className="eyebrow text-gold-text">Printed in the world</p>
            <ul className="mt-4 flex flex-col">
              {ON_SCREEN_TEXT.map((l) => (
                <li
                  key={l.text}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-2.5 first:border-t"
                >
                  <span className="text-[13px] text-ink">{l.text}</span>
                  <span className="text-[11px] tracking-wide text-ink3">{l.where}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-label="Downloads" className="mt-10 border-t-2 border-line pt-5">
          <p className="eyebrow text-gold-text">Download the film</p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
            <li>
              <a href="/film/exports/from-exposure-to-control-master.mp4" download
                className="text-ink underline decoration-line underline-offset-4 hover:text-gold-bright">
                Narrated master (MP4, 1080p)
              </a>
            </li>
            <li>
              <a href="/film/exports/from-exposure-to-control-subtitled.mp4" download
                className="text-ink underline decoration-line underline-offset-4 hover:text-gold-bright">
                Narrated + subtitles (MP4)
              </a>
            </li>
            <li>
              <a href="/film/exports/from-exposure-to-control-captions.mp4" download
                className="text-ink underline decoration-line underline-offset-4 hover:text-gold-bright">
                Burned captions, sound-off friendly (MP4)
              </a>
            </li>
            <li>
              <a href="/film/exports/from-exposure-to-control.srt" download
                className="text-ink underline decoration-line underline-offset-4 hover:text-gold-bright">
                Subtitles (SRT)
              </a>
            </li>
          </ul>
        </section>

        <p className="mt-8 text-[12.5px] text-ink3">
          {"An Iltizam film — written, designed and animated in code by the Iltizam team. The recorded narration is the film's clock: scenes, captions and score are authored on its word-level timestamps."}
        </p>
      </div>
    </main>
  );
}
