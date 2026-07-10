// Demonstration dataset — entirely fictional. Nile Digital Services S.A.E.,
// its people, files and requests exist only to demonstrate the platform.
// All dates are fixed so seeding and scanning stay deterministic.

import type { EvidenceType } from "@/lib/types";

export const DEMO_ORG = {
  name: "Nile Digital Services",
  legalName: "Nile Digital Services S.A.E.",
  country: "Egypt",
  industry: "Technology and business services",
  companySize: "150 employees",
  registrationNumber: "CR-543210-DEMO",
  primaryContactName: "Salma Fawzy",
  primaryContactEmail: "salma.fawzy@niledigital.example",
  timezone: "Africa/Cairo",
} as const;

export const DEMO_USERS = [
  { key: "admin", name: "Salma Fawzy", email: "salma.fawzy@niledigital.example", role: "client_admin" },
  { key: "manager", name: "Karim Nassar", email: "karim.nassar@niledigital.example", role: "compliance_manager" },
  { key: "dpo", name: "Dina Mostafa", email: "dina.mostafa@niledigital.example", role: "compliance_manager" },
  { key: "it", name: "Omar Fathy", email: "omar.fathy@niledigital.example", role: "control_owner" },
  { key: "hr", name: "Laila Hassan", email: "laila.hassan@niledigital.example", role: "control_owner" },
  { key: "marketing", name: "Youssef Adel", email: "youssef.adel@niledigital.example", role: "control_owner" },
  { key: "reviewer", name: "Nour El-Sayed", email: "nour.elsayed@niledigital.example", role: "reviewer" },
  { key: "viewer", name: "Hana Ibrahim", email: "hana.ibrahim@niledigital.example", role: "viewer" },
] as const;

export const PLATFORM_ADMIN = {
  name: "Iltzam Platform Admin",
  email: "platform.admin@iltzam.example",
} as const;

export const DEMO_CONNECTOR = {
  provider: "demo_connector",
  displayName: "Demo Corporate Drive",
  status: "connected",
  authenticationType: "none",
  grantedScopes: ["files.metadata.read"],
} as const;

/**
 * Normalized metadata shape the monitoring rules evaluate. The demo
 * connector returns these 18 fictional resources deterministically.
 */
export interface DemoResource {
  externalId: string;
  name: string;
  mimeType: string;
  location: string;
  businessOwner: string | null;
  technicalOwner: string | null;
  createdExternallyAt: string;
  modifiedExternallyAt: string;
  sizeBytes: number;
  sharingStatus: "private" | "internal" | "broad" | "public";
  accessRestriction: "restricted" | "broad" | "public" | "missing";
  destinationCountry: string | null;
  dataCategories: string[];
  sensitiveDataCategories: string[];
  dataSubjects: string[];
  processingPurposes: string[];
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  retentionPeriod: string | null;
  retentionDate: string | null;
  deletionStatus: string | null;
  encryptionStatus: boolean | null;
  externalProcessor: boolean;
  linkedConsentEvidence: boolean;
  linkedLicenceEvidence: boolean;
  linkedProcessorAgreement: boolean;
  evidenceType: string | null;
  requestType: string | null;
  workingDaysOpen: number | null;
}

const R = (r: Partial<DemoResource> & Pick<DemoResource, "externalId" | "name" | "mimeType">): DemoResource => ({
  location: "/Corporate Drive/Compliance",
  businessOwner: null,
  technicalOwner: "Omar Fathy",
  createdExternallyAt: "2025-03-10T09:00:00Z",
  modifiedExternallyAt: "2026-05-20T14:30:00Z",
  sizeBytes: 250_000,
  sharingStatus: "internal",
  accessRestriction: "restricted",
  destinationCountry: null,
  dataCategories: [],
  sensitiveDataCategories: [],
  dataSubjects: [],
  processingPurposes: [],
  containsPersonalData: false,
  containsSensitiveData: false,
  retentionPeriod: null,
  retentionDate: null,
  deletionStatus: null,
  encryptionStatus: true,
  externalProcessor: false,
  linkedConsentEvidence: false,
  linkedLicenceEvidence: false,
  linkedProcessorAgreement: false,
  evidenceType: null,
  requestType: null,
  workingDaysOpen: null,
  ...r,
});

