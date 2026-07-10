// Enum-like domain vocabulary. Kept as strings (not DB enums) for
// portability; these constants are the single source of truth for every
// string-typed status field. Import from here — never inline the literals.

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
  "archived",
] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  needs_review: "Needs review",
  archived: "Archived",
};

export const REMEDIATION_STATUSES = [
  "not_started",
  "in_progress",
  "evidence_required",
  "ready_for_review",
  "accepted",
  "closed",
] as const;
export type RemediationStatus = (typeof REMEDIATION_STATUSES)[number];

export const REMEDIATION_STATUS_LABELS: Record<RemediationStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  evidence_required: "Evidence required",
  ready_for_review: "Ready for review",
  accepted: "Accepted",
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

/**
 * Evidence upload ceiling. 4 MB keeps uploads within Vercel's serverless
 * request-body limit (~4.5 MB); shared here so client copy stays truthful.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// ─── Tenancy & roles ────────────────────────────────────────────────────────

export const MEMBERSHIP_ROLES = [
  "client_admin",
  "compliance_manager",
  "control_owner",
  "reviewer",
  "viewer",
] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const ROLE_LABELS: Record<MembershipRole, string> = {
  client_admin: "Client administrator",
  compliance_manager: "Compliance manager",
  control_owner: "Control owner",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

/** Server-side permission map — the single authority for role checks. */
export const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  client_admin: [
    "assessment.manage", "assessment.answer", "evidence.add", "evidence.review",
    "finding.review", "inventory.manage", "connector.manage", "report.generate",
    "export.run", "member.manage", "comment.add",
  ],
  compliance_manager: [
    "assessment.manage", "assessment.answer", "evidence.add", "evidence.review",
    "finding.review", "inventory.manage", "report.generate", "export.run", "comment.add",
  ],
  control_owner: ["assessment.answer", "evidence.add", "comment.add"],
  reviewer: ["evidence.review", "finding.review", "comment.add"],
  viewer: [],
} as const;

export type Permission =
  | "assessment.manage"
  | "assessment.answer"
  | "evidence.add"
  | "evidence.review"
  | "finding.review"
  | "inventory.manage"
  | "connector.manage"
  | "report.generate"
  | "export.run"
  | "member.manage"
  | "comment.add";

export function roleHasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as MembershipRole];
  return perms ? (perms as readonly string[]).includes(permission) : false;
}

// ─── Evidence review ────────────────────────────────────────────────────────

export const EVIDENCE_REVIEW_STATUSES = [
  "unreviewed",
  "accepted",
  "rejected",
  "expired",
  "needs_update",
] as const;
export type EvidenceReviewStatus = (typeof EVIDENCE_REVIEW_STATUSES)[number];

export const EVIDENCE_REVIEW_LABELS: Record<EvidenceReviewStatus, string> = {
  unreviewed: "Unreviewed",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  needs_update: "Needs update",
};

// ─── Monitoring ─────────────────────────────────────────────────────────────

export const FINDING_STATUSES = [
  "new",
  "under_review",
  "confirmed",
  "dismissed",
  "resolved",
] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  new: "New — awaiting review",
  under_review: "Under review",
  confirmed: "Confirmed",
  dismissed: "Dismissed",
  resolved: "Resolved",
};

export const FINDING_SEVERITIES = ["high", "medium", "low", "info"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export const SYNC_STAGES = [
  "queued",
  "connecting",
  "discovering",
  "normalizing",
  "evaluating_rules",
  "mapping_controls",
  "updating_readiness",
  "completed",
] as const;
export type SyncStage = (typeof SYNC_STAGES)[number];

export const SYNC_STAGE_LABELS: Record<SyncStage, string> = {
  queued: "Queued",
  connecting: "Connecting",
  discovering: "Discovering",
  normalizing: "Normalizing",
  evaluating_rules: "Evaluating rules",
  mapping_controls: "Mapping controls",
  updating_readiness: "Updating readiness",
  completed: "Completed",
};

export const AUDIT_ORIGINS = ["human", "automated_rule", "system_job", "optional_ai"] as const;
export type AuditOrigin = (typeof AUDIT_ORIGINS)[number];

/** Canonical origin labels — every surface must render these identically. */
export const AUDIT_ORIGIN_LABELS: Record<AuditOrigin, string> = {
  human: "Human",
  automated_rule: "Automated rule",
  system_job: "System job",
  optional_ai: "Optional AI — suggestion only",
};

/** Guardrail copy shown wherever automated findings are rendered. */
export const FINDING_REVIEW_NOTICE = "Automated finding requiring human review.";

export const MONITORING_DISCLAIMER =
  "Automated monitoring may identify potential risks and evidence candidates. Findings require human review before they can affect the official compliance position.";

export function isFindingStatus(v: unknown): v is FindingStatus {
  return typeof v === "string" && (FINDING_STATUSES as readonly string[]).includes(v);
}

export function isEvidenceReviewStatus(v: unknown): v is EvidenceReviewStatus {
  return typeof v === "string" && (EVIDENCE_REVIEW_STATUSES as readonly string[]).includes(v);
}

/** Product guardrail: shown wherever scores or reports are rendered. */
export const LEGAL_DISCLAIMER =
  "This tool helps organise compliance work and identify potential gaps. It does not replace legal advice. Final legal interpretation should be reviewed by qualified counsel.";
