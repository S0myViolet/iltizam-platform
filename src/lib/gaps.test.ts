import { describe, expect, it } from "vitest";
import { buildGaps, gapTierFor, groupGapsByDomain, topRiskDomains, type GapInput } from "./gaps";

let counter = 0;
function gapInput(overrides: Partial<GapInput> = {}): GapInput {
  counter += 1;
  return {
    controlCode: `T-${counter}`,
    question: "Test question?",
    domain: "Governance & Accountability",
    domainOrder: 1,
    orderInDomain: counter,
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    answer: "no",
    whyItMatters: "why",
    recommendedAction: "action",
    evidenceExamples: ["Policy"],
    evidenceCount: 0,
    requiresEvidence: true,
    ownerName: null,
    dueDate: null,
    remediationStatus: "not_started",
    answerId: `ans-${counter}`,
    ...overrides,
  };
}

describe("gapTierFor", () => {
  it("assigns the five tiers in the specified priority order", () => {
    expect(gapTierFor({ severity: "legally_mandatory", answer: "no", evidenceCount: 0, requiresEvidence: true })).toBe(1);
    expect(gapTierFor({ severity: "legally_mandatory", answer: "not_answered", evidenceCount: 0, requiresEvidence: true })).toBe(2);
    expect(gapTierFor({ severity: "important", answer: "no", evidenceCount: 0, requiresEvidence: true })).toBe(3);
    expect(gapTierFor({ severity: "important", answer: "not_answered", evidenceCount: 0, requiresEvidence: true })).toBe(4);
    expect(gapTierFor({ severity: "legally_mandatory", answer: "yes", evidenceCount: 0, requiresEvidence: true })).toBe(5);
  });

  it("treats yes-with-evidence and not-applicable as no gap", () => {
    expect(gapTierFor({ severity: "legally_mandatory", answer: "yes", evidenceCount: 1, requiresEvidence: true })).toBeNull();
    expect(gapTierFor({ severity: "important", answer: "yes", evidenceCount: 0, requiresEvidence: false })).toBeNull();
    expect(gapTierFor({ severity: "legally_mandatory", answer: "not_applicable", evidenceCount: 0, requiresEvidence: true })).toBeNull();
  });
});

describe("buildGaps", () => {
  it("sorts by tier first, then platform domain order", () => {
    const gaps = buildGaps([
      gapInput({ controlCode: "IMP-NO", severity: "important", answer: "no", domainOrder: 1 }),
      gapInput({ controlCode: "MAND-NO-LATE-DOMAIN", severity: "legally_mandatory", answer: "no", domainOrder: 9 }),
      gapInput({ controlCode: "MAND-UNANSWERED", severity: "legally_mandatory", answer: "not_answered", domainOrder: 1 }),
      gapInput({ controlCode: "MAND-NO-EARLY-DOMAIN", severity: "legally_mandatory", answer: "no", domainOrder: 2 }),
      gapInput({ controlCode: "EVIDENCE-MISSING", severity: "legally_mandatory", answer: "yes", evidenceCount: 0 }),
    ]);
    expect(gaps.map((g) => g.controlCode)).toEqual([
      "MAND-NO-EARLY-DOMAIN",
      "MAND-NO-LATE-DOMAIN",
      "MAND-UNANSWERED",
      "IMP-NO",
      "EVIDENCE-MISSING",
    ]);
  });

  it("excludes fully-ready and not-applicable controls", () => {
    const gaps = buildGaps([
      gapInput({ answer: "yes", evidenceCount: 3 }),
      gapInput({ answer: "not_applicable" }),
    ]);
    expect(gaps).toHaveLength(0);
  });
});

describe("groupGapsByDomain", () => {
  it("groups by domain in platform order with tier order inside", () => {
    const gaps = buildGaps([
      gapInput({ controlCode: "SEC-X", domain: "Security of Processing", domainOrder: 8, answer: "no" }),
      gapInput({ controlCode: "GOV-X", domain: "Governance & Accountability", domainOrder: 1, answer: "not_answered" }),
      gapInput({ controlCode: "GOV-Y", domain: "Governance & Accountability", domainOrder: 1, answer: "no" }),
    ]);
    const groups = groupGapsByDomain(gaps);
    expect(groups.map((g) => g.domain)).toEqual([
      "Governance & Accountability",
      "Security of Processing",
    ]);
    expect(groups[0].gaps.map((g) => g.controlCode)).toEqual(["GOV-Y", "GOV-X"]);
  });
});

describe("topRiskDomains", () => {
  it("weights mandatory gaps three times an important gap", () => {
    const gaps = buildGaps([
      gapInput({ domain: "A", domainOrder: 1, severity: "legally_mandatory", answer: "no" }),
      gapInput({ domain: "B", domainOrder: 2, severity: "important", answer: "no" }),
      gapInput({ domain: "B", domainOrder: 2, severity: "important", answer: "not_answered" }),
    ]);
    const top = topRiskDomains(gaps, 2);
    expect(top[0]).toMatchObject({ domain: "A", weight: 3, mandatoryGaps: 1 });
    expect(top[1]).toMatchObject({ domain: "B", weight: 2, mandatoryGaps: 0, totalGaps: 2 });
  });
});
