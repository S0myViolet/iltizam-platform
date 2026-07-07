// Gap report — pure functions, no database access.
//
// A "gap" is anything standing between the company and readiness. Gaps are
// prioritised in fixed tiers (1 = most urgent):
//   1. Legally mandatory controls answered No
//   2. Legally mandatory controls not answered
//   3. Important controls answered No
//   4. Important controls not answered
//   5. Controls answered Yes but missing expected evidence

import type { AnswerValue, RemediationStatus, Severity } from "./types";

export type GapTier = 1 | 2 | 3 | 4 | 5;

export const GAP_TIER_LABELS: Record<GapTier, string> = {
  1: "Legally mandatory — answered No",
  2: "Legally mandatory — not answered",
  3: "Important — answered No",
  4: "Important — not answered",
  5: "Answered Yes — evidence missing",
};

/** The slice of a control + answer the gap report needs. */
export interface GapInput {
  controlCode: string;
  question: string;
  domain: string;
  domainOrder: number;
  orderInDomain: number;
  severity: Severity;
  /** The regulation this control belongs to ("EU-GDPR", "EG-PDPL"). */
  sourceRegulationCode: string;
  /** Display citation, e.g. "PDPL Art. 4(10), 26". */
  legalBasis: string;
  regimes: string[];
  answer: AnswerValue;
  whyItMatters: string;
  recommendedAction: string;
  evidenceExamples: string[];
  evidenceCount: number;
  requiresEvidence: boolean;
  ownerName: string | null;
  dueDate: Date | null;
  remediationStatus: RemediationStatus;
  answerId: string;
}

export interface Gap extends GapInput {
  tier: GapTier;
  tierLabel: string;
}

export interface DomainGapGroup {
  domain: string;
  domainOrder: number;
  gaps: Gap[];
}

export function gapTierFor(input: {
  severity: Severity;
  answer: AnswerValue;
  evidenceCount: number;
  requiresEvidence: boolean;
}): GapTier | null {
  const mandatory = input.severity === "legally_mandatory";
  if (input.answer === "no") return mandatory ? 1 : 3;
  if (input.answer === "not_answered") return mandatory ? 2 : 4;
  if (input.answer === "yes" && input.requiresEvidence && input.evidenceCount === 0) return 5;
  return null; // yes with evidence, or not applicable — not a gap
}

export function buildGaps(inputs: GapInput[]): Gap[] {
  return inputs
    .flatMap((input) => {
      const tier = gapTierFor(input);
      if (tier === null) return [];
      return [{ ...input, tier, tierLabel: GAP_TIER_LABELS[tier] }];
    })
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        a.domainOrder - b.domainOrder ||
        a.orderInDomain - b.orderInDomain
    );
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
    .sort((a, b) => a.domainOrder - b.domainOrder);
}

/** Top risk areas: domains ranked by weighted open gaps (mandatory counts ×3). */
export function topRiskDomains(gaps: Gap[], limit = 3): { domain: string; weight: number; mandatoryGaps: number; totalGaps: number }[] {
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
