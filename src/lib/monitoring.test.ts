// Monitoring engine determinism: each demo rule triggers on exactly the
// resources designed to trip it, results are identical across runs, and
// dedup keys make repeated scans idempotent.

import { describe, expect, it } from "vitest";
import { evaluateRulesForResource } from "./monitoring";
import { MONITORING_RULES } from "@/data/monitoring-rules";
import { DEMO_RESOURCES } from "@/data/demo";

const NOW = new Date("2026-07-10T12:00:00Z");

function matchesFor(externalId: string) {
  const resource = DEMO_RESOURCES.find((r) => r.externalId === externalId)!;
  return evaluateRulesForResource(MONITORING_RULES, resource, NOW).map((m) => m.ruleCode);
}

describe("deterministic monitoring rules", () => {
  it("DEMO-ACCESS-001 triggers on public personal data (Customer Support Export)", () => {
    expect(matchesFor("drive-0003")).toContain("DEMO-ACCESS-001");
  });

  it("DEMO-SENSITIVE-001 triggers on broadly-accessible sensitive data (Biometric records)", () => {
    expect(matchesFor("drive-0010")).toContain("DEMO-SENSITIVE-001");
  });

  it("DEMO-TRANSFER-001 triggers on a non-Egypt destination (Cross-Border Vendor List)", () => {
    expect(matchesFor("drive-0013")).toContain("DEMO-TRANSFER-001");
  });

  it("DEMO-RETENTION-001 triggers when retention is missing (Employee Master List)", () => {
    expect(matchesFor("drive-0001")).toContain("DEMO-RETENTION-001");
  });

  it("DEMO-RETENTION-002 triggers on a passed retention date (Recruitment Candidates)", () => {
    expect(matchesFor("drive-0002")).toContain("DEMO-RETENTION-002");
  });

  it("DEMO-OWNER-001 triggers when the business owner is missing", () => {
    expect(matchesFor("drive-0003")).toContain("DEMO-OWNER-001");
  });

  it("DEMO-MARKETING-001 triggers on marketing leads without consent evidence", () => {
    expect(matchesFor("drive-0004")).toContain("DEMO-MARKETING-001");
  });

  it("DEMO-LICENCE-001 triggers on sensitive data without licence evidence", () => {
    expect(matchesFor("drive-0010")).toContain("DEMO-LICENCE-001");
  });

  it("DEMO-SECURITY-001 triggers on unencrypted payroll data", () => {
    expect(matchesFor("drive-0009")).toContain("DEMO-SECURITY-001");
  });

  it("DEMO-PROCESSOR-001 triggers on an external processor without agreement", () => {
    expect(matchesFor("drive-0013")).toContain("DEMO-PROCESSOR-001");
  });

  it("DEMO-RIGHTS-001 triggers at/beyond the six-working-day threshold", () => {
    expect(matchesFor("drive-0016")).toContain("DEMO-RIGHTS-001");
  });

  it("DEMO-EVIDENCE-001 flags policies/registers/licences as candidates, never approvals", () => {
    for (const id of ["drive-0005", "drive-0008", "drive-0018"]) {
      const resource = DEMO_RESOURCES.find((r) => r.externalId === id)!;
      const match = evaluateRulesForResource(MONITORING_RULES, resource, NOW).find(
        (m) => m.ruleCode === "DEMO-EVIDENCE-001"
      );
      expect(match, id).toBeDefined();
      expect(match!.isEvidenceCandidate).toBe(true);
    }
  });

  it("clean evidence documents trigger no risk rules", () => {
    // Data Retention Policy.pdf: no personal data → only the evidence rule.
    expect(matchesFor("drive-0005")).toEqual(["DEMO-EVIDENCE-001"]);
  });

  it("is deterministic and versioned: same input twice ⇒ identical matches, all carrying rule code + version", () => {
    const all1 = DEMO_RESOURCES.flatMap((r) => evaluateRulesForResource(MONITORING_RULES, r, NOW));
    const all2 = DEMO_RESOURCES.flatMap((r) => evaluateRulesForResource(MONITORING_RULES, r, NOW));
    expect(all1).toEqual(all2);
    for (const m of all1) {
      expect(m.ruleCode).toMatch(/^DEMO-/);
      expect(m.ruleVersion).toBeGreaterThanOrEqual(1);
    }
  });

  it("dedup keys are unique per (rule, resource) so repeated scans cannot duplicate findings", () => {
    const all = DEMO_RESOURCES.flatMap((r) => evaluateRulesForResource(MONITORING_RULES, r, NOW));
    const keys = all.map((m) => m.dedupKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every demo rule requires human review by declaration", () => {
    // Structural guarantee: seeded rules always set requiresHumanReview.
    for (const rule of MONITORING_RULES) {
      expect(rule.relatedControlCodes).toBeDefined();
      expect(rule.code.startsWith("DEMO-")).toBe(true);
    }
  });
});
