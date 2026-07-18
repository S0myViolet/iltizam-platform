import type { Metadata } from "next";
import Link from "next/link";
import { BrandFilm, type CutId } from "@/components/film/BrandFilm";
import type { Orientation } from "@/components/film/scenes";
import { NarrationList } from "./NarrationList";

export const metadata: Metadata = {
  title: "The 90-Day Transformation — an Iltzam film",
  description:
    "One company, ninety days: Diagnose, Build, Operationalise — from a scattered web of customer records to inspection-ready. A 78-second narrated film.",
};

/* Key printed type inside the world — the ribbon and its stations. */
const ON_SCREEN_TEXT = [
  { text: "New privacy obligations · Inspection exposure rising", where: "the report" },
  { text: "DAY 1 · DAY 20 · DAY 60 · DAY 90", where: "printed on the ribbon" },
  { text: "DIAGNOSE · BUILD · OPERATIONALISE", where: "printed on the ribbon" },
  { text: "A scattered web of customer data.", where: "the tangled company" },
  { text: "SENSITIVE DATA · CROSS-BORDER TRANSFER · CONSENT EVIDENCE · RETENTION PERIOD", where: "the four findings" },
  { text: "Data mapped · Gaps identified · Licensing requirements defined", where: "Diagnose closes" },
  { text: "CONSENT REGISTER · BREACH LOG · PROCESSING REGISTER · RETENTION SCHEDULE", where: "the Build drawers" },
  { text: "DATA PROTECTION OFFICER — ACCOUNTABILITY ASSIGNED", where: "the appointment" },
  { text: "FROM POLICY TO PRACTICE", where: "Operationalise" },
  { text: "SIMULATION ACTIVE → INCIDENT CONTAINED → RESPONSE VERIFIED", where: "the simulated breach" },
  { text: "EVIDENCE COMPLETE · INSPECTION-READY · DAY 90", where: "the evidence pack" },
  { text: "Regulator review — external timeline", where: "beyond the ribbon" },
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
          <p className="eyebrow text-gold-bright">The Iltzam film · 78 seconds</p>
          <h1 className="display mt-4 max-w-2xl text-4xl leading-[1.15] font-semibold">
            The 90-Day Transformation
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-brand-muted">
            {"One company, one paper ribbon, ninety days. Diagnose, Build, Operationalise — from a scattered web of customer records to inspection-ready. The full cut plays the recorded narration; the same lines run as captions, so the film works with sound on or off."}
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

        <p className="mt-10 border-t-2 border-line pt-5 text-[12.5px] text-ink3">
          An Iltzam film — written, designed and animated in code by the Iltzam team.
          Captions, camera and score are synchronized to the recorded voiceover,
          timed from the pauses in the recording itself.
        </p>
      </div>
    </main>
  );
}
