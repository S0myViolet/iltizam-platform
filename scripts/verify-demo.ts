// End-to-end verification of the backend demonstration platform.
//
// Runs against a live server (default http://localhost:4040) plus direct
// database assertions, and walks the full demonstration story:
//
//   reset → library integrity → tenancy walls → permission walls →
//   demonstration scan (persisted pipeline) → official-score protection →
//   idempotent re-scan → finding review + lineage → evidence review moves
//   evidence readiness deterministically → 22-sheet Excel export → reset.
//
// Usage:  npx tsx scripts/verify-demo.ts
// Env:    VERIFY_BASE_URL to point at a different server.
//
// Exits non-zero if any check fails. Nothing here mutates non-demo data:
// every write goes through the same APIs a user would call, against the
// demonstration organization only (plus one throwaway tenancy-probe org
// that is created and deleted by this script).

import fs from "node:fs";
import path from "node:path";

// Load .env before any module that instantiates PrismaClient.
for (const file of [".env.local", ".env"]) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:4040";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ─── tiny test harness ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n■ ${title}`);
}

// ─── HTTP helpers (cookie-aware) ─────────────────────────────────────────────

type Client = { cookie: string; name: string };

async function signIn(email: string): Promise<Client> {
  const res = await fetch(`${BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Sign-in failed for ${email}: ${res.status}`);
  const setCookie = res.headers.get("set-cookie") ?? "";
  const cookie = setCookie.split(";")[0];
  const data = (await res.json()) as { name: string };
  return { cookie, name: data.name };
}

