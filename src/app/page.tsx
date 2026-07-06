import Link from "next/link";
import { listAssessments } from "@/lib/assessments";
import { AssessmentStatusBadge, RegimeBadge, TierBadge } from "@/components/badges";
import { EmptyState } from "@/components/EmptyState";
import { RadialScore, ScoreMeter } from "@/components/meters";
import { formatDate, formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    step: "01",
    title: "Decide each control",
    body: "64 plain-language controls across 14 domains — written for operators, not lawyers.",
  },
  {
    step: "02",
    title: "See your position",
    body: "Readiness split by legal weight, with mandatory exposure surfaced first.",
  },
  {
    step: "03",
    title: "Assign and evidence",
    body: "Every gap gets an owner, a due date, a next action and an evidence slot.",
  },
  {
    step: "04",
    title: "Show your work",
    body: "A gap analysis and audit report your management or counsel can read as-is.",
  },
];

const ARTIFACTS = [
  {
    title: "Gap analysis",
    body: "Every potential gap in priority order — mandatory exposure first, with owners and next actions.",
  },
  {
    title: "Audit-readiness report",
    body: "A letterhead document of your position: scores, domain breakdown, evidence status, full control record.",
  },
  {
    title: "Evidence record",
    body: "Policies, registers, logs and agreements attached against the controls they prove.",
  },
];

/** A miniature of the real dashboard, rendered with sample data. */
function ReadinessPreview() {
  return (
    <div aria-hidden className="sheet !rounded-2xl p-5 text-ink sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow text-gold-text">Readiness position</p>
        <span className="tag tag-outline">Sample data</span>
      </div>
      <div className="mt-4 flex items-center gap-6">
        <RadialScore value={68} label="Overall readiness" size={128} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-medium text-ink2">Mandatory readiness</span>
            <span className="font-semibold tabular-nums">54%</span>
          </div>
          <ScoreMeter value={54} className="mt-1.5" trackClassName="h-1.5" />
          <div className="mt-3 flex items-baseline justify-between text-[13px]">
            <span className="font-medium text-ink2">Important readiness</span>
            <span className="font-semibold tabular-nums">80%</span>
          </div>
          <ScoreMeter value={80} className="mt-1.5" trackClassName="h-1.5" />
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
        {[
          { label: "Mandatory gaps", value: "3", tone: "text-crit-text" },
          { label: "Decision pending", value: "12", tone: "text-ink" },
          { label: "Evidence required", value: "5", tone: "text-warn-text" },
        ].map((s) => (
          <div key={s.label}>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              {s.label}
            </dt>
            <dd className={`mt-0.5 text-xl font-semibold tabular-nums ${s.tone}`}>{s.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-md border border-line bg-surface2/50 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold">BRE-02</span>
          <TierBadge tier={1} />
        </div>
        <p className="mt-1.5 text-[13px] leading-5 text-ink2">
          Prepare the regulator notification template now — the 72-hour clock starts when anyone
          becomes aware.
        </p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const assessments = await listAssessments();

  return (
    <main className="pb-16">
      {/* ── Hero: statement + product preview ─────────────────────────────── */}
      <header className="band">
        <div className="shell grid items-center gap-x-16 gap-y-10 pt-12 pb-24 sm:pt-14 lg:grid-cols-[7fr_5fr] lg:pb-28">
          <div>
            <p className="eyebrow text-gold-bright">Compliance readiness · EG-PDPL & EU-GDPR</p>
            <h1 className="display mt-4 max-w-2xl text-4xl leading-[1.15] font-semibold sm:text-[44px]">
              Turn privacy obligations into accountable control work.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-8 text-brand-muted">
              Iltzam maps your readiness across mandatory duties, evidence, owners and regulatory
              gaps — so you walk into any audit, review or regulator conversation with your
              position documented.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/assessments/new" className="btn btn-primary !px-6 !py-2.5 !text-[15px]">
                Begin readiness review
              </Link>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-brand-muted underline-offset-4 hover:text-brand-ink hover:underline"
              >
                How a review runs
              </a>
            </div>
            <p className="mt-5 max-w-xl text-[12.5px] leading-5 text-brand-muted/80">
              Readiness is not certification. It is a documented view of what is complete, what is
              missing, and what is ready for legal review.
            </p>
          </div>
          <ReadinessPreview />
        </div>
      </header>

      <div className="shell relative -mt-16">
        {/* ── How a review runs ─────────────────────────────────────────────── */}
        <section id="how-it-works" aria-label="How a review runs" className="sheet scroll-mt-24 px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="eyebrow text-gold-text">How a review runs</p>
            <span className="text-xs text-ink3">
              64 controls · 14 domains · 54 legally mandatory · 10 important
            </span>
          </div>
          <ol className="relative mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* connecting rule */}
            <span aria-hidden className="absolute -top-0.5 right-0 left-0 hidden h-px bg-line lg:block" />
            {STEPS.map((p) => (
              <li key={p.step} className="relative lg:pt-5">
                <span
                  aria-hidden
                  className="absolute -top-[5px] left-0 hidden h-2.5 w-2.5 rounded-full border-2 border-gold bg-surface lg:block"
                />
                <span className="display text-2xl text-gold-text">{p.step}</span>
                <h3 className="mt-1.5 text-sm font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-ink2">{p.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-9 border-t-2 border-line pt-6">
            <p className="eyebrow text-gold-text">What a review produces</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {ARTIFACTS.map((a) => (
                <div key={a.title} className="rounded-md border border-line bg-surface2/40">
                  <div className="border-b border-line px-4 py-2.5">
                    <h3 className="display text-[15px] font-semibold">{a.title}</h3>
                  </div>
                  <p className="px-4 py-3 text-[13px] leading-6 text-ink2">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Assessments ledger ────────────────────────────────────────────── */}
        <section aria-label="Assessments" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-gold-text">Your assessments</p>
              <h2 className="display mt-2 text-2xl font-semibold">Reviews in progress</h2>
            </div>
            {assessments.length > 0 ? (
              <Link href="/assessments/new" className="btn">
                New review
              </Link>
            ) : null}
          </div>

          {assessments.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No reviews opened yet"
                body="Start your first readiness review to map controls, evidence, owners, and potential gaps. Begin with the highest-risk domains first — the review guides you through all 14."
                action={
                  <Link href="/assessments/new" className="btn btn-primary">
                    Begin readiness review
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
                    className="group grid items-center gap-x-8 gap-y-3 px-2 py-5 transition-colors hover:bg-surface/70 sm:grid-cols-[minmax(220px,2fr)_minmax(200px,2fr)_auto]"
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
                          {a.answeredControls} of {a.totalControls} controls decided
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
