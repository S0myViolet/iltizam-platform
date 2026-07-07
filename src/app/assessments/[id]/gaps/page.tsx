import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentBundle, summarizeByRegulation } from "@/lib/assessments";
import { GAP_TIER_LABELS, type Gap, type GapTier } from "@/lib/gaps";
import { buildManagementSummary } from "@/lib/summary";
import { AnswerBadge, RemediationBadge, SeverityBadge, TierBadge } from "@/components/badges";
import { EmptyState } from "@/components/EmptyState";
import { formatDate, formatScore } from "@/lib/format";
import { LEGAL_DISCLAIMER } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIERS: GapTier[] = [1, 2, 3, 4, 5];

const SECTIONS: { title: string; blurb: string; tiers: GapTier[] }[] = [
  {
    title: "Mandatory exposure",
    blurb:
      "Named legal duties that are confirmed gaps or still undecided. These carry direct regulatory exposure — close them first.",
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
        gap.tier === 1
          ? "border-l-crit"
          : gap.tier <= 2
            ? "border-l-crit/45"
            : gap.tier === 5
              ? "border-l-gold/60"
              : "border-l-warn/55"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <TierBadge tier={gap.tier} />
        <span className="font-mono text-[11px] font-semibold tracking-wide text-ink3">
          {gap.controlCode}
        </span>
        <SeverityBadge severity={gap.severity} />
        <span className="font-mono text-[10.5px] tracking-wide text-ink3">
          {gap.sourceRegulationCode} · {gap.legalBasis}
        </span>
        <span className="ml-auto">
          <AnswerBadge answer={gap.answer} />
        </span>
      </div>

      <h4 className="mt-2.5 max-w-3xl text-[15px] leading-6 font-semibold">{gap.question}</h4>

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
  const regulationScores = summarizeByRegulation(bundle.rows, gaps);

  const tierCounts = TIERS.map((tier) => ({
    tier,
    count: gaps.filter((g) => g.tier === tier).length,
  }));
  const notStarted = scores.answeredControls === 0;
  const summary = buildManagementSummary(assessment.companyName, scores, gaps);

  return (
    <main>
      {/* Section header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-4">
        <div>
          <h1 className="display text-2xl font-semibold tracking-tight">Gap analysis</h1>
          <p className="mt-0.5 text-[13px] text-ink3">
            Every potential gap in priority order — mandatory exposure first, then important
            controls, then answers waiting on evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/assessments/${assessment.id}/questionnaire?show=gaps`}
            className="btn btn-primary !py-1.5 !text-[13px]"
          >
            Work on gaps
          </Link>
          <Link href={`/assessments/${assessment.id}/report`} className="btn !py-1.5 !text-[13px]">
            Audit report
          </Link>
        </div>
      </header>

      {/* Executive summary */}
      <section aria-label="Executive summary" className="card mt-5 p-5 sm:p-6">
        <p className="eyebrow text-gold-text">Executive summary</p>
        <p className="display mt-2.5 max-w-4xl text-[16px] leading-7">{summary}</p>
        {regulationScores.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-[13px] text-ink2">
            {regulationScores.map((rs) => (
              <li key={rs.code}>
                <span className="font-mono text-[11.5px] font-bold">{rs.code}</span> readiness{" "}
                <strong className="text-ink tabular-nums">
                  {formatScore(rs.scores.readinessScore)}
                </strong>
                {" · "}
                {rs.scores.mandatoryGaps} mandatory gap{rs.scores.mandatoryGaps === 1 ? "" : "s"}
                {" · "}
                {rs.scores.unansweredControls} pending
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 border-t-2 border-line pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <dt className="text-[11px] font-medium tracking-wide text-ink3 uppercase">Readiness</dt>
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
              <dd className="mt-0.5 text-[11px] leading-4 text-ink3">{GAP_TIER_LABELS[tier]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {gaps.length === 0 ? (
        <div className="mt-8">
          {notStarted ? (
            <EmptyState
              title="This review has not started yet"
              body="Begin with the highest-risk domains first — Lawful Basis, Security of Processing and Data Subject Rights carry the largest share of legally mandatory controls. Potential gaps will appear here in priority order as you decide controls."
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
              body="Every decided control is either a Yes with evidence collected or marked not applicable. Review evidence quality before treating domains as ready for audit, and revisit when your processing changes."
              action={
                <Link href={`/assessments/${assessment.id}/report`} className="btn btn-primary">
                  Open the audit report
                </Link>
              }
            />
          )}
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          {SECTIONS.map((section) => {
            const sectionGaps = gaps.filter((g) => section.tiers.includes(g.tier));
            return (
              <section key={section.title} aria-label={section.title}>
                <div className="max-w-3xl border-b-2 border-line pb-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="display text-xl font-semibold tracking-tight">
                      {section.title}
                    </h2>
                    <span className="text-sm text-ink3 tabular-nums">
                      {sectionGaps.length} item{sectionGaps.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-ink2">{section.blurb}</p>
                </div>

                {sectionGaps.length === 0 ? (
                  <p className="mt-4 text-sm leading-6 text-ink3">
                    {section.tiers[0] === 1
                      ? "No mandatory exposure on record in the decided controls."
                      : section.tiers[0] === 3
                        ? "No important gaps in this review — review evidence quality before marking these domains ready for audit."
                        : "Every Yes answer has supporting evidence collected."}
                  </p>
                ) : (
                  <div className="mt-1 flex flex-col divide-y divide-line">
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
    </main>
  );
}
