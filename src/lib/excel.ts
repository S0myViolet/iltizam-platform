// Excel export — a real multi-sheet XLSX workbook for stakeholder review.
// The database remains the source of truth; scores and gaps come from the
// central engines (never recomputed here). No credentials, tokens, sessions
// or storage keys are ever written to the workbook.

import ExcelJS from "exceljs";
import { prisma } from "./db";
import { getAssessmentBundle } from "./assessments";
import { GAP_REASON_LABELS } from "./gaps";
import { LEGAL_DISCLAIMER, MONITORING_DISCLAIMER, SEVERITY_LABELS } from "./types";
import type { Severity } from "./types";

export const WORKBOOK_SHEETS = [
  "Overview",
  "Organization",
  "Users",
  "Regulations",
  "Control Domains",
  "Controls",
  "Regulation Mappings",
  "Assessments",
  "Assessment Answers",
  "Evidence Register",
  "Data Inventory",
  "Connectors",
  "Synchronization Runs",
  "Source Resources",
  "Monitoring Rules",
  "Monitoring Findings",
  "Finding Control Mappings",
  "Gap Register",
  "Domain Scores",
  "Regulation Scores",
  "Reports",
  "Audit Log",
] as const;

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
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
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
const arr = (v: string) => {
  try {
    const p = JSON.parse(v);
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

  const [
    memberships,
    regulations,
    domains,
    controls,
    mappings,
    assessments,
    evidence,
    inventory,
    connectors,
    syncRuns,
    resources,
    rules,
    findings,
    findingMappings,
    reports,
    auditLogs,
  ] = await Promise.all([
    prisma.organizationMembership.findMany({ where: { organizationId }, include: { user: true } }),
    prisma.regulation.findMany({ orderBy: { code: "asc" } }),
    prisma.controlDomain.findMany({ orderBy: [{ displayOrder: "asc" }, { code: "asc" }] }),
    prisma.control.findMany({
      include: { domain: true, regulationMappings: { include: { regulation: true } } },
      orderBy: { controlCode: "asc" },
    }),
    prisma.regulationControlMapping.findMany({ include: { regulation: true, control: true } }),
    prisma.assessment.findMany({ where: { organizationId }, include: { regulations: { include: { regulation: true } } } }),
    prisma.evidence.findMany({
      where: { organizationId },
      include: { answer: { include: { control: true } } },
      orderBy: { uploadedAt: "asc" },
    }),
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
    prisma.report.findMany({ where: { organizationId } }),
    prisma.auditLog.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Iltzam";

  // 1. Overview
  const s = bundle?.scores;
  const lastRun = syncRuns[syncRuns.length - 1];
  const overview = wb.addWorksheet("Overview");
  overview.columns = [{ width: 38 }, { width: 80 }];
  const put = (k: string, v: string | number) => overview.addRow([k, v]);
  put("Export", "Iltzam backend demonstration export");
  put("Organization", org.name);
  put("Country", org.country ?? "");
  put("Generated", dt(new Date()));
  put("Generated by", generatedBy);
  put("Assessment", assessmentRow?.title ?? "—");
  put("Selected regulations", bundle?.assessment.selectedRegimes.join(" · ") ?? "—");
  put("Overall readiness (official)", pct(s?.readinessScore));
  put("Mandatory readiness", pct(s?.mandatoryScore));
  put("Evidence readiness", pct(s?.evidenceReadiness));
  put("Total controls in assessment", s?.totalControls ?? 0);
  put("Total gaps", bundle?.gaps.length ?? 0);
  put("Mandatory gaps (answered No)", s?.mandatoryGaps ?? 0);
  put("Evidence gaps (Yes without accepted evidence)", s?.controlsMissingEvidence ?? 0);
  put("Inventory records", inventory.length);
  put("Monitoring findings", findings.length);
  put("Findings awaiting human review", findings.filter((f) => f.status === "new").length);
  put("Last synchronization", lastRun ? `${lastRun.status} (${dt(lastRun.completedAt ?? lastRun.createdAt)})` : "—");
  put("Disclaimer", LEGAL_DISCLAIMER);
  put("Monitoring note", MONITORING_DISCLAIMER);
  overview.getColumn(1).font = { bold: true };
  overview.eachRow((r) => (r.alignment = { vertical: "top", wrapText: true }));

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
    { k: "Registration number", v: org.registrationNumber ?? "" },
    { k: "Primary contact", v: `${org.primaryContactName ?? ""} <${org.primaryContactEmail ?? ""}>` },
    { k: "Timezone", v: org.timezone ?? "" },
    { k: "Demonstration organization", v: org.demoOrganization ? "Yes" : "No" },
    { k: "Created", v: dt(org.createdAt) },
  ]);

  // 3. Users
  addTable(wb, "Users", [
    { header: "Name", key: "name", width: 26 },
    { header: "Email", key: "email", width: 36 },
    { header: "Role", key: "role", width: 22 },
    { header: "Status", key: "status", width: 14 },
    { header: "Joined", key: "joined", width: 14 },
  ], memberships.map((m) => ({
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    status: m.status,
    joined: d(m.joinedAt),
  })));

  // 4. Regulations
  addTable(wb, "Regulations", [
    { header: "Code", key: "code", width: 12 },
    { header: "Name", key: "name", width: 44 },
    { header: "Jurisdiction", key: "jur", width: 18 },
    { header: "Legal instrument", key: "inst", width: 44 },
    { header: "Regulator", key: "reg", width: 32 },
    { header: "Compliance deadline", key: "deadline", width: 18 },
    { header: "Status", key: "status", width: 22 },
  ], regulations.map((r) => ({
    code: r.code,
    name: r.name,
    jur: r.jurisdiction ?? "",
    inst: r.legalInstrument ?? "",
    reg: r.regulator ?? "",
    deadline: d(r.complianceDeadline),
    status: r.status,
  })));

  // 5. Control Domains
  addTable(wb, "Control Domains", [
    { header: "Code", key: "code", width: 10 },
    { header: "Name", key: "name", width: 36 },
    { header: "Order", key: "order", width: 8 },
    { header: "Description", key: "desc", width: 70 },
  ], domains.map((x) => ({ code: x.code, name: x.name, order: x.displayOrder, desc: x.description ?? "" })));

  // 6. Controls
  addTable(wb, "Controls", [
    { header: "Control Code", key: "code", width: 12 },
    { header: "Domain", key: "domain", width: 28 },
    { header: "Control Question", key: "q", width: 80 },
    { header: "Severity", key: "sev", width: 18 },
    { header: "Regulations", key: "regs", width: 18 },
    { header: "Legal Basis", key: "basis", width: 22 },
    { header: "Provisional", key: "prov", width: 11 },
    { header: "Evidence Examples", key: "ev", width: 44 },
  ], controls.map((c) => ({
    code: c.controlCode,
    domain: c.domain.name,
    q: c.question,
    sev: SEVERITY_LABELS[c.severity as Severity] ?? c.severity,
    regs: c.regulationMappings.map((m) => m.regulation.code).join(" · "),
    basis: c.regulationMappings.map((m) => m.legalBasis).filter(Boolean).join(" · "),
    prov: c.provisional ? "Yes" : "",
    ev: arr(c.evidenceExamples),
  })));

  // 7. Regulation Mappings
  addTable(wb, "Regulation Mappings", [
    { header: "Control Code", key: "c", width: 12 },
    { header: "Regulation", key: "r", width: 12 },
    { header: "Legal Basis", key: "b", width: 24 },
    { header: "Mapping Type", key: "t", width: 20 },
    { header: "Provisional", key: "p", width: 11 },
    { header: "Notes", key: "n", width: 60 },
  ], mappings.map((m) => ({
    c: m.control.controlCode,
    r: m.regulation.code,
    b: m.legalBasis ?? "",
    t: m.mappingType,
    p: m.provisional ? "Yes" : "",
    n: m.mappingNotes ?? "",
  })));

  // 8. Assessments
  addTable(wb, "Assessments", [
    { header: "Title", key: "t", width: 40 },
    { header: "Status", key: "s", width: 16 },
    { header: "Regulations", key: "r", width: 22 },
    { header: "Official Readiness", key: "score", width: 16 },
    { header: "Mandatory Readiness", key: "m", width: 16 },
    { header: "Started", key: "st", width: 14 },
    { header: "Next Review", key: "nr", width: 14 },
  ], assessments.map((a) => ({
    t: a.title,
    s: a.status,
    r: a.regulations.map((x) => x.regulation.code).join(" · "),
    score: pct(a.readinessScore),
    m: pct(a.mandatoryScore),
    st: d(a.startedAt),
    nr: d(a.nextReviewAt),
  })));

  // 9. Assessment Answers
  addTable(wb, "Assessment Answers", [
    { header: "Control Code", key: "code", width: 12 },
    { header: "Domain", key: "domain", width: 26 },
    { header: "Control Question", key: "q", width: 70 },
    { header: "Severity", key: "sev", width: 17 },
    { header: "Regulation", key: "regs", width: 16 },
    { header: "Legal Basis", key: "basis", width: 20 },
    { header: "Answer", key: "ans", width: 14 },
    { header: "Evidence Status", key: "ev", width: 22 },
    { header: "Owner", key: "owner", width: 20 },
    { header: "Due Date", key: "due", width: 12 },
    { header: "Remediation", key: "rem", width: 18 },
    { header: "Notes", key: "notes", width: 44 },
  ], (bundle?.rows ?? []).map((r) => ({
    code: r.controlCode,
    domain: r.domain,
    q: r.question,
    sev: SEVERITY_LABELS[r.severity],
    regs: r.regimes.map((m) => m.code).join(" · "),
    basis: r.regimes.map((m) => m.legalBasis).filter(Boolean).join(" · "),
    ans: r.answer,
    ev:
      r.evidence.length === 0
        ? "None attached"
        : `${r.evidence.filter((e) => e.reviewStatus === "accepted").length} accepted / ${r.evidence.length} total`,
    owner: r.ownerName ?? "Unassigned",
    due: d(r.dueDate),
    rem: r.remediationStatus,
    notes: r.notes ?? "",
  })));

  // 10. Evidence Register
  addTable(wb, "Evidence Register", [
    { header: "Evidence", key: "n", width: 40 },
    { header: "Control Code", key: "c", width: 12 },
    { header: "Type", key: "t", width: 18 },
    { header: "Kind", key: "k", width: 8 },
    { header: "Human Review Status", key: "rs", width: 18 },
    { header: "Reviewer Notes", key: "rn", width: 30 },
    { header: "Uploaded By", key: "by", width: 20 },
    { header: "Uploaded At", key: "at", width: 16 },
    { header: "Reviewed At", key: "rat", width: 16 },
    { header: "Expires", key: "exp", width: 12 },
  ], evidence.map((e) => ({
    n: e.fileName,
    c: e.answer.control.controlCode,
    t: e.evidenceType,
    k: e.kind,
    rs: e.reviewStatus,
    rn: e.reviewNotes ?? "",
    by: e.uploadedBy ?? "",
    at: dt(e.uploadedAt),
    rat: dt(e.reviewedAt),
    exp: d(e.expiresAt),
  })));

  // 11. Data Inventory
  addTable(wb, "Data Inventory", [
    { header: "Name", key: "n", width: 36 },
    { header: "System", key: "sys", width: 24 },
    { header: "Source", key: "src", width: 12 },
    { header: "Business Owner", key: "bo", width: 18 },
    { header: "Data Categories", key: "dc", width: 32 },
    { header: "Sensitive Categories", key: "sc", width: 20 },
    { header: "Personal Data", key: "p", width: 12 },
    { header: "Sensitive Data", key: "s", width: 12 },
    { header: "Cross-Border", key: "x", width: 12 },
    { header: "Destinations", key: "dest", width: 18 },
    { header: "Retention", key: "ret", width: 20 },
    { header: "Sharing", key: "sh", width: 10 },
    { header: "Encryption", key: "enc", width: 12 },
    { header: "Last Scanned", key: "ls", width: 16 },
  ], inventory.map((i) => ({
    n: i.name,
    sys: i.systemName ?? "",
    src: i.sourceType,
    bo: i.businessOwner ?? "",
    dc: arr(i.dataCategories),
    sc: arr(i.sensitiveDataCategories),
    p: i.containsPersonalData ? "Yes" : "No",
    s: i.containsSensitiveData ? "Yes" : "No",
    x: i.crossBorderTransfer ? "Yes" : "No",
    dest: arr(i.destinationCountries),
    ret: i.retentionPeriod ?? "Not documented",
    sh: i.sharingStatus ?? "",
    enc: i.encryptionStatus ?? "",
    ls: dt(i.lastScannedAt),
  })));

  // 12. Connectors — no credentials, no tokens.
  addTable(wb, "Connectors", [
    { header: "Connector", key: "n", width: 26 },
    { header: "Provider", key: "p", width: 18 },
    { header: "Status", key: "s", width: 12 },
    { header: "Granted Scopes", key: "sc", width: 28 },
    { header: "Last Sync", key: "ls", width: 16 },
  ], connectors.map((c) => ({
    n: c.displayName,
    p: c.provider,
    s: c.status,
    sc: arr(c.grantedScopes),
    ls: dt(c.lastSyncAt),
  })));

  // 13. Synchronization Runs
  addTable(wb, "Synchronization Runs", [
    { header: "Run", key: "id", width: 28 },
    { header: "Status", key: "s", width: 12 },
    { header: "Stage", key: "st", width: 18 },
    { header: "Trigger", key: "t", width: 14 },
    { header: "Started", key: "sa", width: 16 },
    { header: "Completed", key: "ca", width: 16 },
    { header: "Resources", key: "r", width: 10 },
    { header: "Created", key: "c", width: 9 },
    { header: "Updated", key: "u", width: 9 },
    { header: "Findings", key: "f", width: 9 },
    { header: "Evidence Candidates", key: "e", width: 12 },
    { header: "Errors", key: "err", width: 8 },
  ], syncRuns.map((r) => ({
    id: r.id,
    s: r.status,
    st: r.stage,
    t: r.triggerType,
    sa: dt(r.startedAt),
    ca: dt(r.completedAt),
    r: r.resourcesDiscovered,
    c: r.resourcesCreated,
    u: r.resourcesUpdated,
    f: r.findingsCreated,
    e: r.evidenceCandidatesCreated,
    err: r.errorsCount,
  })));

  // 14. Source Resources
  addTable(wb, "Source Resources", [
    { header: "External ID", key: "x", width: 14 },
    { header: "Name", key: "n", width: 38 },
    { header: "Location", key: "l", width: 32 },
    { header: "Owner", key: "o", width: 18 },
    { header: "Sharing", key: "s", width: 10 },
    { header: "Classification", key: "c", width: 13 },
    { header: "Modified", key: "m", width: 16 },
    { header: "Last Seen", key: "ls", width: 16 },
  ], resources.map((r) => ({
    x: r.externalId,
    n: r.name,
    l: r.location ?? "",
    o: r.owner ?? "",
    s: r.sharingStatus ?? "",
    c: r.classification ?? "",
    m: dt(r.modifiedExternallyAt),
    ls: dt(r.lastSeenAt),
  })));

  // 15. Monitoring Rules
  addTable(wb, "Monitoring Rules", [
    { header: "Monitoring Rule Code", key: "c", width: 20 },
    { header: "Monitoring Rule Version", key: "v", width: 10 },
    { header: "Monitoring Rule Name", key: "n", width: 40 },
    { header: "Category", key: "cat", width: 20 },
    { header: "Severity", key: "s", width: 10 },
    { header: "Rule Condition Summary", key: "cond", width: 60 },
    { header: "Related Controls", key: "rc", width: 26 },
    { header: "Regulations", key: "regs", width: 12 },
    { header: "Requires Human Review", key: "hr", width: 12 },
    { header: "Recommended Action", key: "ra", width: 50 },
  ], rules.map((r) => ({
    c: r.code,
    v: r.version,
    n: r.name,
    cat: r.category,
    s: r.severity,
    cond: r.conditionConfiguration,
    rc: arr(r.relatedControlCodes),
    regs: arr(r.regulationCodes),
    hr: r.requiresHumanReview ? "Yes" : "No",
    ra: r.recommendedAction,
  })));

  // 16. Monitoring Findings
  addTable(wb, "Monitoring Findings", [
    { header: "Finding", key: "t", width: 50 },
    { header: "Severity", key: "s", width: 10 },
    { header: "Finding Status", key: "st", width: 16 },
    { header: "Human Review Status", key: "hr", width: 22 },
    { header: "Monitoring Rule Code", key: "rc", width: 18 },
    { header: "Monitoring Rule Version", key: "rv", width: 10 },
    { header: "Source Resource", key: "sr", width: 32 },
    { header: "Evidence Candidate", key: "ec", width: 12 },
    { header: "Detected At", key: "da", width: 16 },
    { header: "Reviewer", key: "rev", width: 18 },
    { header: "Review Date", key: "rd", width: 16 },
    { header: "Related Controls", key: "ctl", width: 24 },
    { header: "Action Origin", key: "ao", width: 16 },
    { header: "AI Assistance Used", key: "ai", width: 14 },
  ], findings.map((f) => ({
    t: f.title,
    s: f.severity,
    st: f.status,
    hr: f.status === "new" ? "Awaiting human review" : f.status,
    rc: f.ruleCode,
    rv: f.ruleVersion,
    sr: f.resource?.name ?? "",
    ec: f.isEvidenceCandidate ? "Yes" : "",
    da: dt(f.detectedAt),
    rev: f.reviewedByName ?? "",
    rd: dt(f.reviewedAt),
    ctl: f.controlMappings.map((m) => m.control.controlCode).join(" · "),
    ao: "automated_rule",
    ai: "No",
  })));

  // 17. Finding Control Mappings
  addTable(wb, "Finding Control Mappings", [
    { header: "Finding", key: "f", width: 50 },
    { header: "Related Control", key: "c", width: 14 },
    { header: "Mapping Source", key: "s", width: 20 },
    { header: "Mapping Confidence", key: "conf", width: 16 },
    { header: "Review Status", key: "r", width: 14 },
    { header: "Reason", key: "why", width: 60 },
  ], findingMappings.map((m) => ({
    f: m.finding.title,
    c: m.control.controlCode,
    s: m.mappingSource,
    conf: m.mappingConfidence ?? "",
    r: m.reviewStatus,
    why: m.mappingReason,
  })));

  // 18. Gap Register
  addTable(wb, "Gap Register", [
    { header: "Priority", key: "p", width: 9 },
    { header: "Control Code", key: "c", width: 12 },
    { header: "Control Question", key: "q", width: 66 },
    { header: "Domain", key: "d", width: 24 },
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
    p: `P${g.tier}`,
    c: g.controlCode,
    q: g.question,
    d: g.domain,
    s: SEVERITY_LABELS[g.severity],
    r: g.regimes.join(" · "),
    b: Object.values(g.legalBases).filter(Boolean).join(" · "),
    a: g.answer,
    why: g.reasonLabel,
    al: g.alerts.map((x) => GAP_REASON_LABELS[x]).join(", "),
    o: g.ownerName ?? "Unassigned",
    due: d(g.dueDate),
    ra: g.recommendedAction,
  })));

  // 19. Domain Scores
  addTable(wb, "Domain Scores", [
    { header: "Domain", key: "d", width: 32 },
    { header: "Readiness", key: "s", width: 12 },
    { header: "Controls", key: "t", width: 10 },
    { header: "Applicable", key: "a", width: 10 },
    { header: "Compliant", key: "c", width: 10 },
    { header: "Gaps", key: "g", width: 8 },
    { header: "Unanswered", key: "u", width: 11 },
  ], (s?.domainScores ?? []).map((x) => ({
    d: x.domain,
    s: pct(x.score),
    t: x.total,
    a: x.applicable,
    c: x.compliant,
    g: x.gaps,
    u: x.unanswered,
  })));

  // 20. Regulation Scores
  addTable(wb, "Regulation Scores", [
    { header: "Regulation", key: "r", width: 12 },
    { header: "Readiness", key: "s", width: 12 },
    { header: "Mandatory Readiness", key: "m", width: 16 },
    { header: "Evidence Readiness", key: "e", width: 16 },
    { header: "Controls", key: "t", width: 10 },
    { header: "Gaps", key: "g", width: 8 },
    { header: "Unanswered", key: "u", width: 11 },
  ], (s?.regulationScores ?? []).map((x) => ({
    r: x.regulationCode,
    s: pct(x.score),
    m: pct(x.mandatoryScore),
    e: pct(x.evidenceScore),
    t: x.total,
    g: x.gaps,
    u: x.unanswered,
  })));

  // 21. Reports
  addTable(wb, "Reports", [
    { header: "Type", key: "t", width: 24 },
    { header: "Status", key: "s", width: 12 },
    { header: "Generated", key: "g", width: 16 },
  ], reports.map((r) => ({ t: r.type, s: r.status, g: dt(r.generatedAt ?? r.createdAt) })));

  // 22. Audit Log
  addTable(wb, "Audit Log", [
    { header: "When", key: "w", width: 16 },
    { header: "Action Origin", key: "o", width: 15 },
    { header: "Action", key: "a", width: 30 },
    { header: "Actor", key: "actor", width: 20 },
    { header: "Entity", key: "e", width: 22 },
    { header: "Summary", key: "s", width: 90 },
  ], auditLogs.map((l) => ({
    w: dt(l.createdAt),
    o: l.origin,
    a: l.action,
    actor: l.actorName ?? (l.origin === "human" ? "" : "system"),
    e: l.entityType ?? "",
    s: l.summary,
  })));

  return wb;
}

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data as ArrayBuffer);
}
