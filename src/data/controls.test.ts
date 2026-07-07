// Seed-data integrity: the control library must keep matching what the
// Iltzam Control Library document states about itself (64 controls, 54
// legally mandatory / 10 important, 14 domains, all mapped to both regimes).

import { describe, expect, it } from "vitest";
import {
  CONTROLS,
  DOMAINS,
  REGULATIONS,
  EXPECTED_CONTROL_COUNT,
  EXPECTED_IMPORTANT_COUNT,
  EXPECTED_MANDATORY_COUNT,
} from "./controls";

describe("control library seed data", () => {
  it("has exactly 64 controls with the documented severity split", () => {
    expect(CONTROLS).toHaveLength(EXPECTED_CONTROL_COUNT);
    expect(CONTROLS.filter((c) => c.severity === "legally_mandatory")).toHaveLength(
      EXPECTED_MANDATORY_COUNT
    );
    expect(CONTROLS.filter((c) => c.severity === "important")).toHaveLength(
      EXPECTED_IMPORTANT_COUNT
    );
  });

  it("has 14 domains, each used by at least one control", () => {
    expect(DOMAINS).toHaveLength(14);
    const used = new Set(CONTROLS.map((c) => c.domain));
    for (const d of DOMAINS) {
      expect(used, `domain "${d.name}" has no controls`).toContain(d.name);
    }
    // and no control references an unknown domain
    const known = new Set(DOMAINS.map((d) => d.name));
    for (const c of CONTROLS) {
      expect(known, `control ${c.code} references unknown domain "${c.domain}"`).toContain(c.domain);
    }
  });

  it("has unique, well-formed control codes matching their domain prefix", () => {
    const codes = new Set(CONTROLS.map((c) => c.code));
    expect(codes.size).toBe(CONTROLS.length);
    const prefixByDomain = new Map(DOMAINS.map((d) => [d.name, d.code]));
    for (const c of CONTROLS) {
      expect(c.code).toMatch(/^[A-Z]{3}-\d{2}$/);
      expect(c.code.startsWith(`${prefixByDomain.get(c.domain)}-`)).toBe(true);
    }
  });

  it("numbers controls sequentially within each domain", () => {
    const byDomain = new Map<string, number[]>();
    for (const c of CONTROLS) {
      const n = Number(c.code.split("-")[1]);
      byDomain.set(c.domain, [...(byDomain.get(c.domain) ?? []), n]);
    }
    for (const [domain, numbers] of byDomain) {
      expect(numbers, `domain ${domain} numbering`).toEqual(
        Array.from({ length: numbers.length }, (_, i) => i + 1)
      );
    }
  });

  it("cites a GDPR article on every control (the library's source regulation)", () => {
    for (const c of CONTROLS) {
      expect(c.gdprArticles, c.code).toMatch(/^Art\./);
    }
  });

  it("phrases every control as a question with complete guidance fields", () => {
    for (const c of CONTROLS) {
      expect(c.question.trim().endsWith("?"), `${c.code} question ends with ?`).toBe(true);
      expect(c.description.length, `${c.code} description`).toBeGreaterThan(10);
      expect(c.whyItMatters.length, `${c.code} whyItMatters`).toBeGreaterThan(10);
      expect(c.recommendedAction.length, `${c.code} recommendedAction`).toBeGreaterThan(10);
      expect(c.evidenceExamples.length, `${c.code} evidenceExamples`).toBeGreaterThan(0);
      expect(c.gdprArticles, `${c.code} gdprArticles`).toMatch(/^Art\./);
    }
  });

  it("seeds both regulations with full legal identity", () => {
    expect(REGULATIONS.map((r) => r.code).sort()).toEqual(["EG-PDPL", "EU-GDPR"]);
    const gdpr = REGULATIONS.find((r) => r.code === "EU-GDPR")!;
    expect(gdpr.version).toBe("2016/679");
    expect(gdpr.status).toBe("in_force");
    expect(gdpr.jurisdiction).toBe("European Union");
    const pdpl = REGULATIONS.find((r) => r.code === "EG-PDPL")!;
    expect(pdpl.status).toBe("implementation_period");
    expect(pdpl.jurisdiction).toBe("Egypt");
    expect(pdpl.version).toBe("Law 151/2020 + Executive Regulations 816/2025");
    expect(pdpl.regulator).toContain("PDPC");
    expect(pdpl.complianceDeadline).toBe("2026-11-01");
  });
});
