import Link from "next/link";
import { listAssessments } from "@/lib/assessments";
import { AssessmentStatusBadge, RegimeBadge } from "@/components/badges";
import { EmptyState } from "@/components/EmptyState";
import { ScoreMeter } from "@/components/meters";
import { formatDate, formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

const PROCESS = [
  {
    step: "01",
    title: "Answer in plain language",
    body: "64 yes/no controls across 14 areas — written for operators, not lawyers.",
  },
  {
    step: "02",
    title: "See your position",
    body: "Readiness scores split by legal weight, with mandatory exposure surfaced first.",
  },
  {
    step: "03",
    title: "Close the gaps",
    body: "Every gap gets an owner, a due date, a next action and an evidence slot.",
  },
  {
    step: "04",
    title: "Show your work",
    body: "A client-ready gap review and audit report, exportable for management or counsel.",
  },
];

export default async function HomePage() {
  const assessments = await listAssessments();

  return (
    <main className="pb-16">
      {/* ── Hero band ──────────────────────────────────────────────────────── */}
      <header className="band">
        <div className="shell pt-12 pb-24 sm:pt-16 sm:pb-28">
          <p className="eyebrow text-gold-bright">Compliance readiness · EG-PDPL & EU-GDPR</p>
          <h1 className="display mt-4 max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl">
            Know where you stand before a regulator asks.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-8 text-brand-muted">
            Iltzam turns privacy law into a working control library. Answer plain-language
            questions, see your readiness and your gaps, assign owners, collect evidence — and
            walk into any review with your position documented.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/assessments/new" className="btn btn-primary !px-6 !py-2.5 !text-[15px]">
              Start a compliance review
            </Link>
            <span className="flex items-center gap-2">
              <RegimeBadge code="EG-PDPL" provisional />
              <RegimeBadge code="EU-GDPR" />
            </span>
          </div>
          <p className="mt-4 text-[12px] text-brand-muted/80">
            Built on the GDPR control spine and mapped to Egypt&apos;s PDPL. Readiness scores
            organise your work — they are not legal certification.
          </p>
        </div>
      </header>

      <div className="shell relative -mt-16">
        {/* ── Process sheet ─────────────────────────────────────────────────── */}
        <section aria-label="How a review works" className="sheet px-5 py-7 sm:px-8">
          <ol className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p) => (
              <li key={p.step} className="border-t-2 border-line pt-3">
                <span className="display text-2xl text-gold-text">{p.step}</span>
                <h3 className="mt-2 text-sm font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-ink2">{p.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Assessments ───────────────────────────────────────────────────── */}
        <section aria-label="Assessments" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-gold-text">Your assessments</p>
              <h2 className="display mt-2 text-2xl font-semibold">Reviews in progress</h2>
            </div>
            {assessments.length > 0 ? (
              <Link href="/assessments/new" className="btn">
                New assessment
              </Link>
            ) : null}
          </div>

          {assessments.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No reviews opened yet"
                body="Start your first compliance review. Begin with the highest-risk areas first — the questionnaire will guide you through all 14, and your readiness position builds as you answer."
                action={
                  <Link href="/assessments/new" className="btn btn-primary">
                    Start a compliance review
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="mt-6 flex flex-col">
              {assessments.map((a) => (
                <li key={a.id} className="border-b border-line first:border-t">
                  <Link
                    href={`/assessments/${a.id}`}
                    className="group grid items-center gap-x-8 gap-y-3 px-2 py-5 transition-colors hover:bg-surface2/60 sm:grid-cols-[minmax(220px,2fr)_minmax(200px,2fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="display truncate text-lg font-semibold group-hover:text-accent-strong">
                          {a.companyName}
                        </h3>
                        <AssessmentStatusBadge status={a.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink3">
                        {[a.industry, a.country].filter(Boolean).join(" · ") || "Company details not set"}
                        {" · "}Opened {formatDate(a.createdAt)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between text-xs text-ink3">
                        <span>
                          {a.answeredControls} of {a.totalControls} controls answered
                        </span>
                        <span className="text-sm font-semibold text-ink tabular-nums">
                          {formatScore(a.readinessScore)}
                        </span>
                      </div>
                      <ScoreMeter value={a.readinessScore} className="mt-1.5" trackClassName="h-1.5" />
                    </div>
                    <div className="hidden items-center gap-1.5 sm:flex">
                      {a.selectedRegimes.map((code) => (
                        <RegimeBadge key={code} code={code} />
                      ))}
                      <span aria-hidden className="ml-2 text-ink3 transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
