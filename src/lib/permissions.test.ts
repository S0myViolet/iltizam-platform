// Role → permission matrix: the server-side authority for what each role may do.

import { describe, expect, it } from "vitest";
import { roleHasPermission, ROLE_PERMISSIONS } from "./types";
import { WORKBOOK_SHEETS } from "./excel";

describe("role permissions", () => {
  it("viewer is read-only", () => {
    expect(ROLE_PERMISSIONS.viewer).toHaveLength(0);
    expect(roleHasPermission("viewer", "assessment.answer")).toBe(false);
    expect(roleHasPermission("viewer", "export.run")).toBe(false);
  });

  it("control_owner can answer and add evidence but never review or manage", () => {
    expect(roleHasPermission("control_owner", "assessment.answer")).toBe(true);
    expect(roleHasPermission("control_owner", "evidence.add")).toBe(true);
    expect(roleHasPermission("control_owner", "evidence.review")).toBe(false);
    expect(roleHasPermission("control_owner", "finding.review")).toBe(false);
    expect(roleHasPermission("control_owner", "assessment.manage")).toBe(false);
  });

  it("reviewer reviews evidence and findings but cannot answer controls", () => {
    expect(roleHasPermission("reviewer", "evidence.review")).toBe(true);
    expect(roleHasPermission("reviewer", "finding.review")).toBe(true);
    expect(roleHasPermission("reviewer", "assessment.answer")).toBe(false);
  });

  it("client_admin and compliance_manager hold the management permissions", () => {
    for (const role of ["client_admin", "compliance_manager"] as const) {
      expect(roleHasPermission(role, "assessment.manage")).toBe(true);
      expect(roleHasPermission(role, "inventory.manage")).toBe(true);
      expect(roleHasPermission(role, "export.run")).toBe(true);
    }
    expect(roleHasPermission("client_admin", "member.manage")).toBe(true);
    expect(roleHasPermission("compliance_manager", "member.manage")).toBe(false);
  });

  it("unknown roles have no permissions", () => {
    expect(roleHasPermission("platform_admin_typo", "export.run")).toBe(false);
  });
});

describe("Excel workbook contract", () => {
  it("declares all 22 required sheets", () => {
    expect(WORKBOOK_SHEETS).toHaveLength(22);
    for (const name of [
      "Overview", "Organization", "Users", "Regulations", "Control Domains", "Controls",
      "Regulation Mappings", "Assessments", "Assessment Answers", "Evidence Register",
      "Data Inventory", "Connectors", "Synchronization Runs", "Source Resources",
      "Monitoring Rules", "Monitoring Findings", "Finding Control Mappings", "Gap Register",
      "Domain Scores", "Regulation Scores", "Reports", "Audit Log",
    ]) {
      expect(WORKBOOK_SHEETS).toContain(name);
    }
  });
});
