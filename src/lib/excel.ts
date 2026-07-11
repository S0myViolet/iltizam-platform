// Excel export — the full monitoring workbook. Contains the ACTUAL synthetic
// data the scan read (raw demo datasets), the normalized inventory, the fixed
// rules, findings + control mappings, run history with change detection, the
// deterministic scores, and the audit trail. The database and vault remain
// the sources of truth; scores and gaps come from the central engines.
// No credentials, tokens, sessions or storage keys are ever written here.
// Raw synthetic rows are exported ONLY for the flagged demo organization.

import ExcelJS from "exceljs";
import { prisma } from "./db";
import { getAssessmentBundle } from "./assessments";
import { GAP_REASON_LABELS } from "./gaps";
import { LEGAL_DISCLAIMER, MONITORING_DISCLAIMER, SEVERITY_LABELS } from "./types";
import type { Severity } from "./types";
import { parseVaultFile, vaultExists } from "./vault";

export const WORKBOOK_SHEETS = [
  "Overview",
  "Organization",
  "Source Systems",
  "Source Files",
  "Raw Demo Employees",
  "Raw Demo Recruitment",
  "Raw Demo Payroll",
  "Raw Demo Biometric Data",
  "Raw Demo Marketing Leads",
  "Raw Demo Consent Log",
  "Raw Demo Rights Requests",
  "Raw Demo Vendors",
  "Raw Demo Incidents",
  "Raw Demo Training",
  "Data Inventory",
  "Monitoring Rules",
  "Monitoring Findings",
  "Finding Control Mappings",
  "Evidence Candidates",
  "Confirmed Evidence",
  "Synchronization Runs",
  "Changed Resources",
  "Gap Register",
  "Domain Scores",
  "Regulation Scores",
  "Audit Log",
] as const;

/** Raw dataset sheets → the vault file each one is read from. */
export const RAW_SHEET_SOURCES: Record<string, string> = {
  "Raw Demo Employees": "Employees.xlsx",
  "Raw Demo Recruitment": "Recruitment_Candidates.xlsx",
  "Raw Demo Payroll": "Payroll_Archive_2022.xlsx",
  "Raw Demo Biometric Data": "Biometric_Access_Records.xlsx",
  "Raw Demo Marketing Leads": "Marketing_Leads.xlsx",
  "Raw Demo Consent Log": "Customer_Consent_Log.xlsx",
  "Raw Demo Rights Requests": "Data_Subject_Requests.xlsx",
  "Raw Demo Vendors": "Cross_Border_Vendors.xlsx",
  "Raw Demo Incidents": "Security_Incident_Register.xlsx",
  "Raw Demo Training": "Training_Completion_Records.xlsx",
};

const MAX_RAW_ROWS = 1000;

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF141927" },
};

function addTable(
  wb: ExcelJS.Workbook,
  name: (typeof WORKBOOK_SHEETS)[number],
  columns: { header: string; key: string; width?: number }[],
  rows: Record<string, unknown>[]
) {
  const ws = wb.addWorksheet(name);
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 22 }));
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFF0ECDF" } };
  header.fill = HEADER_FILL;
  ws.views = [{ state: "frozen", ySplit: 1 }];
  if (columns.length > 0) {
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  }
  for (const r of rows) ws.addRow(r);
  ws.eachRow((row, n) => {
    if (n === 1) return;
    row.alignment = { vertical: "top", wrapText: true };
  });
  return ws;
}

const d = (v: Date | null | undefined) => (v ? v.toISOString().slice(0, 10) : "");
const dt = (v: Date | null | undefined) => (v ? v.toISOString().replace("T", " ").slice(0, 16) : "");
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "Not scorable" : `${v}%`);
const arr = (v: string | null) => {
  try {
    const p = JSON.parse(v ?? "[]");
    return Array.isArray(p) ? p.join(", ") : "";
  } catch {
    return "";
  }
};

