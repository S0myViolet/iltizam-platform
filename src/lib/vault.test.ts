// The demo data vault: real files, deterministic generation, real parsing,
// inject scenarios that mutate the actual source, and byte-stable restore.

import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  applyScenario,
  checksumFile,
  generateVault,
  parseVaultFile,
  readManifest,
  vaultDir,
} from "./vault";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "iltizam-vault-"));

beforeAll(async () => {
  process.env.DEMO_VAULT_DIR = tmp;
  await generateVault({ force: true });
});

afterAll(() => {
  delete process.env.DEMO_VAULT_DIR;
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe("vault generation", () => {
  it("creates all 18 declared files plus the manifest", () => {
    const manifest = readManifest();
    expect(manifest.entries).toHaveLength(18);
    for (const entry of manifest.entries) {
      expect(fs.existsSync(path.join(vaultDir(), entry.fileName)), entry.fileName).toBe(true);
    }
    expect(manifest.note).toMatch(/synthetic/i);
  });

  it("is deterministic: regenerating produces identical file checksums", async () => {
    const before = readManifest().entries.map((e) => [e.fileName, checksumFile(e.fileName)]);
    await generateVault({ force: true });
    for (const [file, sum] of before) {
      expect(checksumFile(file), file).toBe(sum);
    }
  });

  it("manifest carries the file-level context rules need", () => {
    const m = readManifest();
    const support = m.entries.find((e) => e.fileName === "Customer_Support_Export.csv")!;
    expect(support.sharingStatus).toBe("public");
    expect(support.owner).toBeNull();
    expect(support.retentionPeriod).toBeNull();
    const bio = m.entries.find((e) => e.fileName === "Biometric_Access_Records.xlsx")!;
    expect(bio.containsSensitiveData).toBe(true);
    expect(bio.accessLevel).toBe("broad");
  });
});

describe("vault parsing (server-side)", () => {
  it("reads actual XLSX rows with columns", async () => {
    const parsed = await parseVaultFile("Employees.xlsx");
    expect(parsed.fileType).toBe("xlsx");
    expect(parsed.rowCount).toBe(180);
    expect(parsed.columns).toContain("national_id");
    expect(String(parsed.rows[0].employee_id)).toMatch(/^NDS-/);
  });

  it("reads actual CSV rows", async () => {
    const parsed = await parseVaultFile("Customer_Support_Export.csv");
    expect(parsed.fileType).toBe("csv");
    expect(parsed.rowCount).toBe(150);
    expect(parsed.columns).toContain("customer_email");
  });

  it("reads JSON records", async () => {
    const parsed = await parseVaultFile("DPO_Appointment_Record.json");
    expect(parsed.fileType).toBe("json");
    expect(parsed.rowCount).toBe(1);
    expect(parsed.rows[0].appointee).toBe("Dina Mostafa");
  });

  it("reads text documents with a preview", async () => {
    const parsed = await parseVaultFile("Website_Privacy_Notice.txt");
    expect(parsed.fileType).toBe("txt");
    expect(parsed.textPreview).toMatch(/six working days/i);
  });

  it("refuses path traversal and unknown types", async () => {
    await expect(parseVaultFile("../secrets.txt")).rejects.toThrow();
    await expect(parseVaultFile("evil.exe")).rejects.toThrow();
  });

  it("the rights register carries the open 7-working-day request", async () => {
    const parsed = await parseVaultFile("Data_Subject_Requests.xlsx");
    const open = parsed.rows.filter((r) => r.status === "open");
    expect(open).toHaveLength(1);
    expect(Number(open[0].working_days_open)).toBe(7);
  });
});

describe("inject demo change + restore", () => {
  it("share_employees_publicly mutates the manifest, and restore reverts it", async () => {
    await applyScenario("share_employees_publicly");
    expect(readManifest().entries.find((e) => e.externalId === "vault-employees")!.sharingStatus).toBe("public");
    await generateVault({ force: true });
    expect(readManifest().entries.find((e) => e.externalId === "vault-employees")!.sharingStatus).toBe("internal");
  });

  it("add_cross_border_vendor appends a real row to the spreadsheet", async () => {
    const before = (await parseVaultFile("Cross_Border_Vendors.xlsx")).rowCount;
    const beforeSum = checksumFile("Cross_Border_Vendors.xlsx");
    await applyScenario("add_cross_border_vendor");
    const after = await parseVaultFile("Cross_Border_Vendors.xlsx");
    expect(after.rowCount).toBe(before + 1);
    expect(after.rows.some((r) => r.vendor_name === "Lyon Analytics SARL")).toBe(true);
    expect(checksumFile("Cross_Border_Vendors.xlsx")).not.toBe(beforeSum);
    await generateVault({ force: true });
  });

  it("add_training_evidence creates a brand-new file and manifest entry", async () => {
    await applyScenario("add_training_evidence");
    expect(fs.existsSync(path.join(vaultDir(), "Training_Refresher_Q3.xlsx"))).toBe(true);
    expect(readManifest().entries).toHaveLength(19);
    await generateVault({ force: true });
    expect(fs.existsSync(path.join(vaultDir(), "Training_Refresher_Q3.xlsx"))).toBe(false);
    expect(readManifest().entries).toHaveLength(18);
  });
});
