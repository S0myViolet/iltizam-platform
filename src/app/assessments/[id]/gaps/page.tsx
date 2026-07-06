import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { GAP_TIER_LABELS, type Gap, type GapTier } from "@/lib/gaps";
import { buildManagementSummary } from "@/lib/summary";
import { AnswerBadge, RegimeBadge, RemediationBadge, SeverityBadge, TierBadge } from "@/components/badges";
import { EmptyState } from "@/components/EmptyState";
import { PageBand } from "@/components/PageBand";
import { formatDate, formatScore } from "@/lib/format";
import { LEGAL_DISCLAIMER } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIERS: GapTier[] = [1, 2, 3, 4, 5];

const SECTIONS: { title: string; blurb: string; tiers: GapTier[] }[] = [
  {
    title: "Mandatory exposure",
    blurb:
      "Named legal duties that are confirmed gaps or still unanswered. These carry direct regulatory exposure — close them first.",
    tiers: [1, 2],
  },
  {
    title: "Important gaps",
    blurb:
      "Controls that prove and support your compliance. A regulator expects them, even where no single article names them.",
    tiers: [3, 4],
  },
  {
    title: "Evidence required",
    blurb:
      "Controls answered Yes that do not yet have supporting evidence. Unevidenced answers will not stand in an audit.",
    tiers: [5],
  },
];