export async function buildDemoWorkbook(organizationId: string, generatedBy: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const assessmentRow = await prisma.assessment.findFirst({
    where: { organizationId, archivedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const bundle = assessmentRow ? await getAssessmentBundle(assessmentRow.id) : null;

  const [inventory, connectors, syncRuns, resources, rules, findings, findingMappings, evidence, auditLogs] =
    await Promise.all([
      prisma.dataInventoryItem.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
      prisma.connector.findMany({ where: { organizationId } }),
      prisma.synchronizationRun.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } }),
      prisma.connectorResource.findMany({ where: { organizationId }, orderBy: { externalId: "asc" } }),
      prisma.monitoringRule.findMany({ orderBy: [{ code: "asc" }, { version: "asc" }] }),
      prisma.monitoringFinding.findMany({
        where: { organizationId },
        include: { resource: true, controlMappings: { include: { control: true } } },
        orderBy: { detectedAt: "asc" },
      }),
      prisma.findingControlMapping.findMany({
        where: { finding: { organizationId } },
        include: { control: true, finding: true },
      }),
      prisma.evidence.findMany({
        where: { organizationId, reviewStatus: "accepted" },
        include: { answer: { include: { control: true } } },
        orderBy: { uploadedAt: "asc" },
      }),
      prisma.auditLog.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 500 }),
    ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Iltzam";
  const s = bundle?.scores;
  const lastRun = syncRuns[syncRuns.length - 1];

  // 1. Overview
  const overview = wb.addWorksheet("Overview");
  overview.columns = [{ width: 38 }, { width: 84 }];
  const put = (k: string, v: string | number) => overview.addRow([k, v]);
  put("Export", "Iltzam monitoring workbook");
  put("Organization", org.name);
  put("Source", connectors[0]?.displayName ?? "—");
  put("Generated by", generatedBy);
  put("Generated at (UTC)", dt(new Date()));
  put("Latest scan ID", lastRun?.id ?? "No scan on record");
  put("Latest scan completed", dt(lastRun?.completedAt ?? null));
  put("Files read in latest scan", lastRun ? `${lastRun.filesRead}/${lastRun.resourcesDiscovered}` : "—");
  put("Records inspected in latest scan", lastRun?.rowsInspected ?? 0);
  put("Official readiness", pct(s?.readinessScore));
  put("Evidence readiness (accepted only)", pct(s?.evidenceReadiness));
  put("Findings awaiting review", findings.filter((f) => f.status === "new").length);
  put("Data note", "All raw datasets in this workbook are entirely synthetic demonstration data.");
  put("Disclaimer", LEGAL_DISCLAIMER);
  put("Monitoring note", MONITORING_DISCLAIMER);
  overview.getColumn(1).font = { bold: true };
  overview.eachRow((row) => {
    row.alignment = { vertical: "top", wrapText: true };
  });

  // 2. Organization
  addTable(wb, "Organization", [
    { header: "Field", key: "k", width: 28 },
    { header: "Value", key: "v", width: 60 },
  ], [
    { k: "Name", v: org.name },
    { k: "Legal name", v: org.legalName ?? "" },
    { k: "Country", v: org.country ?? "" },
    { k: "Industry", v: org.industry ?? "" },
    { k: "Company size", v: org.companySize ?? "" },
    { k: "Demonstration organization", v: org.demoOrganization ? "Yes — all data synthetic" : "No" },
  ]);

  // 3. Source Systems
  addTable(wb, "Source Systems", [
    { header: "Source", key: "n", width: 36 },
    { header: "Provider", key: "p", width: 20 },
    { header: "Status", key: "s", width: 12 },
    { header: "Monitoring", key: "m", width: 16 },
    { header: "Interval (s)", key: "i", width: 10 },
    { header: "Last Sync", key: "l", width: 16 },
    { header: "Next Sync", key: "x", width: 16 },
  ], connectors.map((c) => ({
    n: c.displayName, p: c.provider, s: c.status,
    m: c.monitoringEnabled ? "Active" : "Paused", i: c.monitoringIntervalSeconds,
    l: dt(c.lastSyncAt), x: dt(c.nextSyncAt),
  })));

  // 4. Source Files
  addTable(wb, "Source Files", [
    { header: "File", key: "n", width: 34 },
    { header: "External ID", key: "e", width: 22 },
    { header: "Type", key: "t", width: 8 },
    { header: "Records", key: "r", width: 9 },
    { header: "Checksum", key: "c", width: 18 },
    { header: "Change", key: "ch", width: 11 },
    { header: "Owner", key: "o", width: 16 },
    { header: "Location", key: "l", width: 34 },
    { header: "Sharing", key: "sh", width: 10 },
    { header: "Classification", key: "cl", width: 12 },
    { header: "Size (bytes)", key: "sz", width: 11 },
    { header: "Last Seen", key: "ls", width: 16 },
  ], resources.map((r) => ({
    n: r.name, e: r.externalId, t: r.fileType ?? "", r: r.rowCount, c: r.checksum ?? "",
    ch: r.changeStatus, o: r.owner ?? "Unassigned", l: r.location ?? "", sh: r.sharingStatus ?? "",
    cl: r.classification ?? "", sz: r.sizeBytes ?? 0, ls: dt(r.lastSeenAt),
  })));

  // 5–14. Raw demo datasets — the actual synthetic rows the scan parsed.
  // Only ever exported for the flagged demo organization.
  for (const [sheetName, fileName] of Object.entries(RAW_SHEET_SOURCES)) {
    const name = sheetName as (typeof WORKBOOK_SHEETS)[number];
    if (!org.demoOrganization || !vaultExists()) {
      addTable(wb, name, [{ header: "Note", key: "n", width: 80 }], [
        { n: "Raw data export is available only for the synthetic demonstration organization." },
      ]);
      continue;
    }
    try {
      const parsed = await parseVaultFile(fileName, MAX_RAW_ROWS);
      addTable(
        wb,
        name,
        parsed.columns.map((c) => ({ header: c, key: c, width: Math.max(12, Math.min(34, c.length + 8)) })),
        parsed.rows as Record<string, unknown>[]
      );
    } catch {
      addTable(wb, name, [{ header: "Note", key: "n", width: 80 }], [
        { n: `Source file ${fileName} could not be read.` },
      ]);
    }
  }

  // 15. Data Inventory
  addTable(wb, "Data Inventory", [
    { header: "System", key: "n", width: 30 },
    { header: "Source", key: "s", width: 22 },
    { header: "Entry Type", key: "t", width: 12 },
    { header: "Owner", key: "o", width: 16 },
    { header: "Records", key: "rc", width: 9 },
    { header: "Data Categories", key: "c", width: 30 },
    { header: "Personal", key: "p", width: 9 },
    { header: "Sensitive", key: "sv", width: 9 },
    { header: "Cross-border", key: "x", width: 11 },
    { header: "Storage", key: "st", width: 20 },
    { header: "Destinations", key: "dst", width: 18 },
    { header: "Retention", key: "r", width: 22 },
    { header: "Sharing", key: "sh", width: 10 },
    { header: "Encryption", key: "e", width: 11 },
    { header: "Last Scanned", key: "ls", width: 16 },
  ], inventory.map((i) => ({
    n: i.name, s: i.systemName ?? "", t: i.sourceType, o: i.businessOwner ?? "Unassigned",
    rc: i.recordCount ?? 0, c: arr(i.dataCategories), p: i.containsPersonalData ? "Yes" : "No",
    sv: i.containsSensitiveData ? "Yes" : "No", x: i.crossBorderTransfer ? "Yes" : "No",
    st: arr(i.storageLocations), dst: arr(i.destinationCountries),
    r: i.retentionPeriod ?? "Not documented", sh: i.sharingStatus ?? "", e: i.encryptionStatus ?? "",
    ls: dt(i.lastScannedAt),
  })));

  // 16. Monitoring Rules
  addTable(wb, "Monitoring Rules", [
    { header: "Code", key: "c", width: 18 },
    { header: "Version", key: "v", width: 8 },
    { header: "Name", key: "n", width: 34 },
    { header: "Category", key: "cat", width: 14 },
    { header: "Severity", key: "s", width: 10 },
    { header: "Condition", key: "cond", width: 60 },
    { header: "Mapped Controls", key: "m", width: 24 },
    { header: "Enabled", key: "e", width: 8 },
  ], rules.map((r) => ({
    c: r.code, v: r.version, n: r.name, cat: r.category, s: r.severity,
    cond: r.conditionConfiguration, m: arr(r.relatedControlCodes), e: r.enabled ? "Yes" : "No",
  })));

  // 17. Monitoring Findings
  addTable(wb, "Monitoring Findings", [
    { header: "Rule", key: "r", width: 18 },
    { header: "v", key: "v", width: 5 },
    { header: "Title", key: "t", width: 52 },
    { header: "Source File", key: "f", width: 28 },
    { header: "Severity", key: "s", width: 10 },
    { header: "Status", key: "st", width: 14 },
    { header: "Matched Values", key: "mv", width: 46 },
    { header: "Evidence Candidate", key: "ec", width: 10 },
    { header: "Mapped Controls", key: "mc", width: 22 },
    { header: "Detected", key: "d", width: 16 },
    { header: "Reviewed By", key: "rb", width: 16 },
    { header: "Action Origin", key: "o", width: 14 },
    { header: "AI Assistance Used", key: "ai", width: 10 },
  ], findings.map((f) => ({
    r: f.ruleCode, v: f.ruleVersion, t: f.title, f: f.resource?.name ?? "",
    s: f.severity, st: f.status, mv: f.matchedValues ?? "",
    ec: f.isEvidenceCandidate ? "Yes" : "No",
    mc: f.controlMappings.map((m) => m.control.controlCode).join(", "),
    d: dt(f.detectedAt), rb: f.reviewedByName ?? "", o: "automated_rule", ai: "No",
  })));

  // 18. Finding Control Mappings
  addTable(wb, "Finding Control Mappings", [
    { header: "Finding", key: "f", width: 52 },
    { header: "Rule", key: "r", width: 18 },
    { header: "Control", key: "c", width: 12 },
    { header: "Mapping Source", key: "s", width: 18 },
    { header: "Review Status", key: "rs", width: 12 },
    { header: "Reason", key: "why", width: 60 },
  ], findingMappings.map((m) => ({
    f: m.finding.title, r: m.finding.ruleCode, c: m.control.controlCode,
    s: m.mappingSource, rs: m.reviewStatus, why: m.mappingReason,
  })));

  // 19. Evidence Candidates (automated, awaiting human attachment/acceptance)
  addTable(wb, "Evidence Candidates", [
    { header: "Source File", key: "f", width: 32 },
    { header: "Suggested Type", key: "t", width: 18 },
    { header: "Status", key: "s", width: 14 },
    { header: "Detected", key: "d", width: 16 },
    { header: "Note", key: "n", width: 56 },
  ], findings.filter((f) => f.isEvidenceCandidate).map((f) => ({
    f: f.resource?.name ?? "", t: f.suggestedEvidenceType ?? "", s: f.status, d: dt(f.detectedAt),
    n: "Candidate only — a human reviewer must attach and accept it before it counts.",
  })));

  // 20. Confirmed Evidence (human-accepted only)
  addTable(wb, "Confirmed Evidence", [
    { header: "Evidence", key: "n", width: 40 },
    { header: "Control", key: "c", width: 12 },
    { header: "Type", key: "t", width: 18 },
    { header: "Uploaded", key: "u", width: 16 },
    { header: "Accepted At", key: "a", width: 16 },
    { header: "Review Notes", key: "rn", width: 40 },
  ], evidence.map((e) => ({
    n: e.fileName, c: e.answer.control.controlCode, t: e.evidenceType,
    u: dt(e.uploadedAt), a: dt(e.reviewedAt), rn: e.reviewNotes ?? "",
  })));

  // 21. Synchronization Runs
  addTable(wb, "Synchronization Runs", [
    { header: "Run ID", key: "id", width: 26 },
    { header: "Trigger", key: "tr", width: 12 },
    { header: "Status", key: "s", width: 18 },
    { header: "Started", key: "st", width: 16 },
    { header: "Completed", key: "c", width: 16 },
    { header: "Files", key: "f", width: 8 },
    { header: "Records", key: "rw", width: 9 },
    { header: "New", key: "n", width: 6 },
    { header: "Changed", key: "ch", width: 8 },
    { header: "Removed", key: "rm", width: 8 },
    { header: "Rules Evaluated", key: "re", width: 12 },
    { header: "Findings", key: "fd", width: 8 },
    { header: "Auto-resolved", key: "fr", width: 11 },
    { header: "Evidence Cand.", key: "ec", width: 11 },
    { header: "Errors", key: "er", width: 7 },
  ], syncRuns.map((r) => ({
    id: r.id, tr: r.triggerType, s: r.status, st: dt(r.startedAt), c: dt(r.completedAt),
    f: r.filesRead, rw: r.rowsInspected, n: r.resourcesCreated, ch: r.resourcesUpdated,
    rm: r.resourcesRemoved, re: r.rulesEvaluated, fd: r.findingsCreated, fr: r.findingsResolved,
    ec: r.evidenceCandidatesCreated, er: r.errorsCount,
  })));

  // 22. Changed Resources — per-run change detection results.
  const changedRows: Record<string, unknown>[] = [];
  for (const run of syncRuns) {
    if (!run.changeSummary) continue;
    try {
      const cs = JSON.parse(run.changeSummary) as { new: string[]; changed: string[]; removed: string[] };
      for (const n of cs.new) changedRows.push({ run: run.id, at: dt(run.completedAt ?? run.createdAt), file: n, kind: "new" });
      for (const n of cs.changed) changedRows.push({ run: run.id, at: dt(run.completedAt ?? run.createdAt), file: n, kind: "changed" });
      for (const n of cs.removed) changedRows.push({ run: run.id, at: dt(run.completedAt ?? run.createdAt), file: n, kind: "removed" });
    } catch { /* ignore malformed summaries */ }
  }
  addTable(wb, "Changed Resources", [
    { header: "Run ID", key: "run", width: 26 },
    { header: "Scan Completed", key: "at", width: 16 },
    { header: "File", key: "file", width: 36 },
    { header: "Change", key: "kind", width: 10 },
  ], changedRows);

  // 23. Gap Register
  addTable(wb, "Gap Register", [
    { header: "Priority", key: "p", width: 9 },
    { header: "Control Code", key: "c", width: 12 },
    { header: "Control Question", key: "q", width: 66 },
    { header: "Domain", key: "dm", width: 24 },
    { header: "Severity", key: "s", width: 17 },
    { header: "Regulation", key: "r", width: 14 },
    { header: "Legal Basis", key: "b", width: 20 },
    { header: "Answer", key: "a", width: 12 },
    { header: "Gap Reason", key: "why", width: 18 },
    { header: "Alerts", key: "al", width: 24 },
    { header: "Owner", key: "o", width: 18 },
    { header: "Due Date", key: "due", width: 12 },
    { header: "Recommended Action", key: "ra", width: 56 },
  ], (bundle?.gaps ?? []).map((g) => ({
    p: `P${g.tier}`, c: g.controlCode, q: g.question, dm: g.domain,
    s: SEVERITY_LABELS[g.severity as Severity], r: g.regimes.join(" · "),
    b: Object.values(g.legalBases).filter(Boolean).join(" · "),
    a: g.answer, why: g.reasonLabel,
    al: g.alerts.map((x) => GAP_REASON_LABELS[x]).join(", "),
    o: g.ownerName ?? "Unassigned", due: d(g.dueDate), ra: g.recommendedAction,
  })));

  // 24. Domain Scores
  addTable(wb, "Domain Scores", [
    { header: "Domain", key: "dm", width: 32 },
    { header: "Readiness", key: "s", width: 12 },
    { header: "Controls", key: "t", width: 10 },
    { header: "Applicable", key: "a", width: 10 },
    { header: "Compliant", key: "c", width: 10 },
    { header: "Gaps", key: "g", width: 8 },
    { header: "Unanswered", key: "u", width: 11 },
  ], (s?.domainScores ?? []).map((x) => ({
    dm: x.domain, s: pct(x.score), t: x.total, a: x.applicable, c: x.compliant, g: x.gaps, u: x.unanswered,
  })));

  // 25. Regulation Scores
  addTable(wb, "Regulation Scores", [
    { header: "Regulation", key: "r", width: 12 },
    { header: "Readiness", key: "s", width: 12 },
    { header: "Mandatory Readiness", key: "m", width: 16 },
    { header: "Evidence Readiness", key: "e", width: 16 },
    { header: "Controls", key: "t", width: 10 },
    { header: "Gaps", key: "g", width: 8 },
    { header: "Unanswered", key: "u", width: 11 },
  ], (s?.regulationScores ?? []).map((x) => ({
    r: x.regulationCode, s: pct(x.score), m: pct(x.mandatoryScore), e: pct(x.evidenceScore),
    t: x.total, g: x.gaps, u: x.unanswered,
  })));

  // 26. Audit Log
  addTable(wb, "Audit Log", [
    { header: "At (UTC)", key: "t", width: 16 },
    { header: "Origin", key: "o", width: 14 },
    { header: "Actor", key: "a", width: 20 },
    { header: "Action", key: "ac", width: 26 },
    { header: "Entity", key: "e", width: 20 },
    { header: "Summary", key: "s", width: 90 },
  ], auditLogs.map((l) => ({
    t: dt(l.createdAt), o: l.origin, a: l.actorName ?? "System", ac: l.action,
    e: l.entityType ?? "", s: l.summary,
  })));

  return wb;
}

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await wb.xlsx.writeBuffer());
}