export const DEMO_RESOURCES: DemoResource[] = [
  R({
    externalId: "drive-0001",
    name: "Employee Master List.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    location: "/Corporate Drive/HR",
    businessOwner: "Laila Hassan",
    dataCategories: ["employee", "contact_details", "national_id"],
    dataSubjects: ["employees"],
    processingPurposes: ["hr_administration"],
    containsPersonalData: true,
    retentionPeriod: null, // → DEMO-RETENTION-001
    sizeBytes: 1_240_000,
  }),
  R({
    externalId: "drive-0002",
    name: "Recruitment Candidates 2025.csv",
    mimeType: "text/csv",
    location: "/Corporate Drive/HR/Recruitment",
    businessOwner: "Laila Hassan",
    dataCategories: ["candidate", "cv_data", "contact_details"],
    dataSubjects: ["job_applicants"],
    processingPurposes: ["recruitment"],
    containsPersonalData: true,
    retentionPeriod: "12 months after process",
    retentionDate: "2026-01-31", // past → DEMO-RETENTION-002
    deletionStatus: "pending",
  }),
  R({
    externalId: "drive-0003",
    name: "Customer Support Export.csv",
    mimeType: "text/csv",
    location: "/Corporate Drive/Support",
    businessOwner: null, // → DEMO-OWNER-001
    sharingStatus: "public", // → DEMO-ACCESS-001
    accessRestriction: "public",
    dataCategories: ["customer", "contact_details", "support_tickets"],
    dataSubjects: ["customers"],
    processingPurposes: ["customer_support"],
    containsPersonalData: true,
    retentionPeriod: "24 months",
  }),
  R({
    externalId: "drive-0004",
    name: "Marketing Leads.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    location: "/Corporate Drive/Marketing",
    businessOwner: "Youssef Adel",
    dataCategories: ["marketing_lead", "contact_details"], // → DEMO-MARKETING-001
    dataSubjects: ["prospects"],
    processingPurposes: ["electronic_marketing"],
    containsPersonalData: true,
    retentionPeriod: null, // → DEMO-RETENTION-001
    linkedConsentEvidence: false,
  }),
  R({
    externalId: "drive-0005",
    name: "Data Retention Policy.pdf",
    mimeType: "application/pdf",
    businessOwner: "Dina Mostafa",
    evidenceType: "policy", // → DEMO-EVIDENCE-001
  }),
  R({
    externalId: "drive-0006",
    name: "Employee Privacy Notice.pdf",
    mimeType: "application/pdf",
    businessOwner: "Laila Hassan",
    evidenceType: "policy",
  }),
  R({
    externalId: "drive-0007",
    name: "Vendor Processing Agreement.pdf",
    mimeType: "application/pdf",
    businessOwner: "Karim Nassar",
    evidenceType: "contract",
  }),
  R({
    externalId: "drive-0008",
    name: "Security Incident Register.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    businessOwner: "Omar Fathy",
    evidenceType: "register",
  }),
  R({
    externalId: "drive-0009",
    name: "Payroll Archive 2022.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    location: "/Corporate Drive/Finance/Archive",
    businessOwner: "Laila Hassan",
    dataCategories: ["payroll", "employee", "bank_details"],
    dataSubjects: ["employees"],
    processingPurposes: ["payroll"],
    containsPersonalData: true,
    encryptionStatus: false, // → DEMO-SECURITY-001
    retentionPeriod: "5 years",
    retentionDate: "2027-12-31",
  }),
  R({
    externalId: "drive-0010",
    name: "Biometric Access Records.csv",
    mimeType: "text/csv",
    location: "/Corporate Drive/Facilities",
    businessOwner: "Omar Fathy",
    accessRestriction: "broad", // → DEMO-SENSITIVE-001
    dataCategories: ["employee", "access_logs"],
    sensitiveDataCategories: ["biometric"],
    dataSubjects: ["employees"],
    processingPurposes: ["physical_security"],
    containsPersonalData: true,
    containsSensitiveData: true, // → DEMO-LICENCE-001 (no licence linked)
    retentionPeriod: "6 months",
  }),
  R({
    externalId: "drive-0011",
    name: "Customer Consent Log.csv",
    mimeType: "text/csv",
    businessOwner: "Youssef Adel",
    evidenceType: "consent_record",
  }),
  R({
    externalId: "drive-0012",
    name: "DPO Appointment Letter.pdf",
    mimeType: "application/pdf",
    businessOwner: "Dina Mostafa",
    evidenceType: "regulator_filing",
  }),
  R({
    externalId: "drive-0013",
    name: "Cross-Border Vendor List.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    location: "/Corporate Drive/Procurement",
    businessOwner: "Karim Nassar",
    destinationCountry: "Germany", // → DEMO-TRANSFER-001
    dataCategories: ["customer", "vendor_contacts"],
    dataSubjects: ["customers", "vendor_staff"],
    processingPurposes: ["analytics_outsourcing"],
    containsPersonalData: true,
    externalProcessor: true, // → DEMO-PROCESSOR-001 (no agreement linked)
    linkedProcessorAgreement: false,
    retentionPeriod: "contract term",
  }),
  R({
    externalId: "drive-0014",
    name: "Training Completion Records.csv",
    mimeType: "text/csv",
    businessOwner: "Laila Hassan",
    evidenceType: "training_record",
  }),
  R({
    externalId: "drive-0015",
    name: "Website Privacy Notice.pdf",
    mimeType: "application/pdf",
    businessOwner: "Youssef Adel",
    evidenceType: "policy",
  }),
  R({
    externalId: "drive-0016",
    name: "Customer Deletion Requests.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    location: "/Corporate Drive/Support",
    businessOwner: "Karim Nassar",
    dataCategories: ["customer", "rights_requests"],
    dataSubjects: ["customers"],
    processingPurposes: ["rights_handling"],
    containsPersonalData: true,
    requestType: "erasure_request",
    workingDaysOpen: 9, // → DEMO-RIGHTS-001 (≥ 6 working days)
    retentionPeriod: "per request log",
  }),
  R({
    externalId: "drive-0017",
    name: "Processor Register.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    businessOwner: "Dina Mostafa",
    evidenceType: "register",
  }),
  R({
    externalId: "drive-0018",
    name: "Data Processing Licence.pdf",
    mimeType: "application/pdf",
    businessOwner: "Dina Mostafa",
    evidenceType: "licence",
  }),
];

