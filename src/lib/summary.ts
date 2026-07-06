// Management-facing derivations: the plain-language executive summary and
// the priority-action list. Pure functions over the assessment bundle.

import type { Gap } from "./gaps";
import { topRiskDomains } from "./gaps";
import type { ScoreSummary } from "./scoring";

function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function describeMandatoryPosture(score: number | null): string {
  if (score === null) return "Mandatory readiness is not yet scorable";
  if (score < 40) return "Mandatory readiness is low";
  if (score < 75) return "Mandatory readiness is developing";
  if (score < 100) return "Mandatory readiness is strong";
  return "All applicable mandatory controls are answered Yes";
}

/**
 * A short, client-ready narrative of the current position — the paragraph a
 * compliance lead could paste into a management update.
 */
export function buildManagementSummary(
  companyName: string,
  scores: ScoreSummary,
  gaps: Gap[]
): string {
  const sentences: string[] = [];

  if (scores.answeredControls === 0) {
    return `${companyName} has not started this assessment. Begin with the highest-risk areas — Lawful Basis, Security of Processing and Data Subject Rights carry the largest share of legally mandatory controls.`;
  }

  sentences.push(
    `${companyName} has completed ${scores.answeredControls} of ${scores.totalControls} controls, with an overall readiness of ${
      scores.readinessScore === null ? "—" : `${Math.round(scores.readinessScore)}%`
    } across applicable controls.`
  );

  const risk = topRiskDomains(gaps, 3);
  if (risk.length > 0) {
    sentences.push(
      `${describeMandatoryPosture(scores.mandatoryScore)}, with priority attention needed in ${listNames(risk.map((r) => r.domain))}.`
    );
  } else {
    sentences.push(`${describeMandatoryPosture(scores.mandatoryScore)}, and no open gaps remain in the answered controls.`);
  }

  const next: string[] = [];
  if (scores.unansweredControls > 0) {
    next.push(`complete the ${scores.unansweredControls} unanswered control${scores.unansweredControls === 1 ? "" : "s"}`);
  }
  const answeredNo = scores.mandatoryGaps + scores.importantGaps;
  if (answeredNo > 0) {
    next.push(`assign owners and dates to the ${answeredNo} confirmed gap${answeredNo === 1 ? "" : "s"}`);
  }
  if (scores.controlsMissingEvidence > 0) {
    next.push(
      `attach evidence to the ${scores.controlsMissingEvidence} control${scores.controlsMissingEvidence === 1 ? "" : "s"} already marked Yes`
    );
  }
  if (next.length > 0) {
    sentences.push(`The next step is to ${listNames(next)}.`);
  } else {
    sentences.push(
      "All controls are answered with evidence collected — maintain the review cycle and revisit when processing changes."
    );
  }

  return sentences.join(" ");
}

export interface PriorityAction {
  controlCode: string;
  tier: Gap["tier"];
  action: string;
  domain: string;
  ownerName: string | null;
  dueDate: Date | null;
}

/** The top N most urgent concrete actions, straight from the gap ranking. */
export function buildPriorityActions(gaps: Gap[], limit = 4): PriorityAction[] {
  return gaps.slice(0, limit).map((g) => ({
    controlCode: g.controlCode,
    tier: g.tier,
    action:
      g.tier === 2 || g.tier === 4
        ? `Answer this control: ${g.question}`
        : g.tier === 5
          ? `Attach evidence — ${g.evidenceExamples.join(", ").toLowerCase()}.`
          : g.recommendedAction,
    domain: g.domain,
    ownerName: g.ownerName,
    dueDate: g.dueDate,
  }));
}

/** Earliest open due date across gap answers → the working "next review" date. */
export function nextReviewDate(gaps: Gap[]): Date | null {
  const dates = gaps
    .filter((g) => g.remediationStatus !== "closed" && g.dueDate)
    .map((g) => g.dueDate as Date)
    .sort((a, b) => a.getTime() - b.getTime());
  return dates[0] ?? null;
}
