import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { topRiskDomains } from "@/lib/gaps";
import { buildManagementSummary, buildPriorityActions, nextReviewDate } from "@/lib/summary";
import { AssessmentStatusBadge, RegimeBadge, TierBadge } from "@/components/badges";
import { CompositionBar, RadialScore, ScoreMeter } from "@/components/meters";
import { PageBand } from "@/components/PageBand";
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
  const riskDomainSet = new Set(riskAreas.map((r) => r.domain));
  const summary = buildManagementSummary(assessment.companyName, scores, gaps);
  const actions = buildPriorityActions(gaps, 4);
  const review = nextReviewDate(gaps);
  const unansweredMandatory = gaps.filter((g) => g.tier === 2).length;

  return (
    <main className="pb-16">
      <PageBand
        eyebrow="Compliance command center"
        title={assessment.companyName}
        meta={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href="/" className="hover:text-brand-ink">
              Assessments
            </Link>
            <span aria-hidden>›</span>
            <span className="text-brand-ink">Dashboard</span>
          </span>
        }
        actions={
          <>
            <Link href={`/assessments/${assessment.id}/questionnaire`} className="btn btn-primary">
              {started ? "Continue the review" : "Begin the review"}
            </Link>
            <Link href={`/assessments/${assessment.id}/gaps`} className="btn btn-on-band">
              Open gap analysis
            </Link>
            <Link href={`/assessments/${assessment.id}/report`} className="btn btn-on-band">
              Audit report
            </Link>
            <a
              href={`/api/assessments/${assessment.id}/export`}
              className="btn btn-on-band"
              download
            >
              Export CSV
            </a>
          </>
        }
      >
        <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px] text-brand-muted">
          <AssessmentStatusBadge status={assessment.status} />
          {assessment.selectedRegimes.map((code) => (
            <RegimeBadge key={code} code={code} />
          ))}
          <span className="ml-1">
            {[assessment.industry, assessment.country, assessment.companySize && `${assessment.companySize} people`]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <span>· Opened {formatDate(assessment.createdAt)}</span>
          {assessment.completedAt ? <span>· Completed {formatDate(assessment.completedAt)}</span> : null}
        </div>
      </PageBand>

      <div className="shell relative -mt-14">
        {/* ── Readiness position ──────────────────────────────────────────── */}
        <section aria-label="Readiness position" className="sheet px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr_minmax(240px,0.9fr)] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <RadialScore
                value={scores.readinessScore}
                label="Overall readiness"
                sublabel={`${scores.compliantControls} of ${scores.applicableControls} applicable controls`}
              />
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-sm font-semibold">Mandatory readiness</h2>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatScore(scores.mandatoryScore)}
                  </span>
                </div>
                <p className="mb-2 text-xs text-ink3">
                  Duties the law names specifically — the exposure that matters first.
                </p>
                <ScoreMeter value={scores.mandatoryScore} />
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-sm font-semibold">Important readiness</h2>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatScore(scores.importantScore)}
                  </span>
                </div>
                <p className="mb-2 text-xs text-ink3">
                  How you prove and support compliance — policies, registers, training.
                </p>
                <ScoreMeter value={scores.importantScore} />
              </div>
              <p className="text-xs leading-5 text-ink3">
                Readiness is the share of applicable controls answered Yes. Not-applicable
                controls are excluded; unanswered controls count against the score.
              </p>
            </div>

            {/* Regulatory exposure */}
            <div className="rounded-xl border border-crit/20 bg-crit/[0.04] p-5">
              <p className="eyebrow text-crit-text">Regulatory exposure</p>
              <dl className="mt-4 flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-ink2">Mandatory gaps confirmed</dt>
                  <dd className="text-xl font-semibold text-crit-text tabular-nums">
                    {scores.mandatoryGaps}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-ink2">Mandatory controls unanswered</dt>
                  <dd className="text-xl font-semibold tabular-nums">{unansweredMandatory}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[13px] text-ink2">Evidence required</dt>
                  <dd className="text-xl font-semibold text-warn-text tabular-nums">
                    {scores.controlsMissingEvidence}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                  <dt className="text-[13px] text-ink2">Next review date</dt>
                  <dd className="text-sm font-semibold">
                    {review ? formatDate(review) : "Not scheduled"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Management summary */}
          <div className="mt-8 border-t-2 border-line pt-5">
            <p className="eyebrow text-gold-text">Management summary</p>
            <p className="display mt-3 max-w-4xl text-[17px] leading-8 text-ink">{summary}</p>
          </div>
        </section>

        {/* ── Priority actions + domain health ────────────────────────────── */}
        <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(300px,5fr)_7fr]">
          <section aria-label="Priority actions" className="panel">
            <p className="eyebrow text-gold-text">Priority actions</p>
            {actions.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-ink2">
                {started
                  ? "No open actions. Review evidence quality before marking areas ready for audit."
                  : "Begin the review to surface the actions that matter most."}
              </p>
            ) : (
              <ol className="mt-4 flex flex-col">
                {actions.map((a, i) => (
                  <li
                    key={a.controlCode + a.tier}
                    className="flex gap-4 border-b border-line py-4 first:pt-1 last:border-b-0"
                  >
                    <span className="display mt-0.5 text-xl leading-none text-line2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-ink3">
                          {a.controlCode}
                        </span>
                        <TierBadge tier={a.tier} />
                      </div>
                      <p className="mt-1.5 text-sm leading-6">{a.action}</p>
                      <p className="mt-1 text-xs text-ink3">
                        {a.domain} · {a.ownerName ? `Owner: ${a.ownerName}` : "No owner assigned"}
                        {a.dueDate ? ` · Due ${formatDate(a.dueDate)}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {gaps.length > actions.length ? (
              <Link
                href={`/assessments/${assessment.id}/gaps`}
                className="mt-3 inline-block text-sm font-medium text-accent-strong hover:underline"
              >
                Open the full gap analysis — {gaps.length} items →
              </Link>
            ) : null}

            {riskAreas.length > 0 ? (
              <div className="mt-10">
                <p className="eyebrow text-crit-text">Top risk areas</p>
                <ol className="mt-4 flex flex-col gap-3">
                  {riskAreas.map((r, i) => (
                    <li key={r.domain} className="flex items-start gap-3">
                      <span className="display mt-0.5 text-xl leading-none text-line2">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm font-semibold leading-5">{r.domain}</p>
                        <p className="mt-0.5 text-xs text-ink3">
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
              </div>
            ) : null}
          </section>

          <section aria-label="Control health by area" className="panel">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="eyebrow text-gold-text">Control health by area</p>
              <span className="flex items-center gap-4 text-[11px] text-ink3">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-accent" /> Answered Yes
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-crit" /> Marked as gap
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-line2" /> Awaiting answer
                </span>
              </span>
            </div>
            <ul className="mt-4 flex flex-col">
              {scores.domainScores.map((d) => {
                const isRisk = riskDomainSet.has(d.domain);
                return (
                  <li key={d.domain} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/assessments/${assessment.id}/questionnaire?domain=${encodeURIComponent(d.domain)}`}
                      className={`group block py-3.5 pr-2 transition-colors hover:bg-surface2/60 ${
                        isRisk ? "border-l-[3px] border-l-crit pl-3" : "pl-[15px]"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-semibold group-hover:text-accent-strong">
                          {d.domain}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatScore(d.score)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <CompositionBar
                          compliant={d.compliant}
                          gaps={d.gaps}
                          unanswered={d.unanswered}
                          className="max-w-xs"
                        />
                        <span className="hidden text-[11px] whitespace-nowrap text-ink3 sm:inline">
                          {d.gaps > 0 ? `${d.gaps} gap${d.gaps === 1 ? "" : "s"} · ` : ""}
                          {d.unanswered > 0 ? `${d.unanswered} awaiting · ` : ""}
                          {d.total} controls
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs leading-5 text-ink3">
              {remaining > 0
                ? `${remaining} control${remaining === 1 ? "" : "s"} still to answer. Open any area to continue the review from there.`
                : "Every control is answered. Review evidence quality before treating an area as audit-ready."}
            </p>
          </section>
        </div>

        <p className="mt-12 max-w-3xl text-xs leading-5 text-ink3">{LEGAL_DISCLAIMER}</p>
      </div>
    </main>
  );
}
