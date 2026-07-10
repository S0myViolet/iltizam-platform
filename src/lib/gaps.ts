// Gap engine — deterministic, pure, testable. No AI in the decision path.
//
// Gap reasons (primary, one per control, in precedence order):
//   answer_no > unanswered > evidence_rejected > evidence_expired >
//   evidence_missing. Alerts (owner_missing, overdue, legal_review_required)
//   ride along on the gap rather than duplicating rows.
//
// Priority tiers (1 = most urgent):
//   1 Legally mandatory answered No
//   2 Legally mandatory not answered
//   3 Important answered No
//   4 Important not answered
//   5 Answered Yes but expected evidence missing / rejected / expired

import type { AnswerValue, RemediationStatus, Severity } from "./types";

export type GapTier = 1 | 2 | 3 | 4 | 5;

export type GapReason =
  | "answer_no"
  | "unanswered"
  | "evidence_missing"
  | "evidence_rejected"
  | "evidence_expired"
  | "owner_missing"
  | "overdue"
  | "legal_review_required";

export const GAP_TIER_LABELS: Record<GapTier, string> = {
  1: "Legally mandatory — answered No",
  2: "Legally mandatory — not answered",
  3: "Important — answered No",
  4: "Important — not answered",
  5: "Answered Yes — evidence not accepted",
};

export const GAP_REASON_LABELS: Record<GapReason, string> = {
  answer_no: "Marked as gap",
  unanswered: "Decision pending",
  evidence_missing: "Evidence missing",
  evidence_rejected: "Evidence rejected",
  evidence_expired: "Evidence expired",
  owner_missing: "Owner unassigned",
  overdue: "Overdue",
  legal_review_required: "Requires legal review",
};

/** The slice of a control + answer the gap engine needs. */
export interface GapInput {
  controlCode: string;
  question: string;
  domain: string;
  domainOrder: number;
  orderInDomain: number;
  severity: Severity;
  regimes: string[];
  legalBases: Record<string, string | null>;
  answer: AnswerValue;
  whyItMatters: string;
  recommendedAction: string;
  evidenceExamples: string[];
  evidenceCount: number;
  acceptedEvidenceCount: number;
  rejectedEvidenceCount: number;
  expiredEvidenceCount: number;
  requiresEvidence: boolean;
  provisional: boolean;
  ownerName: string | null;
  dueDate: Date | null;
  remediationStatus: RemediationStatus;
  answerId: string;
}

export interface Gap extends GapInput {
  tier: GapTier;
  tierLabel: string;
  reason: GapReason;
  reasonLabel: string;
  alerts: GapReason[];
}

export function gapTierFor(input: {
  severity: Severity;
  answer: AnswerValue;
  evidenceCount: number;
  requiresEvidence: boolean;
  acceptedEvidenceCount?: number;
}): GapTier | null {
  const mandatory = input.severity === "legally_mandatory";
  if (input.answer === "no") return mandatory ? 1 : 3;
  if (input.answer === "not_answered") return mandatory ? 2 : 4;
  const accepted = input.acceptedEvidenceCount ?? input.evidenceCount;
  if (input.answer === "yes" && input.requiresEvidence && accepted === 0) return 5;
  return null;
}

function primaryReason(input: GapInput, tier: GapTier): GapReason {
  if (tier === 1 || tier === 3) return "answer_no";
  if (tier === 2 || tier === 4) return "unanswered";
  if (input.rejectedEvidenceCount > 0) return "evidence_rejected";
  if (input.expiredEvidenceCount > 0) return "evidence_expired";
  return "evidence_missing";
}

function alertsFor(input: GapInput, now: Date): GapReason[] {
  const alerts: GapReason[] = [];
  if (!input.ownerName) alerts.push("owner_missing");
  if (
    input.dueDate &&
    input.dueDate.getTime() < now.getTime() &&
    input.remediationStatus !== "closed" &&
    input.remediationStatus !== "accepted"
  ) {
    alerts.push("overdue");
  }
  if (input.provisional) alerts.push("legal_review_required");
  return alerts;
}

export function buildGaps(inputs: GapInput[], options: { now?: Date } = {}): Gap[] {
  const now = options.now ?? new Date();
  return inputs
    .flatMap((input) => {
      const tier = gapTierFor(input);
      if (tier === null) return [];
      const reason = primaryReason(input, tier);
      return [
        {
          ...input,
          tier,
          tierLabel: GAP_TIER_LABELS[tier],
          reason,
          reasonLabel: GAP_REASON_LABELS[reason],
          alerts: alertsFor(input, now),
        },
      ];
    })
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        // within a tier: overdue first, then owner-missing, then platform order
        Number(b.alerts.includes("overdue")) - Number(a.alerts.includes("overdue")) ||
        Number(b.alerts.includes("owner_missing")) - Number(a.alerts.includes("owner_missing")) ||
        a.domainOrder - b.domainOrder ||
        a.orderInDomain - b.orderInDomain
    );
}

export interface DomainGapGroup {
  domain: string;
  domainOrder: number;
  gaps: Gap[];
}

/** Gaps grouped by domain (domains in platform order, gaps by tier within). */
export function groupGapsByDomain(gaps: Gap[]): DomainGapGroup[] {
  const groups = new Map<string, DomainGapGroup>();
  for (const gap of gaps) {
    const group = groups.get(gap.domain) ?? {
      domain: gap.domain,
      domainOrder: gap.domainOrder,
      gaps: [],
    };
    group.gaps.push(gap);
    groups.set(gap.domain, group);
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      gaps: [...g.gaps].sort((a, b) => a.tier - b.tier || a.orderInDomain - b.orderInDomain),
    }))
    .sort((a, b) => a.domainOrder - b.domainOrder || a.domain.localeCompare(b.domain));
}

/** Top risk areas: domains ranked by weighted open gaps (mandatory counts ×3). */
export function topRiskDomains(
  gaps: Gap[],
  limit = 3
): { domain: string; weight: number; mandatoryGaps: number; totalGaps: number }[] {
  const byDomain = new Map<string, { domain: string; weight: number; mandatoryGaps: number; totalGaps: number }>();
  for (const gap of gaps) {
    const entry = byDomain.get(gap.domain) ?? {
      domain: gap.domain,
      weight: 0,
      mandatoryGaps: 0,
      totalGaps: 0,
    };
    const isMandatoryGap = gap.tier <= 2;
    entry.weight += isMandatoryGap ? 3 : 1;
    entry.mandatoryGaps += isMandatoryGap ? 1 : 0;
    entry.totalGaps += 1;
    byDomain.set(gap.domain, entry);
  }
  return [...byDomain.values()]
    .sort((a, b) => b.weight - a.weight || b.mandatoryGaps - a.mandatoryGaps)
    .slice(0, limit);
}