async function api(
  client: Client | null,
  method: string,
  pathName: string,
  body?: unknown
): Promise<{ status: number; json: Record<string, unknown> | null; res: Response }> {
  const res = await fetch(`${BASE}${pathName}`, {
    method,
    headers: {
      ...(client ? { cookie: client.cookie } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: Record<string, unknown> | null = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    json = (await res.json()) as Record<string, unknown>;
  }
  return { status: res.status, json, res };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── the walkthrough ─────────────────────────────────────────────────────────

async function main() {
  section("0. Server reachability");
  try {
    const ping = await fetch(`${BASE}/signin`, { redirect: "manual" });
    check(`server responds at ${BASE}`, ping.status < 500, `status ${ping.status}`);
  } catch (err) {
    console.error(`Cannot reach ${BASE} — start the app first (npm run dev). ${err}`);
    process.exit(1);
  }

  section("1. Unauthenticated requests are rejected");
  {
    const findings = await api(null, "GET", "/api/findings");
    check("GET /api/findings without a session → 401", findings.status === 401);
    const scan = await api(null, "POST", "/api/demo/scan");
    check("POST /api/demo/scan without a session → 401", scan.status === 401);
  }

  section("2. Platform admin resets the demonstration to a known state");
  const platformAdmin = await signIn("platform.admin@iltzam.example");
  {
    const reset = await api(platformAdmin, "POST", "/api/demo/reset");
    check("POST /api/demo/reset as platform admin → 200", reset.status === 200);
  }

  const demoOrg = await prisma.organization.findFirst({ where: { demoOrganization: true } });
  if (!demoOrg) throw new Error("No demonstration organization — run the seed first.");

  section("3. Library integrity (database)");
  {
    const pdpl = await prisma.control.findMany({ where: { controlCode: { startsWith: "EG-" } } });
    check("Egypt PDPL: exactly 85 controls", pdpl.length === 85, `${pdpl.length}`);
    check(
      "Egypt PDPL: 64 legally mandatory / 21 important",
      pdpl.filter((c) => c.severity === "legally_mandatory").length === 64 &&
        pdpl.filter((c) => c.severity === "important").length === 21
    );
    const pdplDomains = await prisma.controlDomain.count({ where: { code: { startsWith: "EG-" } } });
    check("Egypt PDPL: 14 domains", pdplDomains === 14, `${pdplDomains}`);
    const gdprCount = (await prisma.control.count()) - pdpl.length;
    check("GDPR library intact: 64 controls (separate, not merged)", gdprCount === 64, `${gdprCount}`);
    const crossMapped = await prisma.regulationControlMapping.count({
      where: {
        regulation: { code: "EU-GDPR" },
        control: { controlCode: { startsWith: "EG-" } },
      },
    });
    check("no PDPL control is mapped to GDPR (libraries stay separate)", crossMapped === 0);
    const rules = await prisma.monitoringRule.count({ where: { enabled: true } });
    check("12 versioned monitoring rules enabled", rules === 12, `${rules}`);
  }

  section("4. Tenant isolation returns 404, never data");
  const dina = await signIn("dina.mostafa@niledigital.example"); // compliance_manager
  {
    // A throwaway second organization this session's users do NOT belong to.
    const probeOrg = await prisma.organization.create({
      data: { name: "Tenancy Probe Ltd", country: "Egypt", demoOrganization: false },
    });
    const { createAssessmentWithControls } = await import("../src/lib/seeding");
    const { assessment: probeAssessment } = await createAssessmentWithControls(prisma, {
      organizationId: probeOrg.id,
      title: "Probe assessment",
      regulationCodes: ["EG-PDPL"],
    });
    const crossTenant = await api(dina, "GET", `/api/assessments/${probeAssessment.id}`);
    check(
      "another tenant's assessment → 404 (existence not confirmed)",
      crossTenant.status === 404,
      `status ${crossTenant.status}`
    );
    const ghost = await api(dina, "GET", "/api/assessments/nonexistent-id-000");
    check("nonexistent assessment → 404", ghost.status === 404);
    await prisma.assessment.deleteMany({ where: { organizationId: probeOrg.id } });
    await prisma.organization.delete({ where: { id: probeOrg.id } });
  }

  section("5. Permission walls hold");
  const hana = await signIn("hana.ibrahim@niledigital.example"); // viewer
  const nour = await signIn("nour.elsayed@niledigital.example"); // reviewer
  const salma = await signIn("salma.fawzy@niledigital.example"); // client_admin
  {
    const viewerScan = await api(hana, "POST", "/api/demo/scan");
    check("viewer cannot run the scan → 403", viewerScan.status === 403, `status ${viewerScan.status}`);
    const reviewerReset = await api(nour, "POST", "/api/demo/reset");
    check(
      "reviewer cannot reset the demonstration → 404 (admin surface hidden)",
      reviewerReset.status === 404,
      `status ${reviewerReset.status}`
    );
    const managerScan = await api(dina, "POST", "/api/demo/scan");
    check(
      "compliance_manager lacks connector.manage → 403",
      managerScan.status === 403,
      `status ${managerScan.status}`
    );
  }

  section("6. Demonstration scan: staged, persisted pipeline");
  let runId = "";
  {
    const scan = await api(salma, "POST", "/api/demo/scan");
    check("client_admin starts the scan → 202 + runId", scan.status === 202 && !!scan.json?.runId);
    runId = String(scan.json?.runId ?? "");

    let run: Record<string, unknown> | null = null;
    const stagesSeen = new Set<string>();
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      const poll = await api(salma, "GET", `/api/sync-runs/${runId}`);
      run = (poll.json?.run ?? null) as Record<string, unknown> | null;
      if (run?.stage) stagesSeen.add(String(run.stage));
      if (run?.status === "completed" || run?.status === "failed") break;
      await sleep(400);
    }
    check("scan reaches completed", run?.status === "completed", `status ${run?.status}`);
    check(
      "stage progression visible while polling",
      stagesSeen.size >= 2,
      [...stagesSeen].join(",")
    );
    check("18 resources discovered", run?.resourcesDiscovered === 18, `${run?.resourcesDiscovered}`);

    const resources = await prisma.connectorResource.count({
      where: { connector: { organizationId: demoOrg.id } },
    });
    check("18 connector resources persisted", resources === 18, `${resources}`);
    const inventory = await prisma.dataInventoryItem.count({
      where: { organizationId: demoOrg.id, connectorId: { not: null } },
    });
    check("connector-derived inventory items persisted", inventory > 0, `${inventory}`);
    const manualInventory = await prisma.dataInventoryItem.count({
      where: { organizationId: demoOrg.id, connectorId: null },
    });
    check("manual inventory entries survive the scan", manualInventory >= 3, `${manualInventory}`);
  }

  section("7. Findings are quarantined until a human reviews them");
  {
    const run = (await api(salma, "GET", `/api/sync-runs/${runId}`)).json?.run as Record<
      string,
      unknown
    >;
    const before = JSON.parse(String(run.scoreBefore)) as Record<string, number | null>;
    const after = JSON.parse(String(run.scoreAfter)) as Record<string, number | null>;
    check(
      "official answer readiness unchanged by the scan",
      before.readinessScore === after.readinessScore,
      `${before.readinessScore} → ${after.readinessScore}`
    );
    check(
      "official mandatory score unchanged by the scan",
      before.mandatoryScore === after.mandatoryScore,
      `${before.mandatoryScore} → ${after.mandatoryScore}`
    );
    check(
      "unreviewed findings counter rose instead",
      Number(after.unreviewedFindings) > Number(before.unreviewedFindings ?? 0),
      `${before.unreviewedFindings} → ${after.unreviewedFindings}`
    );

    const findings = await prisma.monitoringFinding.findMany({
      where: { organizationId: demoOrg.id },
    });
    check("scan produced exactly 22 findings", findings.length === 22, `${findings.length}`);
    check(
      "every finding defaults to status 'new'",
      findings.every((f) => f.status === "new")
    );
    check(
      "every finding carries rule code + version",
      findings.every((f) => f.ruleCode.startsWith("DEMO-") && f.ruleVersion >= 1)
    );
    check(
      "all 12 rules fired at least once",
      new Set(findings.map((f) => f.ruleCode)).size === 12
    );
    const dedupKeys = new Set(findings.map((f) => f.dedupKey));
    check("dedup keys unique", dedupKeys.size === findings.length);
    const candidates = findings.filter((f) => f.isEvidenceCandidate).length;
    check("10 evidence-candidate findings", candidates === 10, `${candidates}`);

    const mappings = await prisma.findingControlMapping.count({
      where: { finding: { organizationId: demoOrg.id } },
    });
    check("exactly 18 finding → control mappings persisted", mappings === 18, `${mappings}`);

    const auditOrigins = await prisma.auditLog.groupBy({
      by: ["origin"],
      where: { organizationId: demoOrg.id },
      _count: true,
    });
    const origins = new Set(auditOrigins.map((a) => a.origin));
    check(
      "audit log carries human AND automated_rule AND system_job origins",
      origins.has("human") && origins.has("automated_rule") && origins.has("system_job"),
      [...origins].join(",")
    );
    const scanAudits = await prisma.auditLog.count({
      where: { organizationId: demoOrg.id, action: { in: ["rule_evaluated", "finding_created"] } },
    });
    check("rule evaluations + finding creations audited", scanAudits > 20, `${scanAudits}`);
  }

  section("8. Re-running the scan is idempotent");
  {
    const scan2 = await api(salma, "POST", "/api/demo/scan");
    const runId2 = String(scan2.json?.runId ?? "");
    let run2: Record<string, unknown> | null = null;
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      const poll = await api(salma, "GET", `/api/sync-runs/${runId2}`);
      run2 = (poll.json?.run ?? null) as Record<string, unknown> | null;
      if (run2?.status === "completed" || run2?.status === "failed") break;
      await sleep(400);
    }
    check("second scan completes", run2?.status === "completed", `${run2?.status}`);
    check("second scan creates zero new findings", run2?.findingsCreated === 0, `${run2?.findingsCreated}`);
    const resources = await prisma.connectorResource.count({
      where: { connector: { organizationId: demoOrg.id } },
    });
    check("still exactly 18 resources (upserts, not duplicates)", resources === 18, `${resources}`);

    // Connector-discovered inventory is maintained by scans — the API must
    // refuse manual edits/archival server-side, not just hide the buttons.
    const connectorItem = await prisma.dataInventoryItem.findFirst({
      where: { organizationId: demoOrg.id, connectorId: { not: null } },
    });
    if (connectorItem) {
      const patch = await api(salma, "PATCH", `/api/inventory/${connectorItem.id}`, {
        status: "archived",
      });
      check(
        "connector-discovered inventory cannot be archived via API → 409",
        patch.status === 409,
        `status ${patch.status}`
      );
    }
  }

  section("9. Human finding review + data lineage");
  {
    const finding = await prisma.monitoringFinding.findFirst({
      where: { organizationId: demoOrg.id, status: "new", isEvidenceCandidate: false },
      orderBy: { ruleCode: "asc" },
    });
    if (!finding) throw new Error("No reviewable finding found.");

    const viewerPatch = await api(hana, "PATCH", `/api/findings/${finding.id}`, {
      status: "confirmed",
    });
    check("viewer cannot review a finding → 403", viewerPatch.status === 403, `${viewerPatch.status}`);

    const detail = await api(nour, "GET", `/api/findings/${finding.id}`);
    check("reviewer can open the finding detail", detail.status === 200);
    const trail = (detail.json?.auditTrail ?? []) as Array<Record<string, unknown>>;
    check(
      "lineage: audit trail includes automated finding_created",
      trail.some((t) => t.action === "finding_created" && t.origin === "automated_rule")
    );

    const confirm = await api(nour, "PATCH", `/api/findings/${finding.id}`, {
      status: "confirmed",
      resolutionNotes: "Verified against the source resource during the demonstration.",
    });
    check("reviewer confirms the finding → 200", confirm.status === 200);
    const confirmed = (confirm.json?.finding ?? {}) as Record<string, unknown>;
    check(
      "confirmation stamps reviewer + time",
      confirmed.status === "confirmed" && !!confirmed.reviewedByName && !!confirmed.reviewedAt
    );
    const confirmAudit = await prisma.auditLog.findFirst({
      where: { entityType: "MonitoringFinding", entityId: finding.id, action: "finding_confirmed" },
    });
    check("confirmation audited with origin human", confirmAudit?.origin === "human");
  }

  section("10. Evidence review moves evidence readiness — and only that");
  {
    const demoAssessment = await prisma.assessment.findFirst({
      where: { organizationId: demoOrg.id, title: "PDPL & GDPR readiness review 2026" },
    });
    if (!demoAssessment) throw new Error("Demo assessment missing.");

    const target = await prisma.evidence.findFirst({
      where: {
        organizationId: demoOrg.id,
        reviewStatus: "unreviewed",
        answer: { assessmentId: demoAssessment.id, answer: "yes" },
      },
    });
    if (!target) throw new Error("No unreviewed evidence on a yes-answer to exercise.");

    const beforeBundle = (await api(nour, "GET", `/api/assessments/${demoAssessment.id}`)).json as {
      scores: { readinessScore: number | null; evidenceReadiness: number | null };
    };

    const viewerReview = await api(hana, "PATCH", `/api/evidence/${target.id}`, {
      reviewStatus: "accepted",
    });
    check("viewer cannot review evidence → 403", viewerReview.status === 403, `${viewerReview.status}`);

    // Deleting ACCEPTED evidence changes the reviewed position — evidence.add
    // alone (control_owner) must not be enough.
    const acceptedEvidence = await prisma.evidence.findFirst({
      where: { organizationId: demoOrg.id, reviewStatus: "accepted" },
    });
    if (acceptedEvidence) {
      const omar = await signIn("omar.fathy@niledigital.example"); // control_owner
      const del = await api(omar, "DELETE", `/api/evidence/${acceptedEvidence.id}`);
      check(
        "control_owner cannot delete accepted evidence → 403",
        del.status === 403,
        `status ${del.status}`
      );
    }

    const accept = await api(nour, "PATCH", `/api/evidence/${target.id}`, {
      reviewStatus: "accepted",
      reviewNotes: "Reviewed during verification run.",
    });
    check("reviewer accepts evidence → 200", accept.status === 200);

    const afterBundle = (await api(nour, "GET", `/api/assessments/${demoAssessment.id}`)).json as {
      scores: { readinessScore: number | null; evidenceReadiness: number | null };
    };
    check(
      "evidence readiness increased deterministically",
      (afterBundle.scores.evidenceReadiness ?? 0) > (beforeBundle.scores.evidenceReadiness ?? 0),
      `${beforeBundle.scores.evidenceReadiness} → ${afterBundle.scores.evidenceReadiness}`
    );
    check(
      "official answer readiness untouched by evidence review",
      afterBundle.scores.readinessScore === beforeBundle.scores.readinessScore,
      `${beforeBundle.scores.readinessScore} → ${afterBundle.scores.readinessScore}`
    );
    const acceptAudit = await prisma.auditLog.findFirst({
      where: { entityType: "Evidence", entityId: target.id, action: "evidence_accepted" },
    });
    check("acceptance audited", !!acceptAudit);
  }

  section("11. Excel export: 22 sheets, no secrets");
  {
    const viewerExport = await api(hana, "GET", "/api/exports/full");
    check("viewer cannot export → 403", viewerExport.status === 403, `${viewerExport.status}`);

    const res = await fetch(`${BASE}/api/exports/full`, { headers: { cookie: salma.cookie } });
    check("client_admin exports the workbook → 200 xlsx", res.status === 200);
    const buffer = Buffer.from(await res.arrayBuffer());
    check("workbook is non-trivial", buffer.length > 20_000, `${buffer.length} bytes`);

    const ExcelJS = (await import("exceljs")).default;
    const { WORKBOOK_SHEETS } = await import("../src/lib/excel");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const names = wb.worksheets.map((w) => w.name);
    check("exactly 22 sheets", names.length === 22, `${names.length}`);
    check(
      "sheet names match the declared contract",
      JSON.stringify(names) === JSON.stringify([...WORKBOOK_SHEETS]),
      names.join("|")
    );

    // No credentials/secrets anywhere in the workbook text.
    let leaked = "";
    const needles = [/password/i, /secret/i, /token/i, /credential(?!s? reference)/i, /BLOB_READ_WRITE/i];
    for (const ws of wb.worksheets) {
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          const text = String(cell.value ?? "");
          for (const n of needles) {
            if (n.test(text)) leaked = `${ws.name}: ${text.slice(0, 60)}`;
          }
        });
      });
    }
    check("no credential-like strings in any cell", leaked === "", leaked);
  }

  section("12. Reset restores the demonstration baseline");
  {
    const reset = await api(platformAdmin, "POST", "/api/demo/reset");
    check("reset → 200", reset.status === 200);
    const findings = await prisma.monitoringFinding.count({ where: { organizationId: demoOrg.id } });
    const resources = await prisma.connectorResource.count({
      where: { connector: { organizationId: demoOrg.id } },
    });
    check("findings cleared", findings === 0, `${findings}`);
    check("connector resources cleared", resources === 0, `${resources}`);
    const assessment = await prisma.assessment.findFirst({
      where: { organizationId: demoOrg.id, title: "PDPL & GDPR readiness review 2026" },
      include: { _count: { select: { answers: true } } },
    });
    check("demo assessment re-seeded", !!assessment);
    check(
      "assessment carries all 149 controls (85 PDPL + 64 GDPR)",
      assessment?._count.answers === 149,
      `${assessment?._count.answers}`
    );
    const resetAudit = await prisma.auditLog.findFirst({
      where: { organizationId: demoOrg.id, action: "demonstration_reset" },
      orderBy: { createdAt: "desc" },
    });
    check("reset audited", !!resetAudit);
    const connector = await prisma.connector.findFirst({
      where: { organizationId: demoOrg.id, provider: "demo_connector" },
    });
    check("connector sync stamps cleared with the runs", connector?.lastSyncAt === null);
    const auditCount = await prisma.auditLog.count({ where: { organizationId: demoOrg.id } });
    check("audit trail preserved through reset", auditCount > 50, `${auditCount}`);
  }

  // ── verdict ────────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(60)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error("\nFailures:");
    for (const f of failures) console.error(`  • ${f}`);
    process.exitCode = 1;
  } else {
    console.log("All demonstration-platform checks passed.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
