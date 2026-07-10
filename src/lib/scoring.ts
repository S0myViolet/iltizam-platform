// Readiness scoring — the single deterministic scoring service. Pure
// functions, no database access, no AI anywhere in the path. Same input ⇒
// same output, always.
//
// Documented formula:
//   yes            → positive control decision
//   no             → confirmed answer gap
//   not_answered   → incomplete (counts against the score)
//   not_applicable → excluded from every denominator
//
//   answer readiness   = yes / applicable
//   evidence readiness = (yes AND (accepted evidence ≥ 1 OR evidence not
//                         required)) / applicable
//   official overall readiness = answer readiness (evidence readiness is
//   reported alongside; both are deterministic)
//
// Scores are percentages rounded to one decimal. When nothing is applicable
// a score is null ("not scorable"), never 0 or 100. Unreviewed monitoring
// findings and AI suggestions have no input into any number here.

import type { AnswerValue, RemediationStatus, Severity } from "./types";

export type ScoringMode = "answers" | "evidence";

/** The slice of a control + its answer that scoring needs. */
export interface ScorableControl {
  controlCode: string;
  domain: string;
  domainOrder: number;
  severity: Severity;
  answer: AnswerValue;
  /** Total evidence items attached (any review status). */
  evidenceCount: number;
  /** Evidence items a human reviewer accepted. */
  acceptedEvidenceCount: number;
  requiresEvidence: boolean;
  /** Regulation codes this control is mapped to (e.g. ["EG-PDPL"]). */
  regulationCodes: string[];
  provisional: boolean;
  ownerName: string | null;
  dueDate: Date | null;
  remediationStatus: RemediationStatus;
}

export interface DomainScore {
  domain: string;
  domainOrder: number;
  score: number | null;
  total: number;
  applicable: number;
  compliant: number;
  gaps: number;
  unanswered: number;
}

export interface RegulationScore {
  regulationCode: string;
  score: number | null;
  mandatoryScore: number | null;
  evidenceScore: number | null;
  total: number;
  applicable: number;
  compliant: number;
  gaps: number;
  unanswered: number;
}

export interface ScoreSummary {
  mode: ScoringMode;
  readinessScore: number | null;
  answerReadiness: number | null;
  evidenceReadiness: number | null;
  mandatoryScore: number | null;
  importantScore: number | null;
  totalControls: number;
  applicableControls: number;
  answeredControls: number;
  unansweredControls: number;
  compliantControls: number;
  mandatoryGaps: number;
  importantGaps: number;
  /** Yes-answered controls that expect evidence but have no ACCEPTED evidence. */
  controlsMissingEvidence: number;
  /** Open items (gap/unanswered/evidence-gap) without an owner. */
  missingOwnerCount: number;
  /** Due date passed and remediation not closed/accepted. */
  overdueCount: number;
  provisionalControls: number;
  domainScores: DomainScore[];
  regulationScores: RegulationScore[];
}

function answerCompliant(c: ScorableControl): boolean {
  return c.answer === "yes";
}

function evidenceCompliant(c: ScorableControl): boolean {
  return c.answer === "yes" && (!c.requiresEvidence || c.acceptedEvidenceCount > 0);
}

function isCompliant(c: ScorableControl, mode: ScoringMode): boolean {
  return mode === "answers" ? answerCompliant(c) : evidenceCompliant(c);
}

export function percentage(compliant: number, applicable: number): number | null {
  if (applicable === 0) return null;
  return Math.round((compliant / applicable) * 1000) / 10;
}

function scoreSubset(controls: ScorableControl[], mode: ScoringMode): number | null {
  const applicable = controls.filter((c) => c.answer !== "not_applicable");
  return percentage(applicable.filter((c) => isCompliant(c, mode)).length, applicable.length);
}

export function isEvidenceGap(c: ScorableControl): boolean {
  return c.answer === "yes" && c.requiresEvidence && c.acceptedEvidenceCount === 0;
}