/**
 * Answer plan for the demo assessment — realistic variation across the PDPL
 * library so scoring, gaps and queues have texture. Controls not listed stay
 * not_answered. Owner keys reference DEMO_USERS entries.
 */
export const DEMO_ANSWER_PLAN: {
  code: string;
  answer: "yes" | "no" | "not_applicable";
  owner?: string;
  dueDate?: string;
  notes?: string;
  evidence?: { title: string; type: EvidenceType; review: "accepted" | "unreviewed" | "rejected" };
}[] = [
  { code: "EG-GOV-01", answer: "yes", owner: "dpo", evidence: { title: "Data Protection Policy v2 (signed)", type: "policy_document", review: "accepted" } },
  { code: "EG-GOV-02", answer: "yes", owner: "admin", notes: "CEO mandate issued March 2026." },
  { code: "EG-GOV-03", answer: "no", owner: "dpo", dueDate: "2026-09-15", notes: "PDPC licence application drafted, not yet filed." },
  { code: "EG-GOV-04", answer: "not_applicable", notes: "Company is established in Egypt." },
  { code: "EG-GOV-05", answer: "no", owner: "dpo", dueDate: "2026-10-01" },
  { code: "EG-GOV-06", answer: "yes" }, // yes without evidence → evidence gap
  { code: "EG-GOV-07", answer: "yes", owner: "admin", evidence: { title: "RACI matrix 2026", type: "register", review: "unreviewed" } },
  { code: "EG-LAW-01", answer: "no", owner: "manager", dueDate: "2026-08-30" },
  { code: "EG-LAW-02", answer: "yes", owner: "marketing", evidence: { title: "Consent capture screens", type: "screenshot", review: "accepted" } },
  { code: "EG-LAW-03", answer: "yes" },
  { code: "EG-LAW-05", answer: "no", owner: "dpo", dueDate: "2026-07-31", notes: "Sensitive-data licence scope under legal review." },
  { code: "EG-CON-01", answer: "yes", evidence: { title: "Signup flow consent copy", type: "screenshot", review: "accepted" } },
  { code: "EG-CON-02", answer: "yes" },
  { code: "EG-CON-07", answer: "no", owner: "marketing", dueDate: "2026-08-15" },
  { code: "EG-DSR-01", answer: "yes", owner: "manager" },
  { code: "EG-DSR-05", answer: "no", owner: "manager", dueDate: "2026-07-20", notes: "Current SLA is 10 working days; must reach 6." },
  { code: "EG-DSR-06", answer: "yes" },
  { code: "EG-ROP-01", answer: "yes", owner: "dpo", evidence: { title: "Processing register export", type: "register", review: "unreviewed" } },
  { code: "EG-ROP-04", answer: "yes" },
  { code: "EG-DPO-01", answer: "yes", owner: "admin", evidence: { title: "DPO appointment letter", type: "other", review: "accepted" } },
  { code: "EG-DPO-02", answer: "no", owner: "dpo", dueDate: "2026-07-25", notes: "PDPC register entry pending." },
  { code: "EG-SEC-01", answer: "yes", owner: "it", evidence: { title: "Security risk assessment 2026", type: "assessment", review: "accepted" } },
  { code: "EG-SEC-02", answer: "no", owner: "it", dueDate: "2026-09-30", notes: "Legacy archives unencrypted." },
  { code: "EG-SEC-03", answer: "yes", owner: "it" },
  { code: "EG-SEC-04", answer: "yes" },
  { code: "EG-BRE-01", answer: "no", owner: "dpo", dueDate: "2026-08-10", notes: "72-hour notification runbook missing." },
  { code: "EG-BRE-06", answer: "yes", owner: "it", evidence: { title: "Incident response plan", type: "policy_document", review: "rejected" } },
  { code: "EG-TRF-01", answer: "no", owner: "dpo", dueDate: "2026-10-15" },
  { code: "EG-TRF-03", answer: "yes", owner: "it" },
  { code: "EG-VEN-02", answer: "yes", evidence: { title: "Processor agreement — CairoCloud", type: "vendor_contract", review: "accepted" } },
  { code: "EG-VEN-05", answer: "yes" },
  { code: "EG-RET-01", answer: "no", owner: "manager", dueDate: "2026-09-01" },
  { code: "EG-NOT-01", answer: "yes", evidence: { title: "Website privacy notice", type: "policy_document", review: "accepted" } },
  { code: "EG-NOT-05", answer: "no", owner: "manager", dueDate: "2026-08-20", notes: "Arabic plain-language rewrite in progress." },
  { code: "EG-DPI-01", answer: "yes" },
  { code: "EG-TRA-01", answer: "yes", owner: "dpo", evidence: { title: "PDPL training deck + attendance", type: "training_record", review: "unreviewed" } },
  { code: "EG-TRA-04", answer: "no", owner: "hr", dueDate: "2026-08-05" },
];

