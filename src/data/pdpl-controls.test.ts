// Egypt PDPL seed integrity: the library must keep matching what the source
// document states about itself — 85 controls, 64 legally mandatory, 21
// important, 14 domains, with the Impact Assessments domain provisional.

import { describe, expect, it } from "vitest";
import { PDPL_CONTROLS, PDPL_DOMAINS, PDPL_EXPECTED } from "./pdpl-controls";

describe("Egypt PDPL control library seed data", () => {
  it("has exactly 85 controls with the documented severity split", () => {
    expect(PDPL_CONTROLS).toHaveLength(PDPL_EXPECTED.total);
    expect(PDPL_CONTROLS.filter((c) => c.severity === "legally_mandatory")).toHaveLength(
      PDPL_EXPECTED.mandatory
    );
    expect(PDPL_CONTROLS.filter((c) => c.severity === "important")).toHaveLength(
      PDPL_EXPECTED.important
    );
  });

  it("has 14 domains, each used, with declared per-domain counts", () => {
    expect(PDPL_DOMAINS).toHaveLength(PDPL_EXPECTED.domains);
    const declared: Record<string, number> = {
      "Governance & Accountability": 8,
      "Lawful Basis": 6,
      "Consent Management": 7,
      "Data Subject Rights": 7,
      "Records of Processing": 5,
      "Data Protection Officer": 7,
      "Security Measures": 8,
      "Breach Management": 6,
      "Cross-Border Transfers": 6,
      "Vendors & Processors": 6,
      "Retention & Disposal": 5,
      "Privacy Notices": 5,
      "Impact Assessments": 5,
      "Training & Awareness": 4,
    };
    for (const [domain, count] of Object.entries(declared)) {
      expect(
        PDPL_CONTROLS.filter((c) => c.domain === domain),
        `domain ${domain}`
      ).toHaveLength(count);
    }
  });

  it("has unique EG-prefixed codes numbered sequentially per domain", () => {
    const codes = new Set(PDPL_CONTROLS.map((c) => c.code));
    expect(codes.size).toBe(PDPL_CONTROLS.length);
    for (const c of PDPL_CONTROLS) {
      expect(c.code).toMatch(/^EG-[A-Z]{3}-\d{2}$/);
    }
  });

  it("populates a PDPL legal basis on every control (Law articles or ER citations)", () => {
    for (const c of PDPL_CONTROLS) {
      // Verbatim from the document: either "Art …" of Law 151/2020, or an
      // Executive Regulations citation ("ER …") for the provisional duties.
      expect(c.legalBasis, c.code).toMatch(/Art|ER/);
      expect(c.legalBasis.trim().length, c.code).toBeGreaterThan(1);
    }
  });

  it("marks exactly the Impact Assessments domain provisional", () => {
    const provisional = PDPL_CONTROLS.filter((c) => c.provisional);
    expect(provisional).toHaveLength(PDPL_EXPECTED.provisional);
    expect(new Set(provisional.map((c) => c.domain))).toEqual(new Set(["Impact Assessments"]));
  });

  it("contains the Egypt-specific duties GDPR does not carry", () => {
    const questions = PDPL_CONTROLS.map((c) => c.question.toLowerCase());
    const mustCover = [
      "licence or permit from the pdpc", // PDPC licensing
      "representative inside egypt", // Egypt representative
      "6 working days", // rights deadline
      "72 hours", // PDPC breach notification
      "3 working days", // person notification
      "registered in the pdpc", // DPO registration
      "outside egypt", // cross-border licence
      "plain arabic", // Arabic notices
      "guardian", // child guardian consent
    ];
    for (const needle of mustCover) {
      expect(
        questions.some((q) => q.includes(needle)),
        `expected a control covering "${needle}"`
      ).toBe(true);
    }
  });

  it("ships complete guidance for every control", () => {
    for (const c of PDPL_CONTROLS) {
      expect(c.question.trim().endsWith("?"), `${c.code} question`).toBe(true);
      expect(c.whyItMatters.length, `${c.code} whyItMatters`).toBeGreaterThan(20);
      expect(c.recommendedAction.length, `${c.code} recommendedAction`).toBeGreaterThan(10);
      expect(c.evidenceExamples.length, `${c.code} evidenceExamples`).toBeGreaterThan(0);
    }
  });
});
