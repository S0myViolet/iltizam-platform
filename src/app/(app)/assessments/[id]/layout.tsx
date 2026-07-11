// The assessment workspace frame. Every section of a review (dashboard,
// control review, gap analysis, audit report) renders inside this shell:
// a persistent sidebar carrying the company block, section navigation and —
// the heart of daily use — the work queues, each opening the control review
// pre-filtered to the items that need that kind of attention.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { gapTierFor } from "@/lib/gaps";
import { AssessmentStatusBadge } from "@/components/badges";
import { ScoreMeter } from "@/components/meters";
import { WorkspaceNavLinks } from "@/components/WorkspaceNavLinks";
import { requirePageSession, requireAssessmentPage } from "@/lib/page-auth";
import { formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

function isOverdue(dueDate: Date | null, remediationStatus: string): boolean {
  return !!dueDate && remediationStatus !== "closed" && dueDate.getTime() < Date.now();
}

export default async function AssessmentWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requirePageSession();
  await requireAssessmentPage(session, id);
  const bundle = await getAssessmentBundle(id);
  if (!bundle) notFound();
  const { assessment, rows, scores } = bundle;

  const openItems = rows.filter(
    (r) =>
      gapTierFor({
        severity: r.severity,
        answer: r.answer,
        evidenceCount: r.evidence.length,
        requiresEvidence: r.requiresEvidence,
      }) !== null
  );

  const queues = [
    { key: "unanswered", label: "Decisions pending", count: scores.unansweredControls },
    {
      key: "gaps",
      label: "Gaps to remediate",
      count: scores.mandatoryGaps + scores.importantGaps,
      tone: "crit" as const,
    },
    { key: "missing_evidence", label: "Evidence required", count: scores.controlsMissingEvidence },
    { key: "no_owner", label: "Owner unassigned", count: openItems.filter((r) => !r.ownerName).length },
    {
      key: "overdue",
      label: "Overdue",
      count: rows.filter((r) => isOverdue(r.dueDate, r.remediationStatus)).length,
      tone: "crit" as const,
    },
  ];

  return (
    <div className="shell grid items-start gap-x-8 gap-y-5 py-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:py-8">
      {/* ── Workspace sidebar ─────────────────────────────────────────────── */}
      <aside className="min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4">
        {/* Company block */}
        <div className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="display min-w-0 truncate text-[17px] leading-6 font-semibold">
              {assessment.title}
            </h2>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <AssessmentStatusBadge status={assessment.status} />
            <span className="font-mono text-[10px] tracking-wide text-ink3">
              {assessment.selectedRegimes.join(" · ")}
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-xs text-ink3">
            <span>Readiness</span>
            <span className="text-sm font-semibold text-ink tabular-nums">
              {formatScore(scores.readinessScore)}
            </span>
          </div>
          <ScoreMeter value={scores.readinessScore} className="mt-1" trackClassName="h-1.5" />
          <p className="mt-1.5 text-[11px] text-ink3">
            {scores.answeredControls} of {scores.totalControls} controls decided
          </p>
        </div>

        {/* Sections */}
        <nav aria-label="Workspace sections" className="mt-5">
          <p className="eyebrow text-gold-text">Workspace</p>
          <div className="mt-2.5">
            <WorkspaceNavLinks assessmentId={assessment.id} />
          </div>
        </nav>

        {/* Work queues */}
        <nav aria-label="Work queues" className="mt-5 border-t-2 border-line pt-4">
          <p className="eyebrow text-gold-text">Work queues</p>
          <ul className="mt-2.5 flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
            {queues.map((q) => (
              <li key={q.key} className="shrink-0 lg:shrink">
                <Link
                  href={`/assessments/${assessment.id}/questionnaire?show=${q.key}`}
                  className="group flex items-center justify-between gap-3 rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors hover:bg-surface"
                >
                  <span className="font-medium text-ink2 group-hover:text-ink">{q.label}</span>
                  <span
                    className={`min-w-6 rounded-[4px] px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums ${
                      q.count === 0
                        ? "bg-surface2 text-ink3"
                        : q.tone === "crit"
                          ? "bg-crit/10 text-crit-text"
                          : "bg-brand text-brand-ink"
                    }`}
                  >
                    {q.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Report actions */}
        <div className="mt-5 hidden border-t-2 border-line pt-4 lg:block">
          <p className="eyebrow text-gold-text">Reporting</p>
          <div className="mt-2.5 flex flex-col gap-1.5">
            <a
              href={`/api/assessments/${assessment.id}/export`}
              className="btn justify-start !border-transparent !bg-transparent !px-3 !py-1.5 !text-[13px] !font-medium !text-ink2 hover:!bg-surface hover:!text-ink"
              download
            >
              Export CSV
            </a>
            <Link
              href={`/assessments/${assessment.id}/report`}
              className="btn justify-start !border-transparent !bg-transparent !px-3 !py-1.5 !text-[13px] !font-medium !text-ink2 hover:!bg-surface hover:!text-ink"
            >
              Print audit report
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Section content ───────────────────────────────────────────────── */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
