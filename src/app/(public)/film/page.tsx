import type { Metadata } from "next";
import { BrandFilm, type CutId } from "@/components/film/BrandFilm";

export const metadata: Metadata = {
  title: "After Submit — an Iltizam film",
  description:
    "One application, one request, and the responsibility that begins after “Submit”. A 48-second film.",
};

/* The closing voiceover, and the film's final on-screen line. */
const CLOSING_LINES = [
  "People share more than information.",
  "They share trust.",
  "What happens next is your responsibility.",
  "What happens after “Submit” matters.",
];

/* Every piece of on-screen text in the film — diegetic, never captioned. */
const ON_SCREEN_TEXT = [
  { text: "Application submitted", where: "S1 · after the click" },
  { text: "Welcome to the team", where: "S2 · the first-day badge" },
  {
    text: "Could you please delete the ID copy I submitted when I applied?",
    where: "S4 · the request",
  },
  { text: "4 locations identified", where: "S5 · the Iltizam card" },
  { text: "Human review required", where: "S5 · the finding" },
  { text: "Owner assigned", where: "S5 · the first click" },
  { text: "Request completed", where: "S5 · the quiet last line" },
];

export default async function FilmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawT = typeof sp.filmt === "string" ? Number.parseFloat(sp.filmt) : NaN;
  const initialTime = Number.isFinite(rawT) ? rawT : undefined;
  const initialCut: CutId =
    sp.cut === "30" || sp.cut === "15" ? sp.cut : "48";

  return (
    <main className="pb-16">
      <header className="band">
        <div className="shell pt-12 pb-10 sm:pt-14">
          <p className="eyebrow text-gold-bright">The Iltizam film · 48 seconds</p>
          <h1 className="display mt-4 max-w-2xl text-4xl leading-[1.15] font-semibold">
            After Submit
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-brand-muted">
            {"One woman, one company, one request. No narration until the very end — just what happens to two files after the button is pressed."}
          </p>
        </div>
      </header>

      <div className="shell -mt-2 pt-6">
        <BrandFilm initialTime={initialTime} initialCut={initialCut} />

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section aria-label="Closing lines">
            <p className="eyebrow text-gold-text">The closing lines</p>
            <blockquote className="display mt-4 space-y-2 text-lg leading-8 text-ink">
              {CLOSING_LINES.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </blockquote>
          </section>

          <section aria-label="On-screen text">
            <p className="eyebrow text-gold-text">Every word on screen</p>
            <ul className="mt-4 flex flex-col">
              {ON_SCREEN_TEXT.map((l) => (
                <li
                  key={l.text}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-2.5 first:border-t"
                >
                  <span className="text-[14px] text-ink">{l.text}</span>
                  <span className="text-[11px] tracking-wide text-ink3">{l.where}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-10 border-t-2 border-line pt-5 text-[12.5px] text-ink3">
          An Iltizam film — written, designed and animated in code by the Iltizam team.
        </p>
      </div>
    </main>
  );
}
