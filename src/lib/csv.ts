// CSV export — pure string building so it can be unit-tested without HTTP.
// The file has three sections (summary, domain scores, full control detail),
// separated by blank lines; spreadsheet apps open it as one readable sheet.

import type { AssessmentBundle } from "./assessments";
import {
  ANSWER_LABELS,
  ASSESSMENT_STATUS_LABELS,
  REMEDIATION_STATUS_LABELS,
  SEVERITY_LABELS,
  LEGAL_DISCLAIMER,
} from "./types";
import { gapTierFor, GAP_TIER_LABELS } from "./gaps";

export function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(csvEscape).join(",");
}

function formatDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

function formatScore(score: number | null): string {
  return score === null ? "Not scorable" : `${score}%`;
}

export function buildAssessmentCsv(bundle: AssessmentBundle): string {
  const { assessment, rows, scores } = bundle;
  const lines: string[] = [];

  lines.push(row("Iltzam compliance self-assessment export"));
  lines.push(row("Company", assessment.companyName));
  lines.push(row("Company size", assessment.companySize ?? ""));
  lines.push(row("Industry", assessment.industry ?? ""));
  lines.push(row("Country", assessment.country ?? ""));
  lines.push(row("Regimes", assessment.selectedRegimes.join(" · ")));
  lines.push(row("Assessment status", ASSESSMENT_STATUS_LABELS[assessment.status]));
  lines.push(row("Assessment created", formatDate(assessment.createdAt)));
  lines.push(row("Exported", formatDate(new Date())));
  lines.push(row("Readiness score", formatScore(scores.readinessScore)));
  lines.push(row("Mandatory readiness", formatScore(scores.mandatoryScore)));
  lines.push(row("Important readiness", formatScore(scores.importantScore)));
  lines.push(row("Controls", scores.totalControls));
  lines.push(row("Answered", scores.answeredControls));
  lines.push(row("Mandatory gaps (answered No)", scores.mandatoryGaps));
  lines.push(row("Important gaps (answered No)", scores.importantGaps));
  lines.push(row("Unanswered controls", scores.unansweredControls));
  lines.push(row("Controls missing evidence", scores.controlsMissingEvidence));
  lines.push(row("Note", LEGAL_DISCLAIMER));
  lines.push("");

  lines.push(row("Domain", "Readiness", "Controls", "Applicable", "Compliant", "Gaps", "Unanswered"));
  for (const d of scores.domainScores) {
    lines.push(
      row(d.domain, formatScore(d.score), d.total, d.applicable, d.compliant, d.gaps, d.unanswered)
    );
  }
  lines.push("");

  lines.push(
    row(
      "Control code",
      "Regulation",
      "Legal basis",
      "Domain",
      "Question",
      "Severity",
      "Answer",
      "Gap priority",
      "Owner",
      "Owner email",
      "Due date",
      "Remediation status",
      "Evidence count",
      "Evidence items",
      "Notes",
      "Recommended next step",
      "Evidence needed"
    )
  );
  for (const r of rows) {
    const tier = gapTierFor({
      severity: r.severity,
      answer: r.answer,
      evidenceCount: r.evidence.length,
      requiresEvidence: r.requiresEvidence,
    });
    lines.push(
      row(
        r.controlCode,
        r.sourceRegulationCode,
        r.legalBasis,
        r.domain,
        r.question,
        SEVERITY_LABELS[r.severity],
        ANSWER_LABELS[r.answer],
        tier === null ? "" : `P${tier} — ${GAP_TIER_LABELS[tier]}`,
        r.ownerName,
        r.ownerEmail,
        formatDate(r.dueDate),
        REMEDIATION_STATUS_LABELS[r.remediationStatus],
        r.evidence.length,
        r.evidence.map((e) => e.fileName).join(" | "),
        r.notes,
        r.recommendedAction,
        r.evidenceExamples.join(" | ")
      )
    );
  }

  return lines.join("\r\n") + "\r\n";
}
