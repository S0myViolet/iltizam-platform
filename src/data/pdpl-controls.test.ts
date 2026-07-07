// PDPL seed-data integrity: once the 85 controls are extracted from
// Egypt_PDPL_Law_and_Controls.docx, this suite enforces the document's own
// structure (85 controls; 64 legally mandatory / 21 important; per-domain
// counts; a PDPL basis on every control). While the library is still empty
// (document pending), only the scaffold checks run.

import { describe, expect, it } from "vitest";
import {
  PDPL_CONTROLS,
  PDPL_DOMAINS,
  PDPL_EXPECTED_TOTAL,
  PDPL_EXPECTED_MANDATORY,
  PDPL_EXPECTED_IMPORTANT,
} from "./pdpl-controls";

describe("PDPL library scaffold", () => {
  it("defines the 14 PDPL domains whose expected counts sum to 85", () => {
    expect(PDPL_DOMAINS).toHaveLength(14);
    const total = PDPL_DOMAINS.reduce((sum, d) => sum + d.expectedControls, 0);
    expect(total).toBe(PDPL_EXPECTED_TOTAL);
    expect(PDPL_EXPECTED_MANDATORY + PDPL_EXPECTED_IMPORTANT).toBe(PDPL_EXPECTED_TOTAL);
    // platform order 1..14, unique codes
    expect(PDPL_DOMAINS.map((d) => d.order)).toEqual(
      Array.from({ length: 14 }, (_, i) => i + 1)
    );
    expect(new Set(PDPL_DOMAINS.map((d) => d.code)).size).toBe(14);
  });
});

describe.skipIf(PDPL_CONTROLS.length === 0)("PDPL control library (extracted)", () => {
  it("has exactly 85 controls with the documented severity split", () => {
    expect(PDPL_CONTROLS).toHaveLength(PDPL_EXPECTED_TOTAL);
    expect(PDPL_CONTROLS.filter((c) => c.severity === "legally_mandatory")).toHaveLength(
      PDPL_EXPECTED_MANDATORY
    );
    expect(PDPL_CONTROLS.filter((c) => c.severity === "important")).toHaveLength(
      PDPL_EXPECTED_IMPORTANT
    );
  });

  it("matches the document's per-domain counts", () => {
    for (const d of PDPL_DOMAINS) {
      const count = PDPL_CONTROLS.filter((c) => c.domain === d.name).length;
      expect(count, `domain "${d.name}"`).toBe(d.expectedControls);
    }
  });

  it("uses stable EGP- codes matching their domain prefix, numbered sequentially", () => {
    const codes = new Set(PDPL_CONTROLS.map((c) => c.code));
    expect(codes.size).toBe(PDPL_CONTROLS.length);
    const prefixByDomain = new Map(PDPL_DOMAINS.map((d) => [d.name, d.code]));
    const byDomain = new Map<string, number[]>();
    for (const c of PDPL_CONTROLS) {
      expect(c.code, c.code).toMatch(/^EGP-[A-Z]{3}-\d{2}$/);
      expect(c.code.startsWith(`EGP-${prefixByDomain.get(c.domain)}-`), c.code).toBe(true);
      const n = Number(c.code.split("-")[2]);
      byDomain.set(c.domain, [...(byDomain.get(c.domain) ?? []), n]);
    }
    for (const [domain, numbers] of byDomain) {
      expect(numbers, `domain ${domain} numbering`).toEqual(
        Array.from({ length: numbers.length }, (_, i) => i + 1)
      );
    }
  });

  it("carries a PDPL basis and complete guidance on every control", () => {
    for (const c of PDPL_CONTROLS) {
      expect(c.legalBasis, c.code).toMatch(/PDPL|Art|Exec/i);
      expect(c.question.trim().endsWith("?"), `${c.code} question ends with ?`).toBe(true);
      expect(c.description.length, `${c.code} description`).toBeGreaterThan(10);
      expect(c.whyItMatters.length, `${c.code} whyItMatters`).toBeGreaterThan(10);
      expect(c.recommendedAction.length, `${c.code} recommendedAction`).toBeGreaterThan(10);
      expect(c.evidenceExamples.length, `${c.code} evidenceExamples`).toBeGreaterThan(0);
    }
  });
});
