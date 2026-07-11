// Monitoring engine determinism over the REAL vault: each MON-* rule fires on
// the resource designed to trip it, facts combine manifest + parsed content,
// matched values are captured, and repeated evaluation is idempotent.

import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { evaluateRulesForResource } from "./monitoring";
import { factsFor } from "./scan";
import { MONITORING_RULES } from "@/data/monitoring-rules";
import { applyScenario, generateVault, parseVaultFile, readManifest, type VaultEntry } from "./vault";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "iltizam-mon-"));
const NOW = new Date("2026-07-11T12:00:00Z");

let entries: VaultEntry[] = [];
const factsCache = new Map<string, Awaited<ReturnType<typeof buildFacts>>>();

async function buildFacts(entry: VaultEntry) {
  const parsed = await parseVaultFile(entry.fileName);
  return factsFor(entry, parsed);
}
async function matchesFor(fileName: string): Promise<string[]> {
  const entry = entries.find((e) => e.fileName === fileName)!;
  if (!factsCache.has(fileName)) factsCache.set(fileName, await buildFacts(entry));
  return evaluateRulesForResource(MONITORING_RULES, factsCache.get(fileName)!, NOW).map((m) => m.ruleCode);
}

beforeAll(async () => {
  process.env.DEMO_VAULT_DIR = tmp;
  await generateVault({ force: true });
  entries = readManifest().entries;
});

afterAll(() => {
  delete process.env.DEMO_VAULT_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("MON-* rules against the real vault", () => {
  it("MON-ACCESS-001 fires on the publicly shared support export", async () => {
    expect(await matchesFor("Customer_Support_Export.csv")).toContain("MON-ACCESS-001");
  });
  it("MON-SENSITIVE-001 fires on broadly accessible biometric data", async () => {
    expect(await matchesFor("Biometric_Access_Records.xlsx")).toContain("MON-SENSITIVE-001");
  });
  it("MON-SECURITY-001 fires on the unencrypted payroll archive", async () => {
    expect(await matchesFor("Payroll_Archive_2022.xlsx")).toContain("MON-SECURITY-001");
  });
  it("MON-TRANSFER-001 and MON-PROCESSOR-001 fire on the cross-border vendor file", async () => {
    const codes = await matchesFor("Cross_Border_Vendors.xlsx");
    expect(codes).toContain("MON-TRANSFER-001");
    expect(codes).toContain("MON-PROCESSOR-001");
  });
  it("MON-RETENTION-001 fires where retention is undocumented", async () => {
    expect(await matchesFor("Marketing_Leads.xlsx")).toContain("MON-RETENTION-001");
  });
  it("MON-RETENTION-002 fires on the overdue recruitment file", async () => {
    expect(await matchesFor("Recruitment_Candidates.xlsx")).toContain("MON-RETENTION-002");
  });
  it("MON-OWNER-001 fires where no owner is assigned", async () => {
    expect(await matchesFor("Customer_Support_Export.csv")).toContain("MON-OWNER-001");
  });
  it("MON-MARKETING-001 fires on leads without consent evidence", async () => {
    expect(await matchesFor("Marketing_Leads.xlsx")).toContain("MON-MARKETING-001");
  });
  it("MON-LICENCE-001 fires on sensitive data without licence evidence", async () => {
    expect(await matchesFor("Biometric_Access_Records.xlsx")).toContain("MON-LICENCE-001");
  });
  it("MON-RIGHTS-001 fires from PARSED CONTENT: the open 7-working-day request", async () => {
    const entry = entries.find((e) => e.fileName === "Data_Subject_Requests.xlsx")!;
    const facts = await buildFacts(entry);
    expect(facts.hasOpenRightsRequest).toBe(true);
    expect(facts.maxOpenWorkingDays).toBe(7);
    expect(await matchesFor("Data_Subject_Requests.xlsx")).toContain("MON-RIGHTS-001");
  });
  it("MON-EVIDENCE-001 flags exactly the 11 evidence documents as candidates", async () => {
    let candidates = 0;
    for (const e of entries) {
      const codes = await matchesFor(e.fileName);
      if (codes.includes("MON-EVIDENCE-001")) candidates += 1;
    }
    expect(candidates).toBe(11);
  });
});

describe("engine totals and determinism", () => {
  it("a fresh vault yields 23 findings, 11 candidates, 18 control mappings, all 12 rules firing", async () => {
    let findings = 0, candidates = 0, mappings = 0;
    const fired = new Set<string>();
    for (const e of entries) {
      const facts = factsCache.get(e.fileName) ?? (await buildFacts(e));
      for (const m of evaluateRulesForResource(MONITORING_RULES, facts, NOW)) {
        findings += 1;
        fired.add(m.ruleCode);
        if (m.isEvidenceCandidate) candidates += 1;
        mappings += m.relatedControlCodes.length;
      }
    }
    expect(findings).toBe(23);
    expect(candidates).toBe(11);
    expect(mappings).toBe(18);
    expect(fired.size).toBe(MONITORING_RULES.length);
  });

  it("same facts twice ⇒ identical matches with unique dedup keys and matched values", async () => {
    const all: string[] = [];
    for (const e of entries) {
      const facts = factsCache.get(e.fileName)!;
      const a = evaluateRulesForResource(MONITORING_RULES, facts, NOW);
      const b = evaluateRulesForResource(MONITORING_RULES, facts, NOW);
      expect(a).toEqual(b);
      for (const m of a) {
        all.push(m.dedupKey);
        expect(Object.keys(m.matchedValues).length).toBeGreaterThan(0);
      }
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it("matched values expose the exact facts that satisfied the condition", async () => {
    const facts = factsCache.get("Customer_Support_Export.csv")!;
    const access = evaluateRulesForResource(MONITORING_RULES, facts, NOW).find(
      (m) => m.ruleCode === "MON-ACCESS-001"
    )!;
    expect(access.matchedValues).toMatchObject({ containsPersonalData: true, sharingStatus: "public" });
  });

  it("after injecting the public-sharing change, MON-ACCESS-001 fires on Employees.xlsx too", async () => {
    await applyScenario("share_employees_publicly");
    const entry = readManifest().entries.find((e) => e.fileName === "Employees.xlsx")!;
    const facts = await buildFacts(entry);
    const codes = evaluateRulesForResource(MONITORING_RULES, facts, NOW).map((m) => m.ruleCode);
    expect(codes).toContain("MON-ACCESS-001");
    await generateVault({ force: true });
  });
});
