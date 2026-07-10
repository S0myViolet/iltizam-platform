import { describe, expect, it } from "vitest";
import { computeScores, type ScorableControl } from "./scoring";

const NOW = new Date("2026-07-10T12:00:00Z");

function control(overrides: Partial<ScorableControl> = {}): ScorableControl {
  return {
    controlCode: "EG-GOV-01",
    domain: "Governance & Accountability",
    domainOrder: 1,
    severity: "legally_mandatory",
    answer: "not_answered",
    evidenceCount: 0,
    acceptedEvidenceCount: 0,
    requiresEvidence: true,
    regulationCodes: ["EG-PDPL"],
    provisional: false,
    ownerName: null,
    dueDate: null,
    remediationStatus: "not_started",
    ...overrides,
  };
}

describe("computeScores — answer readiness (official)", () => {
  it("scores yes as compliant; no and not_answered count against", () => {
    const s = computeScores(
      [
        control({ controlCode: "A", answer: "yes" }),
        control({ controlCode: "B", answer: "no" }),
        control({ controlCode: "C", answer: "not_answered" }),
        control({ controlCode: "D", answer: "yes" }),
      ],
      { now: NOW }
    );
    expect(s.readinessScore).toBe(50);
    expect(s.answerReadiness).toBe(50);
  });

  it("excludes not_applicable from every denominator", () => {
    const s = computeScores(
      [control({ controlCode: "A", answer: "yes" }), control({ controlCode: "B", answer: "not_applicable" })],
      { now: NOW }
    );
    expect(s.applicableControls).toBe(1);
    expect(s.readinessScore).toBe(100);
  });

  it("returns null (not 0 or 100) when nothing is applicable", () => {
    const s = computeScores([control({ answer: "not_applicable" })], { now: NOW });
    expect(s.readinessScore).toBeNull();
    expect(s.mandatoryScore).toBeNull();
  });

  it("splits mandatory and important scores", () => {
    const s = computeScores(
      [
        control({ controlCode: "A", severity: "legally_mandatory", answer: "yes" }),
        control({ controlCode: "B", severity: "legally_mandatory", answer: "no" }),
        control({ controlCode: "C", severity: "important", answer: "yes" }),
      ],
      { now: NOW }
    );
    expect(s.mandatoryScore).toBe(50);
    expect(s.importantScore).toBe(100);
    expect(s.mandatoryGaps).toBe(1);
    expect(s.importantGaps).toBe(0);
  });

  it("is deterministic: same input produces the same result", () => {
    const input = [
      control({ controlCode: "A", answer: "yes", acceptedEvidenceCount: 1, evidenceCount: 2 }),
      control({ controlCode: "B", answer: "no", ownerName: "X" }),
      control({ controlCode: "C", answer: "not_answered" }),
    ];
    expect(computeScores(input, { now: NOW })).toEqual(computeScores(input, { now: NOW }));
  });
});

describe("computeScores — evidence readiness (accepted evidence only)", () => {
  it("yes without ACCEPTED evidence is an evidence gap even when evidence exists", () => {
    const s = computeScores(
      [
        control({ controlCode: "A", answer: "yes", evidenceCount: 2, acceptedEvidenceCount: 0 }),
        control({ controlCode: "B", answer: "yes", evidenceCount: 1, acceptedEvidenceCount: 1 }),
        control({ controlCode: "C", answer: "yes", requiresEvidence: false }),
      ],
      { now: NOW }
    );
    expect(s.evidenceReadiness).toBe(66.7);
    expect(s.controlsMissingEvidence).toBe(1);
  });

  it("accepting one evidence item deterministically raises evidence readiness", () => {
    const before = computeScores(
      [control({ controlCode: "A", answer: "yes", evidenceCount: 1, acceptedEvidenceCount: 0 })],
      { now: NOW }
    );
    const after = computeScores(
      [control({ controlCode: "A", answer: "yes", evidenceCount: 1, acceptedEvidenceCount: 1 })],
      { now: NOW }
    );
    expect(before.evidenceReadiness).toBe(0);
    expect(after.evidenceReadiness).toBe(100);
    // official answer readiness is unchanged by evidence review
    expect(before.readinessScore).toBe(after.readinessScore);
  });
});

describe("computeScores — regulation scores", () => {
  it("scores each regulation separately without merging", () => {
    const s = computeScores(
      [
        control({ controlCode: "EG-1", regulationCodes: ["EG-PDPL"], answer: "yes" }),
        control({ controlCode: "EG-2", regulationCodes: ["EG-PDPL"], answer: "no" }),
        control({ controlCode: "EU-1", regulationCodes: ["EU-GDPR"], answer: "yes" }),
      ],
      { now: NOW }
    );
    const pdpl = s.regulationScores.find((r) => r.regulationCode === "EG-PDPL")!;
    const gdpr = s.regulationScores.find((r) => r.regulationCode === "EU-GDPR")!;
    expect(pdpl.score).toBe(50);
    expect(pdpl.total).toBe(2);
    expect(gdpr.score).toBe(100);
    expect(gdpr.total).toBe(1);
  });
});

describe("computeScores — accountability counters", () => {
  it("counts open items without an owner and overdue remediation", () => {
    const s = computeScores(
      [
        control({ controlCode: "A", answer: "no", ownerName: null }),
        control({ controlCode: "B", answer: "no", ownerName: "Laila" }),
        control({
          controlCode: "C",
          answer: "no",
          ownerName: "Omar",
          dueDate: new Date("2026-06-01"),
          remediationStatus: "in_progress",
        }),
        control({
          controlCode: "D",
          answer: "no",
          ownerName: "Omar",
          dueDate: new Date("2026-06-01"),
          remediationStatus: "closed",
        }),
      ],
      { now: NOW }
    );
    expect(s.missingOwnerCount).toBe(1);
    expect(s.overdueCount).toBe(1); // C overdue; D closed
  });
});
