// End-to-end verification of the local demonstration platform.
//
// Walks the full stakeholder journey against a live server + direct DB
// assertions: public site → auth (email+password) → admin context → real
// vault scan (files/rows actually read) → findings + lineage → inject a
// change → rescan detects it → active monitoring → masked preview →
// 26-sheet workbook with raw synthetic rows → reset restores everything.
//
// Usage:  npx tsx scripts/verify-demo.ts   (server must be running)

import fs from "node:fs";
import path from "node:path";

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
import { demoAdminCredentials, demoUserPassword } from "../src/lib/passwords";
const prisma = new PrismaClient();

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

type Client = { cookie: string; name: string };

async function signIn(email: string, password: string): Promise<Client> {
  const res = await fetch(`${BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Sign-in failed for ${email}: ${res.status}`);
  const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
  const data = (await res.json()) as { name: string };
  return { cookie, name: data.name };
}

async function api(client: Client | null, method: string, pathName: string, body?: unknown) {
  const res = await fetch(`${BASE}${pathName}`, {
    method,
    headers: {
      ...(client ? { cookie: client.cookie } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: Record<string, unknown> | null = null;
  if ((res.headers.get("content-type") ?? "").includes("application/json")) {
    json = (await res.json()) as Record<string, unknown>;
  }
  return { status: res.status, json, res };
}

async function page(pathName: string, client?: Client) {
  const res = await fetch(`${BASE}${pathName}`, {
    redirect: "manual",
    headers: client ? { cookie: client.cookie } : {},
  });
  const text = res.status === 200 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), text };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runScan(client: Client): Promise<Record<string, unknown>> {
  const scan = await api(client, "POST", "/api/demo/scan");
  if (scan.status !== 202) throw new Error(`scan start → ${scan.status}`);
  const runId = String(scan.json?.runId);
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const poll = await api(client, "GET", `/api/sync-runs/${runId}`);
    const run = poll.json?.run as Record<string, unknown> | undefined;
    if (run && ["completed", "completed_with_errors", "failed"].includes(String(run.status))) return run;
    await sleep(400);
  }
  throw new Error("scan did not complete in time");
}

async function main() {
  section("0. Server reachability");
  try {
    const home = await page("/");
    check(`server responds at ${BASE}`, home.status < 500, `status ${home.status}`);
  } catch (err) {
    console.error(`Cannot reach ${BASE} — start the app first (npm run dev). ${err}`);
    process.exit(1);
  }

  const admin = demoAdminCredentials();
  const demoPass = demoUserPassword();

  section("1. Public site loads before authentication");
  {
    const home = await page("/");
    check("/ renders the public site (200, no redirect)", home.status === 200);
    check("landing shows 85 PDPL controls (not 64 as the total)", home.text.includes("85"));
    check("landing links the platform overview", home.text.includes('href="/platform"'));
    const platform = await page("/platform");
    check("/platform renders publicly", platform.status === 200);
    const signInPage = await page("/sign-in");
    check("/sign-in renders", signInPage.status === 200);
    check(
      "no third-party sign-in buttons",
      !/continue with (google|github|microsoft|apple)/i.test(signInPage.text)
    );
    const signUp = await page("/sign-up");
    check("/sign-up renders", signUp.status === 200);
    const legacy = await page("/signin");
    check("/signin redirects to /sign-in", legacy.status >= 300 && legacy.status < 400 && (legacy.location ?? "").includes("/sign-in"));
    const guarded = await page("/app");
    check("/app requires a session (redirects to /sign-in)", guarded.status >= 300 && (guarded.location ?? "").includes("/sign-in"));
  }

  section("2. Authentication: safe failures, password sign-in, sign-up");
  {
    const bad = await api(null, "POST", "/api/auth/signin", { email: "nobody@nowhere.example", password: "wrong" });
    check("unknown account → 401 with the safe create-account message", bad.status === 401 && String(bad.json?.error).includes("Create an account"));
    const wrongPw = await api(null, "POST", "/api/auth/signin", { email: admin.email, password: "definitely-wrong" });
    check("wrong password → same safe message (no account confirmation)", wrongPw.status === 401 && String(wrongPw.json?.error) === String(bad.json?.error));

    const suffix = Date.now().toString(36);
    const signup = await api(null, "POST", "/api/auth/signup", {
      name: "Verify Runner", email: `verify.${suffix}@example.com`, password: "verify-pass-123", organizationName: "Verify Ltd",
    });
    check("sign-up creates an account (201)", signup.status === 201);
    const dup = await api(null, "POST", "/api/auth/signup", {
      name: "Verify Runner", email: `verify.${suffix}@example.com`, password: "verify-pass-123",
    });
    check("duplicate sign-up → 409", dup.status === 409);
  }

  const platformAdmin = await signIn(admin.email, admin.password);
  const reset0 = await api(platformAdmin, "POST", "/api/demo/reset");
  section("3. Reset to a known state; admin routes are protected");
  {
    check("platform admin resets the demonstration", reset0.status === 200);
    const opsAsAdmin = await page("/admin/backend-operations", platformAdmin);
    check("admin can open Backend operations", opsAsAdmin.status === 200);
    check("Backend operations names the monitored company", opsAsAdmin.text.includes("Nile Digital Services"));
    const member = await signIn("hana.ibrahim@niledigital.example", demoPass); // viewer
    const opsAsViewer = await page("/admin/backend-operations", member);
    check("viewer gets 404 on Backend operations", opsAsViewer.status === 404);
    const monitored = await page("/admin/monitored-data", member);
    check("viewer gets 404 on Monitored data", monitored.status === 404);
  }

  const demoOrg = await prisma.organization.findFirst({ where: { demoOrganization: true } });
  if (!demoOrg) throw new Error("No demo organization.");

  section("4. The scan actually reads the vault files");
  const salma = await signIn("salma.fawzy@niledigital.example", demoPass);
  let firstRun: Record<string, unknown>;
  {
    firstRun = await runScan(salma);
    check("scan completes", firstRun.status === "completed", String(firstRun.status));
    check("18 files discovered", firstRun.resourcesDiscovered === 18, `${firstRun.resourcesDiscovered}`);
    check("18 files read", firstRun.filesRead === 18, `${firstRun.filesRead}`);
    check("1,685 records inspected (actual parsed rows)", firstRun.rowsInspected === 1685, `${firstRun.rowsInspected}`);
    check("rules evaluated across every resource", Number(firstRun.rulesEvaluated) === 18 * 12, `${firstRun.rulesEvaluated}`);
    check("23 findings created", firstRun.findingsCreated === 23, `${firstRun.findingsCreated}`);
    check("11 evidence candidates", firstRun.evidenceCandidatesCreated === 11, `${firstRun.evidenceCandidatesCreated}`);
    check("zero errors", firstRun.errorsCount === 0, `${firstRun.errorsCount}`);

    const resources = await prisma.connectorResource.findMany({ where: { organizationId: demoOrg.id } });
    check("18 resources persisted with checksums and row counts", resources.length === 18 && resources.every((r) => r.checksum && r.rowCount >= 0));
    const employees = resources.find((r) => r.name === "Employees.xlsx");
    check("Employees.xlsx parsed to 180 rows", employees?.rowCount === 180, `${employees?.rowCount}`);
    const mappings = await prisma.findingControlMapping.count({ where: { finding: { organizationId: demoOrg.id } } });
    check("18 finding → control mappings", mappings === 18, `${mappings}`);
    const findings = await prisma.monitoringFinding.findMany({ where: { organizationId: demoOrg.id } });
    check("every finding is status new with matched values", findings.every((f) => f.status === "new" && !!f.matchedValues));
    const before = JSON.parse(String(firstRun.scoreBefore)) as Record<string, number | null>;
    const after = JSON.parse(String(firstRun.scoreAfter)) as Record<string, number | null>;
    check("official readiness unchanged by the scan", before.readinessScore === after.readinessScore, `${before.readinessScore} → ${after.readinessScore}`);
  }

  section("5. Second scan: no changes, no duplicates");
  {
    const run2 = await runScan(salma);
    check("second scan completes", run2.status === "completed");
    check("zero new findings (dedup)", run2.findingsCreated === 0, `${run2.findingsCreated}`);
    const cs = JSON.parse(String(run2.changeSummary)) as { new: string[]; changed: string[]; removed: string[] };
    check("change detection reports nothing new/changed/removed", cs.new.length === 0 && cs.changed.length === 0 && cs.removed.length === 0);
  }

  section("6. Inject Demo Change → the next scan detects it");
  {
    const notAdmin = await api(salma, "POST", "/api/demo/inject", { scenario: "share_employees_publicly" });
    check("inject requires platform admin (404 for client admin)", notAdmin.status === 404, `${notAdmin.status}`);
    const inject = await api(platformAdmin, "POST", "/api/demo/inject", { scenario: "share_employees_publicly" });
    check("admin injects the public-sharing change", inject.status === 200);
    const inject2 = await api(platformAdmin, "POST", "/api/demo/inject", { scenario: "add_training_evidence" });
    check("admin injects the new-evidence-file change", inject2.status === 200);

    const run3 = await runScan(salma);
    const cs = JSON.parse(String(run3.changeSummary)) as { new: string[]; changed: string[]; removed: string[] };
    check("scan detects the CHANGED manifest entry", cs.changed.includes("Employees.xlsx") || cs.new.includes("Employees.xlsx"), JSON.stringify(cs));
    check("scan detects the NEW training file", cs.new.includes("Training_Refresher_Q3.xlsx"), JSON.stringify(cs));
    const accessFinding = await prisma.monitoringFinding.findFirst({
      where: { organizationId: demoOrg.id, dedupKey: "MON-ACCESS-001:vault-employees" },
    });
    check("MON-ACCESS-001 finding created for Employees.xlsx", !!accessFinding && accessFinding.status === "new");
    check("new findings from the change", Number(run3.findingsCreated) >= 2, `${run3.findingsCreated}`);
  }

  section("7. Reverting data auto-resolves never-reviewed findings");
  {
    const revert = await api(platformAdmin, "POST", "/api/demo/reset");
    check("reset restores the vault", revert.status === 200);
    const run4 = await runScan(salma);
    check("post-reset scan completes", run4.status === "completed");
    const open = await prisma.monitoringFinding.count({ where: { organizationId: demoOrg.id, status: "new" } });
    check("baseline restored: 23 findings await review", open === 23, `${open}`);
  }

  section("8. Active monitoring");
  {
    const start = await api(platformAdmin, "POST", "/api/monitoring", { action: "start", intervalSeconds: 30 });
    check("start monitoring → 200", start.status === 200);
    const connector = await prisma.connector.findFirst({ where: { organizationId: demoOrg.id } });
    check("monitoring persisted as enabled with nextSyncAt", connector?.monitoringEnabled === true && !!connector?.nextSyncAt);
    // The 5s ticker should fire a scheduled scan within ~15s.
    let scheduled = 0;
    for (let i = 0; i < 30 && scheduled === 0; i++) {
      await sleep(1000);
      scheduled = await prisma.synchronizationRun.count({
        where: { organizationId: demoOrg.id, triggerType: "scheduled" },
      });
    }
    check("the scheduler triggered a scheduled scan", scheduled > 0, `${scheduled}`);
    const stop = await api(platformAdmin, "POST", "/api/monitoring", { action: "stop" });
    check("stop monitoring → 200", stop.status === 200);
    const after = await prisma.connector.findFirst({ where: { organizationId: demoOrg.id } });
    check("monitoring persisted as paused", after?.monitoringEnabled === false && after?.nextSyncAt === null);
  }

  section("9. Synthetic row preview: masked by default, admin reveal");
  {
    const masked = await api(salma, "GET", `/api/vault/preview?file=${encodeURIComponent("Employees.xlsx")}`);
    check("preview returns sample rows", masked.status === 200 && Array.isArray(masked.json?.rows));
    const rows = (masked.json?.rows ?? []) as Record<string, unknown>[];
    check("personal fields are masked by default", rows.length > 0 && String(rows[0].full_name).includes("•"));
    check("preview declares the data synthetic", String(masked.json?.note).toLowerCase().includes("synthetic"));
    const revealDenied = await api(salma, "GET", `/api/vault/preview?file=Employees.xlsx&reveal=true`);
    check("reveal denied for non-platform-admin → 403", revealDenied.status === 403, `${revealDenied.status}`);
    const revealed = await api(platformAdmin, "GET", `/api/vault/preview?file=Employees.xlsx&reveal=true`);
    const rrows = (revealed.json?.rows ?? []) as Record<string, unknown>[];
    check("platform admin can reveal synthetic rows", revealed.status === 200 && rrows.length > 0 && !String(rrows[0].full_name).includes("•"));
  }

  section("10. Excel monitoring workbook: 26 sheets incl. raw synthetic data");
  {
    const res = await fetch(`${BASE}/api/exports/full`, { headers: { cookie: platformAdmin.cookie } });
    check("workbook downloads (200)", res.status === 200);
    const buffer = Buffer.from(await res.arrayBuffer());
    const ExcelJS = (await import("exceljs")).default;
    const { WORKBOOK_SHEETS } = await import("../src/lib/excel");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const names = wb.worksheets.map((w) => w.name);
    check("exactly 26 sheets matching the contract", JSON.stringify(names) === JSON.stringify([...WORKBOOK_SHEETS]), names.join("|"));
    const employeesSheet = wb.getWorksheet("Raw Demo Employees");
    check("Raw Demo Employees holds the actual 180 synthetic rows", (employeesSheet?.rowCount ?? 0) >= 181, `${employeesSheet?.rowCount}`);
    const findingsSheet = wb.getWorksheet("Monitoring Findings");
    check("Monitoring Findings sheet is populated", (findingsSheet?.rowCount ?? 0) >= 24, `${findingsSheet?.rowCount}`);
    let leaked = "";
    const needles = [/password/i, /secret/i, /token/i, /credential(?!s? reference)/i];
    for (const ws of wb.worksheets) {
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          const text = String(cell.value ?? "");
          for (const n of needles) if (n.test(text)) leaked = `${ws.name}: ${text.slice(0, 60)}`;
        });
      });
    }
    check("no credential-like strings anywhere", leaked === "", leaked);
  }

  section("11. Lineage + audit");
  {
    const finding = await prisma.monitoringFinding.findFirst({
      where: { organizationId: demoOrg.id, ruleCode: "MON-SECURITY-001" },
    });
    const nour = await signIn("nour.elsayed@niledigital.example", demoPass);
    const detail = await api(nour, "GET", `/api/findings/${finding!.id}`);
    check("finding detail returns matched values", detail.status === 200 && !!(detail.json?.finding as Record<string, unknown>)?.matchedValues);
    const trail = (detail.json?.auditTrail ?? []) as Array<Record<string, unknown>>;
    check("lineage: automated finding_created audit exists", trail.some((t) => t.action === "finding_created" && t.origin === "automated_rule"));
    const origins = await prisma.auditLog.groupBy({ by: ["origin"], where: { organizationId: demoOrg.id } });
    check("audit trail carries human + automated_rule + system_job origins",
      ["human", "automated_rule", "system_job"].every((o) => origins.some((x) => x.origin === o)));
  }

  section("12. Final reset");
  {
    const reset = await api(platformAdmin, "POST", "/api/demo/reset");
    check("reset → 200", reset.status === 200);
    const findings = await prisma.monitoringFinding.count({ where: { organizationId: demoOrg.id } });
    check("findings cleared", findings === 0, `${findings}`);
    const assessment = await prisma.assessment.findFirst({
      where: { organizationId: demoOrg.id, title: "PDPL & GDPR readiness review 2026" },
      include: { _count: { select: { answers: true } } },
    });
    check("demo assessment re-seeded with 149 controls", assessment?._count.answers === 149);
    const audit = await prisma.auditLog.count({ where: { organizationId: demoOrg.id } });
    check("audit trail preserved", audit > 50, `${audit}`);
  }

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
