// Readiness scoring — pure functions, no database access.
//
// Scoring rules (MVP is answer-based; evidence-based is available behind the
// `mode` option so it can become the default once evidence workflows mature):
//   yes            → compliant
//   no             → gap
//   not_answered   → incomplete (counts against the score)
//   not_applicable → excluded from the denominator entirely
//
// A score is a percentage of applicable controls that are compliant. When no
// controls are applicable the score is null ("not scorable"), never 0 or 100.

import type { AnswerValue, Severity } from "./types";

export type ScoringMode = "answers" | "evidence";

/** The slice of a control + its answer that scoring needs. */
export interface ScorableControl {
  controlCode: string;
  domain: string;
  domainOrder: number;
  severity: Severity;
  answer: AnswerValue;
  /** Number of evidence items attached to the answer. */
  evidenceCount: number;
  /** Whether the control expects evidence to be considered fully ready. */
  requiresEvidence: boolean;
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

export interface ScoreSummary {
  mode: ScoringMode;
  /** % of applicable controls compliant, all severities. Null if none applicable. */
  readinessScore: number | null;
  /** % of applicable legally-mandatory controls compliant. */
  mandatoryScore: number | null;
  /** % of applicable important controls compliant. */
  importantScore: number | null;
  totalControls: number;
  applicableControls: number;
  answeredControls: number; // any explicit answer, incl. not_applicable
  unansweredControls: number;
  compliantControls: number;
  mandatoryGaps: number; // legally mandatory, answered "no"
  importantGaps: number; // important, answered "no"
  /** Controls answered "yes" that expect evidence but have none attached. */
  controlsMissingEvidence: number;
  domainScores: DomainScore[];
}

function isCompliant(c: ScorableControl, mode: ScoringMode): boolean {
  if (c.answer !== "yes") return false;
  if (mode === "answers") return true;
  return !c.requiresEvidence || c.evidenceCount > 0;
}

function percentage(compliant: number, applicable: number): number | null {
  if (applicable === 0) return null;
  return Math.round((compliant / applicable) * 1000) / 10;
}

function scoreSubset(controls: ScorableControl[], mode: ScoringMode): number | null {
  const applicable = controls.filter((c) => c.answer !== "not_applicable");
  return percentage(applicable.filter((c) => isCompliant(c, mode)).length, applicable.length);
}

export function computeScores(
  controls: ScorableControl[],
  options: { mode?: ScoringMode } = {}
): ScoreSummary {
  const mode = options.mode ?? "answers";

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
    .sort((a, b) => a.domainOrder - b.domainOrder);

  return {
    mode,
    readinessScore: percentage(compliant.length, applicable.length),
    mandatoryScore: scoreSubset(mandatory, mode),
    importantScore: scoreSubset(important, mode),
    totalControls: controls.length,
    applicableControls: applicable.length,
    answeredControls: controls.filter((c) => c.answer !== "not_answered").length,
    unansweredControls: controls.filter((c) => c.answer === "not_answered").length,
    compliantControls: compliant.length,
    mandatoryGaps: mandatory.filter((c) => c.answer === "no").length,
    importantGaps: important.filter((c) => c.answer === "no").length,
    controlsMissingEvidence: controls.filter(
      (c) => c.answer === "yes" && c.requiresEvidence && c.evidenceCount === 0
    ).length,
    domainScores,
  };
}