/** Manually-entered inventory items (exist before any scan). */
export const DEMO_MANUAL_INVENTORY = [
  {
    name: "Production customer database",
    systemName: "PostgreSQL (AWS Bahrain)",
    businessOwner: "Karim Nassar",
    technicalOwner: "Omar Fathy",
    dataCategories: ["customer", "contact_details", "billing"],
    sensitiveDataCategories: [] as string[],
    dataSubjects: ["customers"],
    processingPurposes: ["service_delivery", "billing"],
    lawfulBasis: "Contract necessity (PDPL Art 6)",
    storageLocations: ["AWS me-south-1 (Bahrain)"],
    destinationCountries: ["Bahrain"],
    retentionPeriod: "Life of contract + 5 years",
    processors: ["CairoCloud Hosting"],
    containsPersonalData: true,
    containsSensitiveData: false,
    crossBorderTransfer: true,
    sharingStatus: "internal",
    encryptionStatus: "encrypted",
  },
  {
    name: "HR management system",
    systemName: "BambooHR (SaaS)",
    businessOwner: "Laila Hassan",
    technicalOwner: "Omar Fathy",
    dataCategories: ["employee", "contact_details", "payroll"],
    sensitiveDataCategories: ["health"],
    dataSubjects: ["employees"],
    processingPurposes: ["hr_administration", "payroll"],
    lawfulBasis: "Legal obligation / contract (PDPL Art 6)",
    storageLocations: ["EU (Ireland)"],
    destinationCountries: ["Ireland"],
    retentionPeriod: "Employment + 10 years",
    processors: ["BambooHR"],
    containsPersonalData: true,
    containsSensitiveData: true,
    crossBorderTransfer: true,
    sharingStatus: "internal",
    encryptionStatus: "encrypted",
  },
  {
    name: "Marketing email platform",
    systemName: "Mailchimp",
    businessOwner: "Youssef Adel",
    technicalOwner: null,
    dataCategories: ["marketing_lead", "contact_details"],
    sensitiveDataCategories: [] as string[],
    dataSubjects: ["prospects", "customers"],
    processingPurposes: ["electronic_marketing"],
    lawfulBasis: "Consent (PDPL Art 2, 6)",
    storageLocations: ["United States"],
    destinationCountries: ["United States"],
    retentionPeriod: null,
    processors: ["Mailchimp"],
    containsPersonalData: true,
    containsSensitiveData: false,
    crossBorderTransfer: true,
    sharingStatus: "internal",
    encryptionStatus: "unknown",
  },
];