export function isOpenItem(c: ScorableControl): boolean {
  return c.answer === "no" || c.answer === "not_answered" || isEvidenceGap(c);
}

export function isOverdue(c: ScorableControl, now: Date): boolean {
  return (
    !!c.dueDate &&
    c.dueDate.getTime() < now.getTime() &&
    c.remediationStatus !== "closed" &&
    c.remediationStatus !== "accepted"
  );
}

export function computeScores(
  controls: ScorableControl[],
  options: { mode?: ScoringMode; now?: Date } = {}
): ScoreSummary {
  const mode = options.mode ?? "answers";
  const now = options.now ?? new Date();

  const applicable = controls.filter((c) => c.answer !== "not_applicable");
  const compliant = applicable.filter((c) => isCompliant(c, mode));
  const mandatory = controls.filter((c) => c.severity === "legally_mandatory");
  const important = controls.filter((c) => c.severity === "important");

  const domains = new Map<string, ScorableControl[]>();
  for (const c of controls) {
    const list = domains.get(c.domain) ?? [];
    list.push(c);
    domains.set(c.domain, list);
  }
  const domainScores: DomainScore[] = [...domains.entries()]
    .map(([domain, list]) => {
      const app = list.filter((c) => c.answer !== "not_applicable");
      const comp = app.filter((c) => isCompliant(c, mode));
      return {
        domain,
        domainOrder: list[0].domainOrder,
        score: percentage(comp.length, app.length),
        total: list.length,
        applicable: app.length,
        compliant: comp.length,
        gaps: app.filter((c) => c.answer === "no").length,
        unanswered: app.filter((c) => c.answer === "not_answered").length,
      };
    })
    .sort((a, b) => a.domainOrder - b.domainOrder || a.domain.localeCompare(b.domain));

  const regulationCodes = [...new Set(controls.flatMap((c) => c.regulationCodes))].sort();
  const regulationScores: RegulationScore[] = regulationCodes.map((code) => {
    const list = controls.filter((c) => c.regulationCodes.includes(code));
    const app = list.filter((c) => c.answer !== "not_applicable");
    return {
      regulationCode: code,
      score: percentage(app.filter((c) => answerCompliant(c)).length, app.length),
      mandatoryScore: scoreSubset(list.filter((c) => c.severity === "legally_mandatory"), "answers"),
      evidenceScore: percentage(app.filter((c) => evidenceCompliant(c)).length, app.length),
      total: list.length,
      applicable: app.length,
      compliant: app.filter((c) => answerCompliant(c)).length,
      gaps: app.filter((c) => c.answer === "no").length,
      unanswered: app.filter((c) => c.answer === "not_answered").length,
    };
  });

  return {
    mode,
    readinessScore: percentage(compliant.length, applicable.length),
    answerReadiness: percentage(applicable.filter(answerCompliant).length, applicable.length),
    evidenceReadiness: percentage(applicable.filter(evidenceCompliant).length, applicable.length),
    mandatoryScore: scoreSubset(mandatory, mode),
    importantScore: scoreSubset(important, mode),
    totalControls: controls.length,
    applicableControls: applicable.length,
    answeredControls: controls.filter((c) => c.answer !== "not_answered").length,
    unansweredControls: controls.filter((c) => c.answer === "not_answered").length,
    compliantControls: compliant.length,
    mandatoryGaps: mandatory.filter((c) => c.answer === "no").length,
    importantGaps: important.filter((c) => c.answer === "no").length,
    controlsMissingEvidence: controls.filter(isEvidenceGap).length,
    missingOwnerCount: controls.filter((c) => isOpenItem(c) && !c.ownerName).length,
    overdueCount: controls.filter((c) => isOverdue(c, now)).length,
    provisionalControls: controls.filter((c) => c.provisional).length,
    domainScores,
    regulationScores,
  };
}
