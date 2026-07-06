import { describe, expect, it } from "vitest";
import { computeScores, type ScorableControl } from "./scoring";

function control(overrides: Partial<ScorableControl> = {}): ScorableControl {
  return {
    controlCode: "GOV-01",
    domain: "Governance & Accountability",
    domainOrder: 1,
    severity: "legally_mandatory",
    answer: "not_answered",
    evidenceCount: 0,
    requiresEvidence: true,
    ...overrides,
  };
}

describe("computeScores (answer-based mode)", () => {
  it("scores yes as compliant and no / not_answered as non-compliant", () => {
    const summary = computeScores([
      control({ controlCode: "A", answer: "yes" }),
      control({ controlCode: "B", answer: "no" }),
      control({ controlCode: "C", answer: "not_answered" }),
      control({ controlCode: "D", answer: "yes" }),
    ]);
    expect(summary.readinessScore).toBe(50);
    expect(summary.compliantControls).toBe(2);
  });

  it("excludes not_applicable from the denominator", () => {
    const summary = computeScores([
      control({ controlCode: "A", answer: "yes" }),
      control({ controlCode: "B", answer: "not_applicable" }),
    ]);
    expect(summary.applicableControls).toBe(1);
    expect(summary.readinessScore).toBe(100);
  });

  it("returns null (not 0 or 100) when nothing is applicable", () => {
    const summary = computeScores([control({ answer: "not_applicable" })]);
    expect(summary.readinessScore).toBeNull();
    expect(summary.mandatoryScore).toBeNull();
  });

  it("splits mandatory and important scores by severity", () => {
    const summary = computeScores([
      control({ controlCode: "A", severity: "legally_mandatory", answer: "yes" }),
      control({ controlCode: "B", severity: "legally_mandatory", answer: "no" }),
      control({ controlCode: "C", severity: "important", answer: "yes" }),
    ]);
    expect(summary.mandatoryScore).toBe(50);
    expect(summary.importantScore).toBe(100);
    expect(summary.mandatoryGaps).toBe(1);
    expect(summary.importantGaps).toBe(0);
  });

  it("counts unanswered and answered controls (not_applicable is an answer)", () => {
    const summary = computeScores([
      control({ controlCode: "A", answer: "not_answered" }),
      control({ controlCode: "B", answer: "not_applicable" }),
      control({ controlCode: "C", answer: "no" }),
    ]);
    expect(summary.unansweredControls).toBe(1);
    expect(summary.answeredControls).toBe(2);
  });

  it("counts yes-answers that expect evidence but have none", () => {
    const summary = computeScores([
      control({ controlCode: "A", answer: "yes", evidenceCount: 0 }),
      control({ controlCode: "B", answer: "yes", evidenceCount: 2 }),
      control({ controlCode: "C", answer: "yes", evidenceCount: 0, requiresEvidence: false }),
      control({ controlCode: "D", answer: "no", evidenceCount: 0 }),
    ]);
    expect(summary.controlsMissingEvidence).toBe(1);
  });

  it("computes per-domain scores in platform domain order", () => {
    const summary = computeScores([
      control({ controlCode: "B1", domain: "Breach Management", domainOrder: 9, answer: "no" }),
      control({ controlCode: "G1", domain: "Governance & Accountability", domainOrder: 1, answer: "yes" }),
      control({ controlCode: "G2", domain: "Governance & Accountability", domainOrder: 1, answer: "not_applicable" }),
    ]);
    expect(summary.domainScores.map((d) => d.domain)).toEqual([
      "Governance & Accountability",
      "Breach Management",
    ]);
    expect(summary.domainScores[0]).toMatchObject({ score: 100, total: 2, applicable: 1 });
    expect(summary.domainScores[1]).toMatchObject({ score: 0, gaps: 1 });
  });

  it("rounds scores to one decimal place", () => {
    const summary = computeScores([
      control({ controlCode: "A", answer: "yes" }),
      control({ controlCode: "B", answer: "no" }),
      control({ controlCode: "C", answer: "no" }),
    ]);
    expect(summary.readinessScore).toBe(33.3);
  });
});

describe("computeScores (evidence-based mode)", () => {
  it("only counts yes-with-evidence as compliant when the control expects evidence", () => {
    const summary = computeScores(
      [
        control({ controlCode: "A", answer: "yes", evidenceCount: 0 }),
        control({ controlCode: "B", answer: "yes", evidenceCount: 1 }),
        control({ controlCode: "C", answer: "yes", evidenceCount: 0, requiresEvidence: false }),
      ],
      { mode: "evidence" }
    );
    expect(summary.readinessScore).toBe(66.7);
    expect(summary.compliantControls).toBe(2);
  });

  it("answer-based mode ignores evidence for the score", () => {
    const summary = computeScores([control({ answer: "yes", evidenceCount: 0 })]);
    expect(summary.readinessScore).toBe(100);
  });
});
