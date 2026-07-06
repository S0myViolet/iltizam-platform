// Enum-like domain vocabulary. SQLite (via Prisma) has no native enums, so
// these constants are the single source of truth for every string-typed
// status field in the schema. Import from here — never inline the literals.

export const ANSWER_VALUES = ["yes", "no", "not_answered", "not_applicable"] as const;
export type AnswerValue = (typeof ANSWER_VALUES)[number];

export const ANSWER_LABELS: Record<AnswerValue, string> = {
  yes: "Yes",
  no: "No",
  not_answered: "Not answered",
  not_applicable: "Not applicable",
};

export const SEVERITIES = ["legally_mandatory", "important"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_LABELS: Record<Severity, string> = {
  legally_mandatory: "Legally mandatory",
  important: "Important",
};

export const ASSESSMENT_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "needs_review",
] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  needs_review: "Needs review",
};

export const REMEDIATION_STATUSES = [
  "not_started",
  "in_progress",
  "evidence_needed",
  "ready_for_review",
  "closed",
] as const;
export type RemediationStatus = (typeof REMEDIATION_STATUSES)[number];

export const REMEDIATION_STATUS_LABELS: Record<RemediationStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  evidence_needed: "Evidence needed",
  ready_for_review: "Ready for review",
  closed: "Closed",
};

export const REGULATION_STATUSES = ["in_force", "provisional", "draft", "superseded"] as const;
export type RegulationStatus = (typeof REGULATION_STATUSES)[number];

export const EVIDENCE_KINDS = ["file", "link"] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_TYPES = [
  "policy_document",
  "signed_agreement",
  "register",
  "log",
  "assessment",
  "screenshot",
  "template",
  "audit_report",
  "training_record",
  "vendor_contract",
  "other",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  policy_document: "Policy document",
  signed_agreement: "Signed agreement",
  register: "Register",
  log: "Log",
  assessment: "Assessment",
  screenshot: "Screenshot",
  template: "Template",
  audit_report: "Audit report",
  training_record: "Training record",
  vendor_contract: "Vendor contract",
  other: "Other",
};

export const COMPANY_SIZES = ["1–10", "11–50", "51–250", "251–1,000", "1,000+"] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

export const REGIME_CODES = ["EG-PDPL", "EU-GDPR"] as const;
export type RegimeCode = (typeof REGIME_CODES)[number];

export function isAnswerValue(v: unknown): v is AnswerValue {
  return typeof v === "string" && (ANSWER_VALUES as readonly string[]).includes(v);
}

export function isRemediationStatus(v: unknown): v is RemediationStatus {
  return typeof v === "string" && (REMEDIATION_STATUSES as readonly string[]).includes(v);
}

export function isAssessmentStatus(v: unknown): v is AssessmentStatus {
  return typeof v === "string" && (ASSESSMENT_STATUSES as readonly string[]).includes(v);
}

export function isEvidenceType(v: unknown): v is EvidenceType {
  return typeof v === "string" && (EVIDENCE_TYPES as readonly string[]).includes(v);
}

/** Product guardrail: shown wherever scores or reports are rendered. */
export const LEGAL_DISCLAIMER =
  "This tool helps organise compliance work and identify potential gaps. It does not replace legal advice. Final legal interpretation should be reviewed by qualified counsel.";