function GapEntry({ gap, assessmentId }: { gap: Gap; assessmentId: string }) {
  return (
    <article
      className={`avoid-break border-l-4 py-4 pl-4 sm:pl-5 ${
        gap.tier === 1 ? "border-l-crit" : gap.tier <= 2 ? "border-l-crit/45" : gap.tier === 5 ? "border-l-gold/60" : "border-l-warn/55"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <TierBadge tier={gap.tier} />
        <span className="font-mono text-[11px] font-semibold tracking-wide text-ink3">
          {gap.controlCode}
        </span>
        <SeverityBadge severity={gap.severity} />
        {gap.regimes.map((code) => (
          <RegimeBadge key={code} code={code} />
        ))}
        <span className="ml-auto">
          <AnswerBadge answer={gap.answer} />
        </span>
      </div>

      <h4 className="mt-2.5 max-w-3xl text-[15px] font-semibold leading-6">{gap.question}</h4>

      <div className="mt-3 grid max-w-4xl gap-x-10 gap-y-3 text-sm leading-6 sm:grid-cols-2">
        <div>
          <h5 className="text-[11px] font-semibold tracking-wide text-ink3 uppercase">
            Why this matters
          </h5>
          <p className="mt-0.5 text-ink2">{gap.whyItMatters}</p>
        </div>
        <div>
          <h5 className="text-[11px] font-semibold tracking-wide text-ink3 uppercase">
            Recommended next action
          </h5>
          <p className="mt-0.5 text-ink2">{gap.recommendedAction}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink3">
        <span>
          Evidence needed: <span className="text-ink2">{gap.evidenceExamples.join(", ")}</span>
        </span>
        <span>
          Owner: <span className="text-ink2">{gap.ownerName ?? "Unassigned"}</span>
        </span>
        <span>
          Due: <span className="text-ink2">{formatDate(gap.dueDate)}</span>
        </span>
        <RemediationBadge status={gap.remediationStatus} />
        <Link
          href={`/assessments/${assessmentId}/questionnaire?domain=${encodeURIComponent(gap.domain)}`}
          className="print-hidden ml-auto font-semibold text-accent-strong hover:underline"
        >
          Open in review →
        </Link>
      </div>
    </article>
  );
}

export default async function GapReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getAssessmentBundle(id);
  if (!bundle) notFound();
  const { assessment, gaps, scores } = bundle;

  const tierCounts = TIERS.map((tier) => ({
    tier,
    count: gaps.filter((g) => g.tier === tier).length,
  }));
  const notStarted = scores.answeredControls === 0;
  const summary = buildManagementSummary(assessment.companyName, scores, gaps);

  return (
    <main className="pb-16">
      <PageBand
        eyebrow="Control gap review"
        title="What stands between you and audit-ready"
        meta={
          <span>
            <Link href="/" className="hover:text-brand-ink">
              Assessments
            </Link>
            <span aria-hidden> › </span>
            <Link href={`/assessments/${assessment.id}`} className="hover:text-brand-ink">
              {assessment.companyName}
            </Link>
            <span aria-hidden> › </span>
            <span className="text-brand-ink">Gap review</span>
          </span>
        }
        lead="Every potential gap in priority order: legally mandatory exposure first, then important controls, then answers still waiting on evidence."
        actions={
          <>
            <Link
              href={`/assessments/${assessment.id}/questionnaire?show=gaps`}
              className="btn btn-primary"
            >
              Work on gaps
            </Link>
            <Link href={`/assessments/${assessment.id}/report`} className="btn btn-on-band">
              Audit report
            </Link>
          </>
        }
      />

      <div className="shell relative -mt-14">
        <div className="sheet px-5 py-6 sm:px-8 sm:py-8">
          {/* Executive summary */}
          <section aria-label="Executive summary">
            <p className="eyebrow text-gold-text">Executive summary</p>
            <p className="display mt-3 max-w-4xl text-[17px] leading-8">{summary}</p>

            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 border-t-2 border-line pt-5 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <dt className="text-[11px] font-medium tracking-wide text-ink3 uppercase">
                  Readiness
                </dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatScore(scores.readinessScore)}
                </dd>
              </div>
              {tierCounts.map(({ tier, count }) => (
                <div key={tier}>
                  <dt className="text-[11px] font-medium tracking-wide text-ink3 uppercase">
                    <TierBadge tier={tier} />
                  </dt>
                  <dd className="mt-1.5 text-2xl font-semibold tabular-nums">{count}</dd>
                  <dd className="mt-0.5 text-[11px] leading-4 text-ink3">
                    {GAP_TIER_LABELS[tier]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {gaps.length === 0 ? (
          <div className="mt-10">
            {notStarted ? (
              <EmptyState
                title="This review has not started yet"
                body="Begin with the highest-risk areas first — Lawful Basis, Security of Processing and Data Subject Rights carry the largest share of legally mandatory controls. Potential gaps will appear here in priority order as you answer."
                action={
                  <Link
                    href={`/assessments/${assessment.id}/questionnaire`}
                    className="btn btn-primary"
                  >
                    Begin the review
                  </Link>
                }
              />
            ) : (
              <EmptyState
                title="No potential gaps on record"
                body="Every answered control is either a Yes with evidence collected or marked not applicable. Review evidence quality before treating areas as ready for audit, and revisit when your processing changes."
                action={
                  <Link href={`/assessments/${assessment.id}/report`} className="btn btn-primary">
                    Open the audit report
                  </Link>
                }
              />
            )}
          </div>
        ) : (
          <div className="mt-12 flex flex-col gap-14">
            {SECTIONS.map((section) => {
              const sectionGaps = gaps.filter((g) => section.tiers.includes(g.tier));
              return (
                <section key={section.title} aria-label={section.title}>
                  <div className="max-w-3xl border-b-2 border-line pb-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="display text-2xl font-semibold tracking-tight">
                        {section.title}
                      </h2>
                      <span className="text-sm text-ink3 tabular-nums">
                        {sectionGaps.length} item{sectionGaps.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-ink2">{section.blurb}</p>
                  </div>

                  {sectionGaps.length === 0 ? (
                    <p className="mt-5 text-sm leading-6 text-ink3">
                      {section.tiers[0] === 1
                        ? "No mandatory exposure on record in the answered controls."
                        : section.tiers[0] === 3
                          ? "No important gaps in this review — review evidence quality before marking these areas ready for audit."
                          : "Every Yes answer has supporting evidence collected."}
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-col divide-y divide-line">
                      {sectionGaps.map((gap) => (
                        <GapEntry key={gap.answerId} gap={gap} assessmentId={assessment.id} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
            <p className="max-w-3xl text-xs leading-5 text-ink3">{LEGAL_DISCLAIMER}</p>
          </div>
        )}
      </div>
    </main>
  );
}
