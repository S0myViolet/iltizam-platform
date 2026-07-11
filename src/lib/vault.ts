// Nile Digital Services Demo Data Vault — a real, server-readable synthetic
// data source. The generator writes actual XLSX / CSV / JSON / text files plus
// a manifest of file-level context (owner, sharing, retention, transfers…).
// Everything is deterministic: the same seed always produces the same bytes,
// so Reset Demonstration restores the exact starting state.
//
// All records are fictional. No real personal data appears anywhere.

import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import ExcelJS from "exceljs";

export const VAULT_PROVIDER = "local_demo_vault";
export const VAULT_NAME = "Nile Digital Services Demo Data Vault";

export function vaultDir(): string {
  return process.env.DEMO_VAULT_DIR ?? path.join(process.cwd(), "demo-data", "nile-digital-services");
}
const manifestPath = () => path.join(vaultDir(), "manifest.json");

// ─── Manifest ────────────────────────────────────────────────────────────────

export interface VaultEntry {
  externalId: string;
  fileName: string;
  sourceSystem: string;
  location: string;
  owner: string | null;
  storageCountry: string;
  destinationCountries: string[];
  sharingStatus: "private" | "internal" | "broad" | "public";
  accessLevel: "restricted" | "team" | "broad" | "unrestricted";
  encryptionStatus: "encrypted" | "unencrypted" | "unknown";
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  dataCategories: string[];
  retentionPeriod: string | null;
  retentionDate: string | null; // ISO date
  deletionStatus: "not_scheduled" | "scheduled" | "completed";
  externalProcessor: boolean;
  processorAgreementLinked: boolean;
  consentEvidenceLinked: boolean;
  licenceEvidenceLinked: boolean;
  /** Set when the file itself is compliance evidence (policy, licence, register…). */
  evidenceType: string | null;
  createdDate: string;
  modifiedDate: string;
}

export interface VaultManifest {
  source: string;
  provider: string;
  generatedForOrganization: string;
  seed: number;
  note: string;
  entries: VaultEntry[];
}

export function readManifest(): VaultManifest {
  return JSON.parse(fs.readFileSync(manifestPath(), "utf8")) as VaultManifest;
}

export function writeManifest(manifest: VaultManifest): void {
  fs.writeFileSync(manifestPath(), JSON.stringify(manifest, null, 2));
}

export function vaultExists(): boolean {
  return fs.existsSync(manifestPath());
}

