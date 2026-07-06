import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { SeverityBadge, TierBadge } from "@/components/badges";
import { gapTierFor } from "@/lib/gaps";
import { formatDate, formatScorePrecise } from "@/lib/format";
import { ANSWER_LABELS, ASSESSMENT_STATUS_LABELS, LEGAL_DISCLAIMER } from "@/lib/types";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function AuditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getAssessmentBundle(id);
  if (!bundle) notFound();
  const { assessment, rows, scores, gaps } = bundle;

  const domains = scores.domainScores;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Screen-only action bar */}
      <div className="print-hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink2">
          <Link href={`/assessments/${assessment.id}`} className="hover:text-ink">
            {assessment.companyName}
          </Link>
          <span className="text-ink3">/</span>
          <span className="font-medium text-ink">Audit report</span>
        </div>
        <div className="flex gap-2">
          <a href={`/api/assessments/${assessment.id}/export`} className="btn" download>
            Export CSV
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Report header */}
      <header className="border-b-2 border-ink pb-5">
        <p className="text-xs font-semibold tracking-widest text-ink3 uppercase">
          Iltzam · Compliance self-assessment report
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{assessment.companyName}</h1>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-ink3">Assessment date</dt>
            <dd className="font-medium">{formatDate(assessment.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink3">Status</dt>
            <dd className="font-medium">{ASSESSMENT_STATUS_LABELS[assessment.status]}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink3">Regimes</dt>
            <dd className="font-medium">{assessment.selectedRegimes.join(" · ")}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink3">Company</dt>
            <dd className="font-medium">
              {[assessment.industry, assessment.country, assessment.companySize]
                .filter(Boolean)
                .join(" · ") || "—"}
            </dd>
          </div>
        </dl>
      </header>

      {/* Scores */}
      <section aria-label="Scores" className="avoid-break mt-6">
        <h2 className="text-lg font-semibold tracking-tight">Readiness summary</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: "Overall readiness", value: scores.readinessScore },
            { label: "Legally mandatory", value: scores.mandatoryScore },
            { label: "Important", value: scores.importantScore },
          ].map((s) => (
            <div key={s.label} className="card px-4 py-3 text-center">
              <div className="text-2xl font-semibold tracking-tight">
                {formatScorePrecise(s.value)}
              </div>
              <div className="mt-0.5 text-xs text-ink2">{s.label}</div>
            </div>
          ))}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
          <div className="flex justify-between sm:block">
            <dt className="text-xs text-ink3">Controls answered</dt>
            <dd className="font-medium">
              {scores.answeredControls} / {scores.totalControls}
            </dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-xs text-ink3">Mandatory gaps (No)</dt>
            <dd className="font-medium">{scores.mandatoryGaps}</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-xs text-ink3">Important gaps (No)</dt>
            <dd className="font-medium">{scores.importantGaps}</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-xs text-ink3">Yes answers missing evidence</dt>
            <dd className="font-medium">{scores.controlsMissingEvidence}</dd>
          </div>
        </dl>
      </section>

      {/* Domain table */}
      <section aria-label="Readiness by area" className="avoid-break mt-8">
        <h2 className="text-lg font-semibold tracking-tight">Readiness by area</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line2 text-left text-xs text-ink2">
                <th className="py-2 pr-3 font-medium">Area</th>
                <th className="px-3 py-2 text-right font-medium">Readiness</th>
                <th className="px-3 py-2 text-right font-medium">Controls</th>
                <th className="px-3 py-2 text-right font-medium">Yes</th>
                <th className="px-3 py-2 text-right font-medium">Gaps</th>
                <th className="pl-3 py-2 text-right font-medium">Unanswered</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.domain} className="border-b border-line">
                  <td className="py-2 pr-3 font-medium">{d.domain}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatScorePrecise(d.score)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.total}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.compliant}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{d.gaps}</td>
                  <td className="pl-3 py-2 text-right tabular-nums">{d.unanswered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gaps */}
      <section aria-label="Potential gaps" className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Potential gaps ({gaps.length})
        </h2>
        {gaps.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-ink2">
            No potential gaps: every answered control is a Yes with evidence attached or marked
            not applicable.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {gaps.map((gap) => (
              <div key={gap.answerId} className="avoid-break card p-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <TierBadge tier={gap.tier} />
                  <span className="font-mono text-[11px] font-semibold text-ink3">
                    {gap.controlCode}
                  </span>
                  <SeverityBadge severity={gap.severity} />
                  <span className="text-[11px] text-ink3">{gap.regimes.join(" · ")}</span>
                  <span className="ml-auto text-xs font-medium">
                    Answer: {ANSWER_LABELS[gap.answer]}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium leading-6">{gap.question}</p>
                <p className="mt-1 text-xs leading-5 text-ink2">
                  <strong>Next step:</strong> {gap.recommendedAction}{" "}
                  <strong>Evidence needed:</strong> {gap.evidenceExamples.join(", ")}.
                </p>
                <p className="mt-1 text-xs text-ink3">
                  Owner: {gap.ownerName ?? "Unassigned"} · Due: {formatDate(gap.dueDate)} · Status:{" "}
                  {gap.remediationStatus.replace(/_/g, " ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Full control record */}
      <section aria-label="All controls" className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Full control record ({rows.length} controls)
        </h2>
        <p className="mt-1 text-sm text-ink2">
          Every control in scope with its answer, owner and evidence status.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-line2 text-left text-ink2">
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
                      {ANSWER_LABELS[r.answer]}
                      {tier ? ` (P${tier})` : ""}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">{r.ownerName ?? "—"}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {r.evidence.length > 0 ? `${r.evidence.length} item${r.evidence.length === 1 ? "" : "s"}` : "—"}
                    </td>
                    <td className="max-w-xs py-2 pl-2 leading-5">{r.notes ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-8 border-t border-line pt-4">
        <p className="text-xs leading-5 text-ink3">{LEGAL_DISCLAIMER}</p>
        <p className="mt-1 text-xs text-ink3">
          Generated by Iltzam on {formatDate(new Date())}. Scores reflect self-reported answers
          ({scores.mode === "answers" ? "answer-based scoring" : "evidence-based scoring"}) and
          indicate readiness, not legal certification.
        </p>
      </footer>
    </main>
  );
}
