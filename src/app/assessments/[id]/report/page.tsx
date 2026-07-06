import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { SeverityBadge, TierBadge, ANSWER_STATE_LABELS } from "@/components/badges";
import { SealMark } from "@/components/Wordmark";
import { gapTierFor } from "@/lib/gaps";
import { buildManagementSummary } from "@/lib/summary";
import { formatDate, formatScorePrecise } from "@/lib/format";
import { ASSESSMENT_STATUS_LABELS, LEGAL_DISCLAIMER, REMEDIATION_STATUS_LABELS } from "@/lib/types";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getAssessmentBundle(id);
  if (!bundle) notFound();
  const { assessment, rows, scores, gaps } = bundle;

  const domains = scores.domainScores;
  const summary = buildManagementSummary(assessment.companyName, scores, gaps);

  return (
    <main className="pb-16">
      {/* Screen-only action band */}
      <div className="band print-hidden">
        <div className="shell flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="text-[13px] text-brand-muted">
            <Link href="/" className="hover:text-brand-ink">
              Assessments
            </Link>
            <span aria-hidden> › </span>
            <Link href={`/assessments/${assessment.id}`} className="hover:text-brand-ink">
              {assessment.companyName}
            </Link>
            <span aria-hidden> › </span>
            <span className="text-brand-ink">Audit report</span>
          </div>
          <div className="flex gap-2">
            <a href={`/api/assessments/${assessment.id}/export`} className="btn btn-on-band" download>
              Export CSV
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* The document */}
      <div className="shell mt-8 max-w-4xl">
        <div className="sheet px-6 py-8 sm:px-10 sm:py-10 print:px-0 print:py-0">
          {/* Letterhead */}
          <header className="border-b-2 border-ink pb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="eyebrow text-gold-text">
                  Compliance self-assessment · Audit-readiness report
                </p>
                <h1 className="display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {assessment.companyName}
                </h1>
              </div>
              <SealMark className="mt-1 h-12 w-12 shrink-0 text-gold" />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[11px] tracking-wide text-ink3 uppercase">Assessment date</dt>
                <dd className="mt-0.5 font-medium">{formatDate(assessment.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-ink3 uppercase">Status</dt>
                <dd className="mt-0.5 font-medium">
                  {ASSESSMENT_STATUS_LABELS[assessment.status]}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-ink3 uppercase">Regulatory scope</dt>
                <dd className="mt-0.5 font-medium">{assessment.selectedRegimes.join(" · ")}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-ink3 uppercase">Company</dt>
                <dd className="mt-0.5 font-medium">
                  {[assessment.industry, assessment.country, assessment.companySize]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </dd>
              </div>
            </dl>
          </header>

          {/* Management summary */}
          <section aria-label="Management summary" className="avoid-break mt-8">
            <p className="eyebrow text-gold-text">Management summary</p>
            <p className="display mt-3 text-[17px] leading-8">{summary}</p>
          </section>

          {/* Readiness */}
          <section aria-label="Readiness position" className="avoid-break mt-10">
            <h2 className="display text-xl font-semibold tracking-tight">Readiness position</h2>
            <div className="mt-4 grid grid-cols-3 divide-x divide-line border-y-2 border-line">
              {[
                { label: "Overall readiness", value: scores.readinessScore },
                { label: "Legally mandatory", value: scores.mandatoryScore },
                { label: "Important", value: scores.importantScore },
              ].map((s) => (
                <div key={s.label} className="px-4 py-5 text-center first:pl-0 last:pr-0">
                  <div className="display text-4xl font-semibold tracking-tight tabular-nums">
                    {formatScorePrecise(s.value)}
                  </div>
                  <div className="mt-1.5 text-xs text-ink2">{s.label}</div>
                </div>
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[11px] tracking-wide text-ink3 uppercase">Controls answered</dt>
                <dd className="mt-0.5 font-medium tabular-nums">
                  {scores.answeredControls} / {scores.totalControls}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-ink3 uppercase">Mandatory gaps</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{scores.mandatoryGaps}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-ink3 uppercase">Important gaps</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{scores.importantGaps}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-ink3 uppercase">Evidence required</dt>
                <dd className="mt-0.5 font-medium tabular-nums">
                  {scores.controlsMissingEvidence}
                </dd>
              </div>
            </dl>
          </section>

          {/* Domain table */}
          <section aria-label="Readiness by area" className="avoid-break mt-10">
            <h2 className="display text-xl font-semibold tracking-tight">Readiness by area</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-ink text-left text-[11px] tracking-wide text-ink2 uppercase">
                    <th className="py-2 pr-3 font-medium">Area</th>
                    <th className="px-3 py-2 text-right font-medium">Readiness</th>
                    <th className="px-3 py-2 text-right font-medium">Controls</th>
                    <th className="px-3 py-2 text-right font-medium">Yes</th>
                    <th className="px-3 py-2 text-right font-medium">Gaps</th>
                    <th className="py-2 pl-3 text-right font-medium">Awaiting</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((d) => (
                    <tr key={d.domain} className="border-b border-line">
                      <td className="py-2.5 pr-3 font-medium">{d.domain}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatScorePrecise(d.score)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{d.total}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{d.compliant}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{d.gaps}</td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">{d.unanswered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Gaps */}
          <section aria-label="Potential gaps" className="mt-10">
            <h2 className="display text-xl font-semibold tracking-tight">
              Potential gaps ({gaps.length})
            </h2>
            {gaps.length === 0 ? (
              <p className="mt-2 text-sm leading-6 text-ink2">
                No potential gaps: every answered control is a Yes with evidence collected or
                marked not applicable.
              </p>
            ) : (
              <div className="mt-4 flex flex-col divide-y divide-line border-y border-line">
                {gaps.map((gap) => (
                  <div key={gap.answerId} className="avoid-break py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TierBadge tier={gap.tier} />
                      <span className="font-mono text-[11px] font-semibold text-ink3">
                        {gap.controlCode}
                      </span>
                      <SeverityBadge severity={gap.severity} />
                      <span className="text-[11px] text-ink3">{gap.regimes.join(" · ")}</span>
                      <span className="ml-auto text-xs font-medium">
                        {ANSWER_STATE_LABELS[gap.answer]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-6">{gap.question}</p>
                    <p className="mt-1 text-xs leading-5 text-ink2">
                      <strong>Next action:</strong> {gap.recommendedAction}{" "}
                      <strong>Evidence needed:</strong> {gap.evidenceExamples.join(", ")}.
                    </p>
                    <p className="mt-1 text-xs text-ink3">
                      Owner: {gap.ownerName ?? "Unassigned"} · Due: {formatDate(gap.dueDate)} ·
                      Status: {REMEDIATION_STATUS_LABELS[gap.remediationStatus]}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Full control record */}
          <section aria-label="All controls" className="mt-10">
            <h2 className="display text-xl font-semibold tracking-tight">
              Full control record ({rows.length} controls)
            </h2>
            <p className="mt-1 text-sm text-ink2">
              Every control in scope with its answer, owner and evidence status.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-ink text-left text-[10px] tracking-wide text-ink2 uppercase">
                    <th className="py-2 pr-2 font-medium">Code</th>
                    <th className="px-2 py-2 font-medium">Control</th>
                    <th className="px-2 py-2 font-medium">Severity</th>
                    <th className="px-2 py-2 font-medium">Answer</th>
                    <th className="px-2 py-2 font-medium">Owner</th>
                    <th className="px-2 py-2 font-medium">Evidence</th>
                    <th className="py-2 pl-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const tier = gapTierFor({
                      severity: r.severity,
                      answer: r.answer,
                      evidenceCount: r.evidence.length,
                      requiresEvidence: r.requiresEvidence,
                    });
                    return (
                      <tr key={r.answerId} className="border-b border-line align-top">
                        <td className="py-2 pr-2 font-mono font-semibold whitespace-nowrap">
                          {r.controlCode}
                        </td>
                        <td className="max-w-md px-2 py-2 leading-5">{r.question}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {r.severity === "legally_mandatory" ? "Mandatory" : "Important"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {ANSWER_STATE_LABELS[r.answer]}
                          {tier ? ` (P${tier})` : ""}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">{r.ownerName ?? "—"}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {r.evidence.length > 0
                            ? `${r.evidence.length} item${r.evidence.length === 1 ? "" : "s"}`
                            : "—"}
                        </td>
                        <td className="max-w-xs py-2 pl-2 leading-5">{r.notes ?? ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-10 border-t-2 border-ink pt-5">
            <p className="text-xs leading-5 text-ink3">{LEGAL_DISCLAIMER}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-ink3">
              <SealMark className="h-4 w-4 text-gold" />
              Prepared with Iltzam on {formatDate(new Date())}. Scores reflect self-reported
              answers and indicate readiness, not legal certification.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