export function checksumFile(fileName: string): string {
  const buf = fs.readFileSync(path.join(vaultDir(), fileName));
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

export function fileStat(fileName: string): { sizeBytes: number; modifiedAt: Date } {
  const st = fs.statSync(path.join(vaultDir(), fileName));
  return { sizeBytes: st.size, modifiedAt: st.mtime };
}

// ─── Deterministic PRNG (mulberry32) ─────────────────────────────────────────

const VAULT_SEED = 20260711;

function prng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Ahmed","Mona","Omar","Salma","Karim","Laila","Youssef","Dina","Hana","Nour","Tarek","Rania","Hassan","Farida","Mostafa","Aya","Sherif","Yasmin","Amr","Heba","Khaled","Nadia","Waleed","Mariam","Sami","Iman","Fady","Reem","Hossam","Dalia"];
const LAST = ["Fawzy","Nassar","Mostafa","Fathy","Hassan","Adel","El-Sayed","Ibrahim","Mahmoud","Aziz","Shalaby","Ghanem","Sabry","Younis","Khalil","Ramadan","Barakat","Selim","Zaki","Ashour"];
const DEPTS = ["Engineering","Customer Success","Finance","Human Resources","Marketing","Operations","Legal","Sales"];
const CITIES = ["Cairo","Giza","Alexandria","Mansoura","Tanta","Asyut"];

function pick<T>(r: () => number, arr: T[]): T { return arr[Math.floor(r() * arr.length)]; }
function fullName(r: () => number): string { return `${pick(r, FIRST)} ${pick(r, LAST)}`; }
function email(name: string, domain: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${domain}`;
}
function isoDate(r: () => number, startYear: number, endYear: number): string {
  const y = startYear + Math.floor(r() * (endYear - startYear + 1));
  const m = 1 + Math.floor(r() * 12);
  const d = 1 + Math.floor(r() * 28);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
// Synthetic Egyptian-format national ID (clearly fake range) and phone.
function fakeNationalId(r: () => number): string { return `299${String(Math.floor(r() * 1e10)).padStart(10, "0")}9`; }
function fakePhone(r: () => number): string { return `+20 10${String(Math.floor(r() * 1e8)).padStart(8, "0")}`; }

// ─── File generation ─────────────────────────────────────────────────────────

type Row = Record<string, string | number | boolean | null>;

async function writeXlsx(fileName: string, sheet: string, rows: Row[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheet);
  if (rows.length > 0) {
    const cols = Object.keys(rows[0]);
    ws.addRow(cols);
    ws.getRow(1).font = { bold: true };
    for (const row of rows) ws.addRow(cols.map((c) => row[c]));
  }
  await wb.xlsx.writeFile(path.join(vaultDir(), fileName));
}

function writeCsv(fileName: string, rows: Row[]): void {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(","), ...rows.map((row) => cols.map((c) => esc(row[c])).join(","))];
  fs.writeFileSync(path.join(vaultDir(), fileName), lines.join("\n"));
}

function writeJson(fileName: string, value: unknown): void {
  fs.writeFileSync(path.join(vaultDir(), fileName), JSON.stringify(value, null, 2));
}

function writeText(fileName: string, text: string): void {
  fs.writeFileSync(path.join(vaultDir(), fileName), text);
}

/** Row builders — each uses its own PRNG stream so files are independent. */
function employees(n = 180): Row[] {
  const r = prng(VAULT_SEED + 1);
  return Array.from({ length: n }, (_, i) => {
    const name = fullName(r);
    return {
      employee_id: `NDS-${1000 + i}`, full_name: name,
      national_id: fakeNationalId(r), work_email: email(name, "niledigital.example"),
      phone: fakePhone(r), department: pick(r, DEPTS), city: pick(r, CITIES),
      hire_date: isoDate(r, 2018, 2025), salary_band: `B${1 + Math.floor(r() * 5)}`,
      emergency_contact: fullName(r),
    };
  });
}

function candidates(n = 120): Row[] {
  const r = prng(VAULT_SEED + 2);
  return Array.from({ length: n }, (_, i) => {
    const name = fullName(r);
    return {
      candidate_id: `CAND-${2000 + i}`, full_name: name,
      email: email(name, "mail.example"), phone: fakePhone(r),
      role_applied: pick(r, ["Backend Engineer","Account Manager","HR Generalist","Data Analyst","Support Agent"]),
      application_date: isoDate(r, 2021, 2023), status: pick(r, ["rejected","withdrawn","hired","on_hold"]),
      cv_on_file: true,
    };
  });
}

function payroll(n = 160): Row[] {
  const r = prng(VAULT_SEED + 3);
  return Array.from({ length: n }, (_, i) => {
    const name = fullName(r);
    return {
      employee_id: `NDS-${1000 + (i % 150)}`, full_name: name,
      national_id: fakeNationalId(r), bank_iban: `EG${String(Math.floor(r() * 1e16)).padStart(25, "0")}`,
      month: `2022-${String(1 + (i % 12)).padStart(2, "0")}`,
      gross_egp: 12000 + Math.floor(r() * 40000), net_egp: 9000 + Math.floor(r() * 30000),
    };
  });
}

function biometric(n = 90): Row[] {
  const r = prng(VAULT_SEED + 4);
  return Array.from({ length: n }, (_, i) => ({
    badge_id: `BIO-${3000 + i}`, employee_id: `NDS-${1000 + (i % 150)}`,
    template_type: pick(r, ["fingerprint","face"]), enrollment_date: isoDate(r, 2022, 2025),
    door_group: pick(r, ["HQ-All","HQ-Restricted","DataRoom"]), template_hash: createHash("md5").update(String(i) + "bio").digest("hex"),
  }));
}

function support(n = 150): Row[] {
  const r = prng(VAULT_SEED + 5);
  return Array.from({ length: n }, (_, i) => {
    const name = fullName(r);
    return {
      ticket_id: `SUP-${9000 + i}`, customer_name: name, customer_email: email(name, "customer.example"),
      phone: fakePhone(r), subject: pick(r, ["Billing question","Login issue","Data export request","Service complaint","Contract renewal"]),
      opened: isoDate(r, 2025, 2026), status: pick(r, ["open","resolved","resolved","closed"]),
    };
  });
}

function marketing(n = 400): Row[] {
  const r = prng(VAULT_SEED + 6);
  return Array.from({ length: n }, (_, i) => {
    const name = fullName(r);
    return {
      lead_id: `LEAD-${50000 + i}`, full_name: name, email: email(name, "inbox.example"),
      phone: fakePhone(r), source: pick(r, ["webinar","website form","purchased list","event booth","referral"]),
      consent_reference: "", // deliberately empty — no consent evidence linked
      subscribed: true, captured: isoDate(r, 2024, 2026),
    };
  });
}

function consentLog(n = 350): Row[] {
  const r = prng(VAULT_SEED + 7);
  return Array.from({ length: n }, (_, i) => {
    const name = fullName(r);
    return {
      consent_id: `CNS-${70000 + i}`, subject_name: name, subject_email: email(name, "customer.example"),
      purpose: pick(r, ["service delivery","account communication","product updates"]),
      channel: pick(r, ["signup form","account settings","paper form"]),
      granted: true, timestamp: isoDate(r, 2024, 2026),
    };
  });
}

function rightsRequests(): Row[] {
  const r = prng(VAULT_SEED + 8);
  const rows: Row[] = [];
  const kinds = ["access","erasure","correction","objection"];
  for (let i = 0; i < 9; i++) {
    const name = fullName(r);
    // Request DSR-104 is deliberately open past the 6-working-day PDPL window.
    const open = i === 4;
    rows.push({
      request_id: `DSR-${100 + i}`, subject_name: name, type: pick(r, kinds),
      received: isoDate(r, 2026, 2026), status: open ? "open" : "closed",
      working_days_open: open ? 7 : 1 + Math.floor(r() * 4),
      handled_by: open ? "" : fullName(r),
    });
  }
  return rows;
}

function vendors(n = 25): Row[] {
  const r = prng(VAULT_SEED + 9);
  const names = ["CairoCloud Hosting","EuroData Analytics GmbH","GulfMail Relay","NileHR Payroll Bureau","AlexBackup Ltd"];
  return Array.from({ length: n }, (_, i) => ({
    vendor_id: `VND-${400 + i}`, vendor_name: i < 5 ? names[i] : `${pick(r, LAST)} Services ${i}`,
    service: pick(r, ["hosting","analytics","email delivery","payroll processing","backup storage"]),
    country: i === 1 ? "Germany" : i === 4 ? "United Arab Emirates" : "Egypt",
    processes_personal_data: true, agreement_reference: i === 1 ? "" : `DPA-${2020 + (i % 6)}-${i}`,
    contract_start: isoDate(r, 2021, 2025),
  }));
}

function incidents(n = 12): Row[] {
  const r = prng(VAULT_SEED + 10);
  return Array.from({ length: n }, (_, i) => ({
    incident_id: `INC-${600 + i}`, reported: isoDate(r, 2024, 2026),
    category: pick(r, ["phishing attempt","lost badge","misdirected email","system outage"]),
    personal_data_affected: r() < 0.4, severity: pick(r, ["low","low","medium","high"]),
    status: pick(r, ["closed","closed","under_review"]),
  }));
}

function training(n = 150): Row[] {
  const r = prng(VAULT_SEED + 11);
  return Array.from({ length: n }, (_, i) => ({
    employee_id: `NDS-${1000 + (i % 150)}`, course: "PDPL Data Protection Essentials",
    completed_on: isoDate(r, 2026, 2026), score_percent: 70 + Math.floor(r() * 30), passed: true,
  }));
}

function retentionSchedule(): Row[] {
  return [
    { dataset: "Employee records", retention: "Employment + 10 years", legal_basis: "Labour law", owner: "Laila Hassan" },
    { dataset: "Recruitment candidates", retention: "18 months after decision", legal_basis: "Legitimate purpose", owner: "Laila Hassan" },
    { dataset: "Customer support tickets", retention: "5 years", legal_basis: "Contract", owner: "Karim Nassar" },
    { dataset: "Consent log", retention: "Life of consent + 3 years", legal_basis: "PDPL accountability", owner: "Dina Mostafa" },
    { dataset: "Payroll", retention: "10 years", legal_basis: "Tax law", owner: "Finance" },
  ];
}

// ─── The vault contents ──────────────────────────────────────────────────────

interface FileSpec {
  entry: Omit<VaultEntry, "createdDate" | "modifiedDate">;
  write: () => Promise<void> | void;
}

function baseEntry(partial: Partial<VaultEntry> & Pick<VaultEntry, "externalId" | "fileName" | "sourceSystem" | "location" | "dataCategories">): Omit<VaultEntry, "createdDate" | "modifiedDate"> {
  return {
    owner: "Karim Nassar", storageCountry: "Egypt", destinationCountries: [],
    sharingStatus: "internal", accessLevel: "team", encryptionStatus: "encrypted",
    containsPersonalData: true, containsSensitiveData: false,
    retentionPeriod: "5 years", retentionDate: null, deletionStatus: "not_scheduled",
    externalProcessor: false, processorAgreementLinked: false,
    consentEvidenceLinked: false, licenceEvidenceLinked: false, evidenceType: null,
    ...partial,
  };
}

function fileSpecs(): FileSpec[] {
  return [
    { // 1 — publicly shared personal data (MON-ACCESS-001) + no retention docs (MON-RETENTION-001)
      entry: baseEntry({ externalId: "vault-employees", fileName: "Employees.xlsx", sourceSystem: "HR drive", location: "/HR/Employees.xlsx", owner: "Laila Hassan", dataCategories: ["employee", "contact_details", "national_id"], sharingStatus: "internal", retentionPeriod: "Employment + 10 years" }),
      write: () => writeXlsx("Employees.xlsx", "Employees", employees()),
    },
    { // 2 — retained past retention date (MON-RETENTION-002)
      entry: baseEntry({ externalId: "vault-recruitment", fileName: "Recruitment_Candidates.xlsx", sourceSystem: "HR drive", location: "/HR/Recruitment_Candidates.xlsx", owner: "Laila Hassan", dataCategories: ["candidate", "contact_details", "cv"], retentionPeriod: "18 months after decision", retentionDate: "2025-06-30" }),
      write: () => writeXlsx("Recruitment_Candidates.xlsx", "Candidates", candidates()),
    },
    { // 3 — unencrypted payroll archive (MON-SECURITY-001) + stale (MON-RETENTION-002)
      entry: baseEntry({ externalId: "vault-payroll-2022", fileName: "Payroll_Archive_2022.xlsx", sourceSystem: "Finance archive", location: "/Finance/Archive/Payroll_Archive_2022.xlsx", owner: "Omar Fathy", dataCategories: ["employee", "payroll", "financial", "national_id"], encryptionStatus: "unencrypted", retentionPeriod: "10 years" }),
      write: () => writeXlsx("Payroll_Archive_2022.xlsx", "Payroll 2022", payroll()),
    },
    { // 4 — biometric templates with broad access (MON-SENSITIVE-001, MON-LICENCE-001)
      entry: baseEntry({ externalId: "vault-biometric", fileName: "Biometric_Access_Records.xlsx", sourceSystem: "Facilities system", location: "/Facilities/Biometric_Access_Records.xlsx", owner: "Omar Fathy", dataCategories: ["employee", "biometric"], containsSensitiveData: true, accessLevel: "broad", retentionPeriod: "Employment + 1 year" }),
      write: () => writeXlsx("Biometric_Access_Records.xlsx", "Biometric", biometric()),
    },
    { // 5 — publicly shared support export (MON-ACCESS-001) + ownerless (MON-OWNER-001)
      entry: baseEntry({ externalId: "vault-support", fileName: "Customer_Support_Export.csv", sourceSystem: "Support desk", location: "/Shared/Exports/Customer_Support_Export.csv", owner: null, dataCategories: ["customer", "contact_details"], sharingStatus: "public", retentionPeriod: null }),
      write: () => writeCsv("Customer_Support_Export.csv", support()),
    },
    { // 6 — marketing leads without consent evidence (MON-MARKETING-001)
      entry: baseEntry({ externalId: "vault-marketing", fileName: "Marketing_Leads.xlsx", sourceSystem: "Marketing platform", location: "/Marketing/Marketing_Leads.xlsx", owner: "Youssef Adel", dataCategories: ["marketing_lead", "contact_details"], consentEvidenceLinked: false, retentionPeriod: null }),
      write: () => writeXlsx("Marketing_Leads.xlsx", "Leads", marketing()),
    },
    { // 7 — evidence: consent log
      entry: baseEntry({ externalId: "vault-consent-log", fileName: "Customer_Consent_Log.xlsx", sourceSystem: "CRM", location: "/Compliance/Customer_Consent_Log.xlsx", owner: "Dina Mostafa", dataCategories: ["customer", "consent"], evidenceType: "consent_log", consentEvidenceLinked: true, retentionPeriod: "Life of consent + 3 years" }),
      write: () => writeXlsx("Customer_Consent_Log.xlsx", "Consent", consentLog()),
    },
    { // 8 — rights requests, one past the 6-working-day window (MON-RIGHTS-001) + evidence register
      entry: baseEntry({ externalId: "vault-rights", fileName: "Data_Subject_Requests.xlsx", sourceSystem: "Compliance tracker", location: "/Compliance/Data_Subject_Requests.xlsx", owner: "Dina Mostafa", dataCategories: ["customer", "rights_request"], evidenceType: "register" }),
      write: () => writeXlsx("Data_Subject_Requests.xlsx", "Requests", rightsRequests()),
    },
    { // 9 — evidence: processor register
      entry: baseEntry({ externalId: "vault-processor-register", fileName: "Processor_Register.xlsx", sourceSystem: "Compliance tracker", location: "/Compliance/Processor_Register.xlsx", owner: "Dina Mostafa", dataCategories: ["vendor"], containsPersonalData: false, evidenceType: "register" }),
      write: () => writeXlsx("Processor_Register.xlsx", "Processors", vendors()),
    },
    { // 10 — cross-border vendor data (MON-TRANSFER-001) + processor without agreement (MON-PROCESSOR-001)
      entry: baseEntry({ externalId: "vault-crossborder", fileName: "Cross_Border_Vendors.xlsx", sourceSystem: "Procurement", location: "/Procurement/Cross_Border_Vendors.xlsx", owner: "Karim Nassar", dataCategories: ["vendor", "customer"], destinationCountries: ["Germany"], externalProcessor: true, processorAgreementLinked: false }),
      write: () => writeXlsx("Cross_Border_Vendors.xlsx", "Vendors", vendors()),
    },
    { // 11 — evidence: training records
      entry: baseEntry({ externalId: "vault-training", fileName: "Training_Completion_Records.xlsx", sourceSystem: "HR drive", location: "/HR/Training_Completion_Records.xlsx", owner: "Laila Hassan", dataCategories: ["employee", "training"], evidenceType: "training_record" }),
      write: () => writeXlsx("Training_Completion_Records.xlsx", "Training", training()),
    },
    { // 12 — evidence: incident register
      entry: baseEntry({ externalId: "vault-incidents", fileName: "Security_Incident_Register.xlsx", sourceSystem: "Security team", location: "/Security/Security_Incident_Register.xlsx", owner: "Omar Fathy", dataCategories: ["incident"], containsPersonalData: false, evidenceType: "register" }),
      write: () => writeXlsx("Security_Incident_Register.xlsx", "Incidents", incidents()),
    },
    { // 13 — evidence: retention schedule
      entry: baseEntry({ externalId: "vault-retention-schedule", fileName: "Data_Retention_Schedule.xlsx", sourceSystem: "Compliance tracker", location: "/Compliance/Data_Retention_Schedule.xlsx", owner: "Dina Mostafa", dataCategories: ["policy"], containsPersonalData: false, evidenceType: "policy_document" }),
      write: () => writeXlsx("Data_Retention_Schedule.xlsx", "Retention", retentionSchedule()),
    },
    { // 14 — evidence: DPO appointment (JSON)
      entry: baseEntry({ externalId: "vault-dpo", fileName: "DPO_Appointment_Record.json", sourceSystem: "Legal records", location: "/Legal/DPO_Appointment_Record.json", owner: "Salma Fawzy", dataCategories: ["governance"], containsPersonalData: false, evidenceType: "other" }),
      write: () => writeJson("DPO_Appointment_Record.json", {
        record: "DPO appointment", appointee: "Dina Mostafa", role: "Data Protection Officer",
        appointed_on: "2026-03-01", board_resolution: "NDS-BR-2026-04", pdpc_registration_status: "submitted",
      }),
    },
    { // 15 — evidence: processing licence application (JSON)
      entry: baseEntry({ externalId: "vault-licence", fileName: "Data_Processing_Licence_Record.json", sourceSystem: "Legal records", location: "/Legal/Data_Processing_Licence_Record.json", owner: "Salma Fawzy", dataCategories: ["governance"], containsPersonalData: false, evidenceType: "other", licenceEvidenceLinked: true }),
      write: () => writeJson("Data_Processing_Licence_Record.json", {
        record: "PDPC processing licence application", reference: "PDPC-APP-2026-0197",
        scope: "General personal data processing", status: "submitted", submitted_on: "2026-05-12",
      }),
    },
    { // 16 — evidence: employee privacy notice (text)
      entry: baseEntry({ externalId: "vault-employee-notice", fileName: "Employee_Privacy_Notice.txt", sourceSystem: "HR drive", location: "/HR/Employee_Privacy_Notice.txt", owner: "Laila Hassan", dataCategories: ["policy"], containsPersonalData: false, evidenceType: "policy_document" }),
      write: () => writeText("Employee_Privacy_Notice.txt",
        "NILE DIGITAL SERVICES — EMPLOYEE PRIVACY NOTICE (SYNTHETIC DEMO DOCUMENT)\n\n" +
        "This notice explains how Nile Digital Services S.A.E. collects and uses employee personal data " +
        "under Egypt's Personal Data Protection Law (Law 151/2020).\n\n" +
        "1. What we collect: identification details, contact details, payroll and tax details, attendance records.\n" +
        "2. Why: employment contract administration, legal obligations, workplace safety.\n" +
        "3. Retention: employment period plus ten years as required by labour and tax law.\n" +
        "4. Your rights: access, correction, and erasure requests are answered within six working days.\n" +
        "5. Contact: dpo@niledigital.example.\n"),
    },
    { // 17 — evidence: website privacy notice (text)
      entry: baseEntry({ externalId: "vault-website-notice", fileName: "Website_Privacy_Notice.txt", sourceSystem: "Website CMS", location: "/Website/Website_Privacy_Notice.txt", owner: "Youssef Adel", dataCategories: ["policy"], containsPersonalData: false, evidenceType: "policy_document" }),
      write: () => writeText("Website_Privacy_Notice.txt",
        "NILE DIGITAL SERVICES — WEBSITE PRIVACY NOTICE (SYNTHETIC DEMO DOCUMENT)\n\n" +
        "We collect account details and usage information to provide our services. We do not sell personal data. " +
        "Marketing messages are sent only with consent, which can be withdrawn at any time. " +
        "Requests to access, correct, or delete personal data are handled within six working days as required by the PDPL. " +
        "An Arabic version of this notice is available on request.\n"),
    },
    { // 18 — evidence: vendor processing agreement (text)
      entry: baseEntry({ externalId: "vault-vendor-dpa", fileName: "Vendor_Processing_Agreement.txt", sourceSystem: "Legal records", location: "/Legal/Vendor_Processing_Agreement.txt", owner: "Salma Fawzy", dataCategories: ["vendor", "agreement"], containsPersonalData: false, evidenceType: "signed_agreement" }),
      write: () => writeText("Vendor_Processing_Agreement.txt",
        "DATA PROCESSING AGREEMENT — NILE DIGITAL SERVICES S.A.E. AND CAIROCLOUD HOSTING (SYNTHETIC DEMO DOCUMENT)\n\n" +
        "CairoCloud Hosting processes personal data solely on documented instructions from Nile Digital Services. " +
        "Sub-processors require prior written approval. Personal data remains within Egypt. " +
        "Security measures include encryption at rest and role-based access. " +
        "Breach notification to the controller within 24 hours. Reference DPA-2024-11.\n"),
    },
  ];
}

/** Generate (or regenerate) the entire vault deterministically. */
export async function generateVault(options: { force?: boolean } = {}): Promise<VaultManifest> {
  const dir = vaultDir();
  if (options.force && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  const specs = fileSpecs();
  for (const spec of specs) await spec.write();
  const manifest: VaultManifest = {
    source: VAULT_NAME,
    provider: VAULT_PROVIDER,
    generatedForOrganization: "Nile Digital Services S.A.E.",
    seed: VAULT_SEED,
    note: "Entirely synthetic demonstration data. No real personal data.",
    entries: specs.map((s) => ({ ...s.entry, createdDate: "2026-06-01", modifiedDate: "2026-06-01" })),
  };
  writeManifest(manifest);
  return manifest;
}

// ─── Parsing (server-side, allow-listed types, size-capped) ──────────────────

export const MAX_PARSE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".xlsx", ".csv", ".json", ".txt"] as const;

export interface ParsedFile {
  fileType: "xlsx" | "csv" | "json" | "txt";
  rowCount: number;
  columns: string[];
  /** Structured rows for tabular files; [] for txt. Capped for safety. */
  rows: Row[];
  textPreview?: string;
}

function safeVaultPath(fileName: string): string {
  // No path traversal: the resolved path must stay inside the vault directory.
  const resolved = path.resolve(vaultDir(), fileName);
  if (!resolved.startsWith(path.resolve(vaultDir()) + path.sep)) {
    throw new Error("Invalid vault file name.");
  }
  return resolved;
}

export async function parseVaultFile(fileName: string, maxRows = 100_000): Promise<ParsedFile> {
  const filePath = safeVaultPath(fileName);
  const ext = path.extname(fileName).toLowerCase() as (typeof ALLOWED_EXTENSIONS)[number];
  if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error(`Unsupported file type: ${ext}`);
  if (fs.statSync(filePath).size > MAX_PARSE_BYTES) throw new Error("File exceeds the parse size limit.");

  if (ext === ".xlsx") {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.worksheets[0];
    const rows: Row[] = [];
    let columns: string[] = [];
    ws?.eachRow((row, rowNumber) => {
      const values = (row.values as unknown[]).slice(1).map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : (v as Row[string])));
      if (rowNumber === 1) columns = values.map(String);
      else if (rows.length < maxRows) {
        const obj: Row = {};
        columns.forEach((c, i) => { obj[c] = (values[i] ?? null) as Row[string]; });
        rows.push(obj);
      }
    });
    return { fileType: "xlsx", rowCount: rows.length, columns, rows };
  }
  if (ext === ".csv") {
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    const parseLine = (line: string): string[] => {
      const out: string[] = []; let cur = ""; let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quoted) {
          if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
          else if (ch === '"') quoted = false;
          else cur += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ",") { out.push(cur); cur = ""; }
        else cur += ch;
      }
      out.push(cur);
      return out;
    };
    const columns = parseLine(lines[0] ?? "");
    const rows = lines.slice(1, maxRows + 1).map((l) => {
      const vals = parseLine(l); const obj: Row = {};
      columns.forEach((c, i) => { obj[c] = vals[i] ?? null; });
      return obj;
    });
    return { fileType: "csv", rowCount: rows.length, columns, rows };
  }
  if (ext === ".json") {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
    const records = Array.isArray(value) ? (value as Row[]) : [value as Row];
    return { fileType: "json", rowCount: records.length, columns: Object.keys(records[0] ?? {}), rows: records };
  }
  const text = fs.readFileSync(filePath, "utf8");
  return { fileType: "txt", rowCount: text.split(/\n\s*\n/).filter(Boolean).length, columns: [], rows: [], textPreview: text.slice(0, 2000) };
}

// ─── Inject Demo Change scenarios ────────────────────────────────────────────

export const INJECT_SCENARIOS = [
  { code: "share_employees_publicly", label: "Mark Employees.xlsx as publicly shared", description: "Sets the employee file's sharing status to public — the next scan should raise MON-ACCESS-001." },
  { code: "add_cross_border_vendor", label: "Add a new cross-border vendor", description: "Appends a vendor row storing data in France and marks the source as transferring abroad." },
  { code: "add_unconsented_leads", label: "Add marketing leads without consent evidence", description: "Appends 25 new leads with an empty consent reference." },
  { code: "make_retention_overdue", label: "Make support-ticket retention overdue", description: "Sets a past retention date on the support export so MON-RETENTION-002 fires." },
  { code: "remove_owner", label: "Remove the owner from Marketing_Leads.xlsx", description: "Clears the accountable owner — the next scan should raise MON-OWNER-001." },
  { code: "add_training_evidence", label: "Add a new training evidence file", description: "Creates Training_Refresher_Q3.xlsx — the next scan should discover a NEW resource and an evidence candidate." },
  { code: "add_licence_evidence", label: "Add a sensitive-data licence record", description: "Creates Sensitive_Data_Licence_Record.json and links licence evidence to the biometric source." },
] as const;
export type InjectScenario = (typeof INJECT_SCENARIOS)[number]["code"];

/** Mutate the actual files/manifest. The scan — not this action — creates findings. */
export async function applyScenario(code: InjectScenario): Promise<string> {
  const manifest = readManifest();
  const entry = (id: string) => {
    const e = manifest.entries.find((x) => x.externalId === id);
    if (!e) throw new Error(`Manifest entry ${id} missing.`);
    return e;
  };
  const today = new Date().toISOString().slice(0, 10);
  let summary = "";

  switch (code) {
    case "share_employees_publicly": {
      const e = entry("vault-employees");
      e.sharingStatus = "public"; e.modifiedDate = today;
      summary = "Employees.xlsx is now marked publicly shared in the source manifest.";
      break;
    }
    case "add_cross_border_vendor": {
      const parsed = await parseVaultFile("Cross_Border_Vendors.xlsx");
      parsed.rows.push({ vendor_id: `VND-NEW-${parsed.rowCount + 1}`, vendor_name: "Lyon Analytics SARL", service: "analytics", country: "France", processes_personal_data: true, agreement_reference: "", contract_start: today });
      await writeXlsx("Cross_Border_Vendors.xlsx", "Vendors", parsed.rows);
      const e = entry("vault-crossborder");
      if (!e.destinationCountries.includes("France")) e.destinationCountries.push("France");
      e.modifiedDate = today;
      summary = "Added vendor 'Lyon Analytics SARL' (France) to Cross_Border_Vendors.xlsx.";
      break;
    }
    case "add_unconsented_leads": {
      const parsed = await parseVaultFile("Marketing_Leads.xlsx");
      const r = prng(Date.parse(today) % 100000);
      for (let i = 0; i < 25; i++) {
        const name = fullName(r);
        parsed.rows.push({ lead_id: `LEAD-INJ-${i}`, full_name: name, email: email(name, "inbox.example"), phone: fakePhone(r), source: "purchased list", consent_reference: "", subscribed: true, captured: today });
      }
      await writeXlsx("Marketing_Leads.xlsx", "Leads", parsed.rows);
      entry("vault-marketing").modifiedDate = today;
      summary = "Appended 25 new marketing leads with no consent reference.";
      break;
    }
    case "make_retention_overdue": {
      const e = entry("vault-support");
      e.retentionPeriod = "12 months"; e.retentionDate = "2025-01-31"; e.modifiedDate = today;
      summary = "Customer_Support_Export.csv retention date set to 2025-01-31 (overdue).";
      break;
    }
    case "remove_owner": {
      const e = entry("vault-marketing");
      e.owner = null; e.modifiedDate = today;
      summary = "Marketing_Leads.xlsx no longer has an accountable owner.";
      break;
    }
    case "add_training_evidence": {
      await writeXlsx("Training_Refresher_Q3.xlsx", "Training", training(60));
      manifest.entries.push({
        ...baseEntry({ externalId: "vault-training-q3", fileName: "Training_Refresher_Q3.xlsx", sourceSystem: "HR drive", location: "/HR/Training_Refresher_Q3.xlsx", owner: "Laila Hassan", dataCategories: ["employee", "training"], evidenceType: "training_record" }),
        createdDate: today, modifiedDate: today,
      });
      summary = "Created Training_Refresher_Q3.xlsx — a brand-new evidence file.";
      break;
    }
    case "add_licence_evidence": {
      writeJson("Sensitive_Data_Licence_Record.json", {
        record: "PDPC sensitive-data licence", reference: "PDPC-SD-2026-0044",
        scope: "Biometric access control", status: "granted", granted_on: today,
      });
      manifest.entries.push({
        ...baseEntry({ externalId: "vault-sensitive-licence", fileName: "Sensitive_Data_Licence_Record.json", sourceSystem: "Legal records", location: "/Legal/Sensitive_Data_Licence_Record.json", owner: "Salma Fawzy", dataCategories: ["governance"], containsPersonalData: false, evidenceType: "other", licenceEvidenceLinked: true }),
        createdDate: today, modifiedDate: today,
      });
      entry("vault-biometric").licenceEvidenceLinked = true;
      entry("vault-biometric").modifiedDate = today;
      summary = "Created Sensitive_Data_Licence_Record.json and linked licence evidence to the biometric source.";
      break;
    }
  }
  writeManifest(manifest);
  return summary;
}
