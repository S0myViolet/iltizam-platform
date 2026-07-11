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
  provider: "local_demo_vault",
  displayName: "Nile Digital Services Demo Data Vault",
  status: "connected",
  authenticationType: "none",
  grantedScopes: ["files.read", "files.metadata.read"],
} as const;

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
