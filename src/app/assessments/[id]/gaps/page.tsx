import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { GAP_TIER_LABELS, groupGapsByDomain, type GapTier } from "@/lib/gaps";
import { AnswerBadge, RegimeBadge, RemediationBadge, SeverityBadge, TierBadge } from "@/components/badges";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import { LEGAL_DISCLAIMER } from "@/lib/types";

export const dynamic = "force-dynamic";

const TIERS: GapTier[] = [1, 2, 3, 4, 5];

export default async function GapReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getAssessmentBundle(id);
  if (!bundle) notFound();
  const { assessment, gaps, scores } = bundle;

  const tierCounts = TIERS.map((tier) => ({
    tier,
    count: gaps.filter((g) => g.tier === tier).length,
  }));
  const groups = groupGapsByDomain(gaps);
  const notStarted = scores.answeredControls === 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-ink2">
            <Link href={`/assessments/${assessment.id}`} className="hover:text-ink">
              {assessment.companyName}
            </Link>
            <span className="text-ink3">/</span>
            <span className="font-medium text-ink">Gap report</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">What you need to fix</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink2">
            Every potential gap, ordered by how urgent it is: legally mandatory items first, then
            important ones, then Yes answers still waiting on evidence.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/assessments/${assessment.id}/questionnaire?show=gaps`} className="btn">
            Work on gaps
          </Link>
          <Link href={`/assessments/${assessment.id}/report`} className="btn">
            Audit report
          </Link>
        </div>
      </div>

      {/* Priority summary */}
      <section aria-label="Gaps by priority" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tierCounts.map(({ tier, count }) => (
          <div key={tier} className="card px-4 py-3">
            <TierBadge tier={tier} />
            <div className="mt-2 text-2xl font-semibold tracking-tight">{count}</div>
            <p className="mt-0.5 text-[11px] leading-4 text-ink3">{GAP_TIER_LABELS[tier]}</p>
          </div>
        ))}
      </section>

      {gaps.length === 0 ? (
        <div className="mt-6">
          {notStarted ? (
            <EmptyState
              title="Nothing to report yet"
              body="This assessment hasn't been started. Answer the questionnaire and potential gaps will show up here, ordered by priority."
              action={
                <Link
                  href={`/assessments/${assessment.id}/questionnaire`}
                  className="btn btn-primary"
                >
                  Start answering
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="No gaps found"
              body="Every answered control is either a Yes with evidence attached or marked not applicable. Keep the evidence current and revisit when your processing changes."
              action={
                <Link href={`/assessments/${assessment.id}/report`} className="btn btn-primary">
                  View audit report
                </Link>
              }
            />
          )}
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group.domain} aria-label={group.domain}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold tracking-tight">{group.domain}</h2>
                <span className="text-xs text-ink3">
                  {group.gaps.length} gap{group.gaps.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {group.gaps.map((gap) => (
                  <article key={gap.answerId} className="card p-4 sm:p-5">
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

                    <p className="mt-2.5 text-[15px] font-medium leading-6">{gap.question}</p>

                    <div className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold tracking-wide text-ink2">
                          Why this matters
                        </h4>
                        <p className="mt-0.5 text-ink2">{gap.whyItMatters}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold tracking-wide text-ink2">
                          Recommended next step
                        </h4>
                        <p className="mt-0.5 text-ink2">{gap.recommendedAction}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs text-ink3">
                      <span>
                        Evidence needed:{" "}
                        <span className="text-ink2">{gap.evidenceExamples.join(", ")}</span>
                      </span>
                      <span>
                        Owner:{" "}
                        <span className="text-ink2">{gap.ownerName ?? "Unassigned"}</span>
                      </span>
                      <span>
                        Due: <span className="text-ink2">{formatDate(gap.dueDate)}</span>
                      </span>
                      <RemediationBadge status={gap.remediationStatus} />
                      <Link
                        href={`/assessments/${assessment.id}/questionnaire?domain=${encodeURIComponent(gap.domain)}`}
                        className="ml-auto font-medium text-accent-strong hover:underline"
                      >
                        Open in questionnaire →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
          <p className="text-xs leading-5 text-ink3">{LEGAL_DISCLAIMER}</p>
        </div>
      )}
    </main>
  );
}
