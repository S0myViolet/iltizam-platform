import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { topRiskDomains } from "@/lib/gaps";
import { AssessmentStatusBadge } from "@/components/badges";
import { ScoreMeter } from "@/components/ScoreMeter";
import { StatTile } from "@/components/StatTile";
import { formatDate, formatScore } from "@/lib/format";
import { LEGAL_DISCLAIMER } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AssessmentDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getAssessmentBundle(id);
  if (!bundle) notFound();
  const { assessment, scores, gaps } = bundle;

  const started = scores.answeredControls > 0;
  const remaining = scores.totalControls - scores.answeredControls;
  const riskAreas = topRiskDomains(gaps, 3);
  const openGaps = gaps.filter((g) => g.tier <= 4).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{assessment.companyName}</h1>
            <AssessmentStatusBadge status={assessment.status} />
          </div>
          <p className="mt-1 text-sm text-ink2">
            {[assessment.industry, assessment.country, assessment.companySize && `${assessment.companySize} people`]
              .filter(Boolean)
              .join(" · ") || "Company details not set"}
          </p>
          <p className="mt-0.5 text-xs text-ink3">
            Regimes: {assessment.selectedRegimes.join(" · ")} · Started{" "}
            {formatDate(assessment.createdAt)}
            {assessment.completedAt ? ` · Completed ${formatDate(assessment.completedAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/assessments/${assessment.id}/questionnaire`} className="btn btn-primary">
            {started ? "Continue assessment" : "Start answering"}
          </Link>
          <Link href={`/assessments/${assessment.id}/gaps`} className="btn">
            View gap report
          </Link>
          <Link href={`/assessments/${assessment.id}/report`} className="btn">
            Audit report
          </Link>
          <a href={`/api/assessments/${assessment.id}/export`} className="btn" download>
            Export CSV
          </a>
        </div>
      </div>

      {/* Scores */}
      <section aria-label="Readiness scores" className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Overall readiness"
          value={formatScore(scores.readinessScore)}
          sub={`${scores.compliantControls} of ${scores.applicableControls} applicable controls answered Yes`}
        >
          <ScoreMeter value={scores.readinessScore} className="mt-3" />
        </StatTile>
        <StatTile
          label="Legally mandatory readiness"
          value={formatScore(scores.mandatoryScore)}
          sub="Controls the law names as specific duties"
        >
          <ScoreMeter value={scores.mandatoryScore} className="mt-3" />
        </StatTile>
        <StatTile
          label="Important readiness"
          value={formatScore(scores.importantScore)}
          sub="How you prove and support compliance"
        >
          <ScoreMeter value={scores.importantScore} className="mt-3" />
        </StatTile>
      </section>

      {/* Counters */}
      <section aria-label="Progress counters" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total controls" value={String(scores.totalControls)} />
        <StatTile label="Answered" value={String(scores.answeredControls)} />
        <StatTile label="Remaining" value={String(remaining)} tone={remaining > 0 ? "accent" : "default"} />
        <StatTile
          label="Mandatory gaps"
          value={String(scores.mandatoryGaps)}
          tone={scores.mandatoryGaps > 0 ? "crit" : "good"}
          sub="Answered No"
        />
        <StatTile
          label="Important gaps"
          value={String(scores.importantGaps)}
          tone={scores.importantGaps > 0 ? "warn" : "good"}
          sub="Answered No"
        />
        <StatTile
          label="Evidence missing"
          value={String(scores.controlsMissingEvidence)}
          tone={scores.controlsMissingEvidence > 0 ? "warn" : "default"}
          sub="Yes answers without evidence"
        />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Progress by domain */}
        <section aria-label="Progress by domain" className="card p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Readiness by area</h2>
            <span className="text-xs text-ink3">% of applicable controls answered Yes</span>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {scores.domainScores.map((d) => (
              <li key={d.domain}>
                <Link
                  href={`/assessments/${assessment.id}/questionnaire?domain=${encodeURIComponent(d.domain)}`}
                  className="group block"
                >
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-ink group-hover:text-accent-strong">
                      {d.domain}
                    </span>
                    <span className="shrink-0 text-xs text-ink3">
                      {d.gaps > 0 ? `${d.gaps} gap${d.gaps === 1 ? "" : "s"} · ` : ""}
                      {d.unanswered > 0 ? `${d.unanswered} open · ` : ""}
                      <span className="font-semibold text-ink">{formatScore(d.score)}</span>
                    </span>
                  </div>
                  <ScoreMeter value={d.score} className="mt-1.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Top risks / next steps */}
        <section aria-label="Top risk areas" className="flex flex-col gap-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold">Top risk areas</h2>
            {!started ? (
              <p className="mt-3 text-sm leading-6 text-ink2">
                Answer a few questions first and the riskiest areas will surface here.
              </p>
            ) : riskAreas.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-good-text">
                No potential gaps found so far — keep going, and attach evidence to lock it in.
              </p>
            ) : (
              <ol className="mt-3 flex flex-col gap-3">
                {riskAreas.map((r, i) => (
                  <li key={r.domain} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] font-semibold text-ink2">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-5">{r.domain}</p>
                      <p className="text-xs text-ink3">
                        {r.mandatoryGaps > 0
                          ? `${r.mandatoryGaps} legally mandatory item${r.mandatoryGaps === 1 ? "" : "s"} open`
                          : "No mandatory items open"}
                        {" · "}
                        {r.totalGaps} total
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold">What to do next</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm leading-6 text-ink2">
              {remaining > 0 ? (
                <li>
                  Answer the remaining <strong className="text-ink">{remaining}</strong> controls.
                </li>
              ) : null}
              {openGaps > 0 ? (
                <li>
                  Review <strong className="text-ink">{openGaps}</strong> potential gap
                  {openGaps === 1 ? "" : "s"} and assign owners and due dates.
                </li>
              ) : null}
              {scores.controlsMissingEvidence > 0 ? (
                <li>
                  Attach evidence to <strong className="text-ink">{scores.controlsMissingEvidence}</strong>{" "}
                  control{scores.controlsMissingEvidence === 1 ? "" : "s"} answered Yes.
                </li>
              ) : null}
              {remaining === 0 && openGaps === 0 && scores.controlsMissingEvidence === 0 ? (
                <li>
                  Everything is answered with evidence collected. Export the audit report and
                  schedule your next review.
                </li>
              ) : null}
            </ul>
          </div>

          <p className="px-1 text-xs leading-5 text-ink3">{LEGAL_DISCLAIMER}</p>
        </section>
      </div>
    </main>
  );
}
