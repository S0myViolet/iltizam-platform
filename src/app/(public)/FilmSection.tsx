// The landing page's film section: the "After Submit" poster — Mariam at the
// warm window, light pool, the tiny submit panel — linking to the full film.
import Link from "next/link";
import { FilmPoster } from "@/components/film/scenes";

export function FilmSection() {
  return (
    <section aria-label="The Iltizam film" className="band mt-12 overflow-hidden rounded-2xl border border-brand-line">
      <div className="grid items-stretch lg:grid-cols-[7fr_5fr]">
        <Link
          href="/film"
          className="group relative block aspect-video focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-bright lg:aspect-auto"
          aria-label="Watch After Submit, a 48 second film"
        >
          <FilmPoster className="absolute inset-0 h-full w-full" />
          <span className="absolute inset-0 bg-gradient-to-t from-brand/85 via-transparent to-transparent" />
          <span className="absolute bottom-0 left-0 p-6">
            <span className="display block text-2xl font-semibold text-brand-ink">After Submit</span>
            <span className="mt-1 block text-[11px] tracking-wide text-brand-muted">
              An Iltizam film · 48 seconds
            </span>
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/80 bg-brand/60 transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" aria-hidden="true">
                <path d="M7 4.5 L19 12 L7 19.5 Z" fill="var(--gold-bright)" />
              </svg>
            </span>
          </span>
        </Link>
        <div className="flex flex-col justify-center p-8 lg:p-10">
          <p className="eyebrow text-gold-bright">The Iltizam film</p>
          <h2 className="display mt-3 text-3xl font-semibold text-brand-ink">After Submit</h2>
          <p className="mt-4 max-w-sm text-[15px] leading-7 text-brand-muted">
            {"One application, one request, and the responsibility that begins after “Submit”."}
          </p>
          <div className="mt-6">
            <Link href="/film" className="btn btn-gold-on-band">
              Watch the film · 0:48
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
