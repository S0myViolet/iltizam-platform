import { describe, expect, it } from "vitest";
import { buildGaps, gapTierFor, groupGapsByDomain, topRiskDomains, type GapInput } from "./gaps";

const NOW = new Date("2026-07-10T12:00:00Z");

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
    regimes: ["EG-PDPL"],
    legalBases: { "EG-PDPL": "Art 4" },
    answer: "no",
    whyItMatters: "why",
    recommendedAction: "action",
    evidenceExamples: ["Policy"],
    evidenceCount: 0,
    acceptedEvidenceCount: 0,
    rejectedEvidenceCount: 0,
    expiredEvidenceCount: 0,
    requiresEvidence: true,
    provisional: false,
    ownerName: "Owner",
    dueDate: null,
    remediationStatus: "not_started",
    answerId: `ans-${counter}`,
    ...overrides,
  };
}

describe("gapTierFor", () => {
  it("assigns the five tiers in priority order", () => {
    expect(gapTierFor({ severity: "legally_mandatory", answer: "no", evidenceCount: 0, requiresEvidence: true })).toBe(1);
    expect(gapTierFor({ severity: "legally_mandatory", answer: "not_answered", evidenceCount: 0, requiresEvidence: true })).toBe(2);
    expect(gapTierFor({ severity: "important", answer: "no", evidenceCount: 0, requiresEvidence: true })).toBe(3);
    expect(gapTierFor({ severity: "important", answer: "not_answered", evidenceCount: 0, requiresEvidence: true })).toBe(4);
    expect(gapTierFor({ severity: "legally_mandatory", answer: "yes", evidenceCount: 0, requiresEvidence: true })).toBe(5);
  });

  it("yes with ACCEPTED evidence is not a gap; unaccepted evidence still is", () => {
    expect(
      gapTierFor({ severity: "important", answer: "yes", evidenceCount: 3, acceptedEvidenceCount: 1, requiresEvidence: true })
    ).toBeNull();
    expect(
      gapTierFor({ severity: "important", answer: "yes", evidenceCount: 3, acceptedEvidenceCount: 0, requiresEvidence: true })
    ).toBe(5);
    expect(gapTierFor({ severity: "legally_mandatory", answer: "not_applicable", evidenceCount: 0, requiresEvidence: true })).toBeNull();
  });
});

describe("buildGaps — reasons and alerts", () => {
  it("labels primary reasons: answer_no, unanswered, evidence_rejected before missing", () => {
    const gaps = buildGaps(
      [
        gapInput({ controlCode: "NO", answer: "no" }),
        gapInput({ controlCode: "UN", answer: "not_answered" }),
        gapInput({ controlCode: "REJ", answer: "yes", evidenceCount: 1, rejectedEvidenceCount: 1 }),
        gapInput({ controlCode: "MISS", answer: "yes" }),
      ],
      { now: NOW }
    );
    const byCode = Object.fromEntries(gaps.map((g) => [g.controlCode, g.reason]));
    expect(byCode.NO).toBe("answer_no");
    expect(byCode.UN).toBe("unanswered");
    expect(byCode.REJ).toBe("evidence_rejected");
    expect(byCode.MISS).toBe("evidence_missing");
  });

  it("adds owner_missing, overdue and legal_review_required alerts", () => {
    const [gap] = buildGaps(
      [
        gapInput({
          answer: "no",
          ownerName: null,
          dueDate: new Date("2026-06-01"),
          remediationStatus: "in_progress",
          provisional: true,
        }),
      ],
      { now: NOW }
    );
    expect(gap.alerts).toContain("owner_missing");
    expect(gap.alerts).toContain("overdue");
    expect(gap.alerts).toContain("legal_review_required");
  });

  it("sorts by tier first, then overdue/ownerless first within a tier", () => {
    const gaps = buildGaps(
      [
        gapInput({ controlCode: "IMP-NO", severity: "important", answer: "no" }),
        gapInput({ controlCode: "MAND-CALM", severity: "legally_mandatory", answer: "no" }),
        gapInput({
          controlCode: "MAND-OVERDUE",
          severity: "legally_mandatory",
          answer: "no",
          dueDate: new Date("2026-01-01"),
        }),
        gapInput({ controlCode: "EVIDENCE", severity: "legally_mandatory", answer: "yes" }),
      ],
      { now: NOW }
    );
    expect(gaps.map((g) => g.controlCode)).toEqual(["MAND-OVERDUE", "MAND-CALM", "IMP-NO", "EVIDENCE"]);
  });
});

describe("groupGapsByDomain / topRiskDomains", () => {
  it("groups by domain in platform order", () => {
    const gaps = buildGaps(
      [
        gapInput({ controlCode: "S", domain: "Security Measures", domainOrder: 7, answer: "no" }),
        gapInput({ controlCode: "G", domain: "Governance & Accountability", domainOrder: 1, answer: "no" }),
      ],
      { now: NOW }
    );
    expect(groupGapsByDomain(gaps).map((g) => g.domain)).toEqual([
      "Governance & Accountability",
      "Security Measures",
    ]);
  });

  it("weights mandatory gaps three times an important gap", () => {
    const gaps = buildGaps(
      [
        gapInput({ domain: "A", domainOrder: 1, severity: "legally_mandatory", answer: "no" }),
        gapInput({ domain: "B", domainOrder: 2, severity: "important", answer: "no" }),
        gapInput({ domain: "B", domainOrder: 2, severity: "important", answer: "not_answered" }),
      ],
      { now: NOW }
    );
    const top = topRiskDomains(gaps, 2);
    expect(top[0]).toMatchObject({ domain: "A", weight: 3 });
    expect(top[1]).toMatchObject({ domain: "B", weight: 2, totalGaps: 2 });
  });
});
