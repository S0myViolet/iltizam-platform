// Deterministic monitoring rules — versioned structured configuration.
// The evaluator (src/lib/monitoring.ts) interprets `condition` against a
// normalized resource's metadata. Same input + same rule version ⇒ same
// result, always. Every rule requires human review; findings never alter the
// official score until a reviewer confirms them.

export interface RuleCondition {
  all?: RuleClause[];
  any?: RuleCondition[];
}

export interface RuleClause {
  field: string;
  op:
    | "eq"
    | "neq"
    | "isTrue"
    | "isFalse"
    | "missing"
    | "present"
    | "includes"
    | "inSet"
    | "notInSet"
    | "beforeNow"
    | "gteThreshold";
  value?: string | number | boolean | string[];
}

export interface MonitoringRuleSeed {
  code: string;
  version: number;
  name: string;
  description: string;
  category: string;
  severity: "high" | "medium" | "low" | "info";
  condition: RuleCondition;
  /** Template for the finding title; {name} interpolates the resource name. */
  findingTitle: string;
  findingDescription: string;
  relatedControlCodes: string[]; // Egypt PDPL control codes
  regulationCodes: string[];
  recommendedAction: string;
  isEvidenceCandidate?: boolean;
}

export const MONITORING_RULES: MonitoringRuleSeed[] = [
  {
    code: "DEMO-ACCESS-001",
    version: 1,
    name: "Personal data publicly accessible",
    description: "Personal data stored with public sharing status.",
    category: "access_control",
    severity: "high",
    condition: {
      all: [
        { field: "containsPersonalData", op: "isTrue" },
        { field: "sharingStatus", op: "eq", value: "public" },
      ],
    },
    findingTitle: "Personal data may be publicly accessible: {name}",
    findingDescription:
      "This resource contains personal data and its sharing status is public. Public exposure of personal data may breach the security duties of Egypt PDPL.",
    relatedControlCodes: ["EG-SEC-03", "EG-SEC-01"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction:
      "Restrict access to named, authorised people and review how the resource became public.",
  },
  {
    code: "DEMO-SENSITIVE-001",
    version: 1,
    name: "Sensitive data with insufficient access restriction",
    description: "Sensitive personal data whose access restriction is missing, public or broad.",
    category: "sensitive_data",
    severity: "high",
    condition: {
      all: [
        { field: "containsSensitiveData", op: "isTrue" },
        { field: "accessRestriction", op: "inSet", value: ["missing", "public", "broad"] },
      ],
    },
    findingTitle: "Sensitive personal data with broad access: {name}",
    findingDescription:
      "This resource contains sensitive personal data and its access restriction is missing or broad. Sensitive-data breaches under Egypt PDPL carry criminal penalties.",
    relatedControlCodes: ["EG-SEC-07", "EG-CON-04"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction:
      "Apply strict, role-based access to this resource and verify the lawful basis and written consent for the sensitive data it holds.",
  },
  {
    code: "DEMO-TRANSFER-001",
    version: 1,
    name: "Cross-border transfer requires review",
    description: "Personal data stored in or sent to a destination outside Egypt.",
    category: "cross_border_transfer",
    severity: "high",
    condition: {
      all: [
        { field: "containsPersonalData", op: "isTrue" },
        { field: "destinationCountry", op: "present" },
        { field: "destinationCountry", op: "neq", value: "Egypt" },
      ],
    },
    findingTitle: "Cross-border data flow to review: {name}",
    findingDescription:
      "Personal data in this resource references a destination outside Egypt. Cross-border transfers under Egypt PDPL require a PDPC licence or permit and a destination protection level no lower than Egypt's.",
    relatedControlCodes: ["EG-TRF-01", "EG-TRF-02", "EG-TRF-03"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction:
      "Map this flow, confirm the PDPC transfer authorisation covering it, and assess the destination's protection level.",
  },
  {
    code: "DEMO-RETENTION-001",
    version: 1,
    name: "Retention period not documented",
    description: "Personal data without a documented retention period.",
    category: "retention",
    severity: "medium",
    condition: {
      all: [
        { field: "containsPersonalData", op: "isTrue" },
        { field: "retentionPeriod", op: "missing" },
      ],
    },
    findingTitle: "No documented retention period: {name}",
    findingDescription:
      "This resource contains personal data but no documented retention period. Egypt PDPL requires data to be kept only for the declared processing period.",
    relatedControlCodes: ["EG-RET-01"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Assign this data category a retention period and justification in the retention schedule.",
  },
  {
    code: "DEMO-RETENTION-002",
    version: 1,
    name: "Retention date passed without disposal",
    description: "A resource whose retention date has passed and whose deletion is not completed.",
    category: "retention",
    severity: "medium",
    condition: {
      all: [
        { field: "retentionDate", op: "present" },
        { field: "retentionDate", op: "beforeNow" },
        { field: "deletionStatus", op: "neq", value: "completed" },
      ],
    },
    findingTitle: "Data past its retention date: {name}",
    findingDescription:
      "This resource's retention date has passed and disposal is not recorded as completed. Holding data beyond the declared period conflicts with Egypt PDPL retention duties.",
    relatedControlCodes: ["EG-RET-02"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Erase or return the data, record the disposal, or document the legal ground for continued retention.",
  },
  {
    code: "DEMO-OWNER-001",
    version: 1,
    name: "Personal data without an accountable owner",
    description: "Personal data whose business owner is not recorded.",
    category: "ownership",
    severity: "medium",
    condition: {
      all: [
        { field: "containsPersonalData", op: "isTrue" },
        { field: "businessOwner", op: "missing" },
      ],
    },
    findingTitle: "No accountable owner recorded: {name}",
    findingDescription:
      "This resource contains personal data but no business owner is recorded. Accountability duties require a named owner for data-protection decisions.",
    relatedControlCodes: ["EG-GOV-07"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Assign a named business owner for this data and record it in the inventory.",
  },
  {
    code: "DEMO-EVIDENCE-001",
    version: 1,
    name: "Evidence candidate detected",
    description:
      "The resource type deterministically identifies a policy, register, agreement, licence, appointment letter, consent log, training record or audit report.",
    category: "evidence",
    severity: "info",
    condition: {
      all: [{ field: "evidenceType", op: "present" }],
    },
    findingTitle: "Evidence candidate: {name}",
    findingDescription:
      "This resource looks like compliance evidence. It is an informational candidate only — a reviewer must attach and accept it before it counts toward any control.",
    relatedControlCodes: [],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Review the document and, if valid, attach it as evidence to the control it supports.",
    isEvidenceCandidate: true,
  },
  {
    code: "DEMO-MARKETING-001",
    version: 1,
    name: "Marketing data without linked consent evidence",
    description: "Marketing-lead data with no linked consent evidence.",
    category: "consent",
    severity: "high",
    condition: {
      all: [
        { field: "dataCategories", op: "includes", value: "marketing_lead" },
        { field: "linkedConsentEvidence", op: "isFalse" },
      ],
    },
    findingTitle: "Electronic-marketing consent evidence missing: {name}",
    findingDescription:
      "This resource holds marketing-lead data with no linked consent evidence. Egypt PDPL requires prior consent for electronic marketing with an opt-out in every message.",
    relatedControlCodes: ["EG-CON-07"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Locate or capture the consent records behind these leads before further marketing use.",
  },
  {
    code: "DEMO-LICENCE-001",
    version: 1,
    name: "Sensitive data without linked licence evidence",
    description: "Sensitive personal data with no linked PDPC licence evidence.",
    category: "licensing",
    severity: "high",
    condition: {
      all: [
        { field: "containsSensitiveData", op: "isTrue" },
        { field: "linkedLicenceEvidence", op: "isFalse" },
      ],
    },
    findingTitle: "Sensitive-data authorisation to verify: {name}",
    findingDescription:
      "This resource holds sensitive personal data and no PDPC licence evidence is linked. Sensitive-data processing without the required authorisation is a criminal offence under Egypt PDPL.",
    relatedControlCodes: ["EG-LAW-05", "EG-GOV-03"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Verify the PDPC licence covering sensitive-data processing and link it as evidence.",
  },
  {
    code: "DEMO-SECURITY-001",
    version: 1,
    name: "Payroll data without adequate safeguards",
    description: "Payroll data unencrypted, or with missing/broad access restriction.",
    category: "security",
    severity: "high",
    condition: {
      any: [
        {
          all: [
            { field: "dataCategories", op: "includes", value: "payroll" },
            { field: "encryptionStatus", op: "isFalse" },
          ],
        },
        {
          all: [
            { field: "dataCategories", op: "includes", value: "payroll" },
            { field: "accessRestriction", op: "inSet", value: ["missing", "broad"] },
          ],
        },
      ],
    },
    findingTitle: "Payroll data safeguards to review: {name}",
    findingDescription:
      "Payroll data in this resource is unencrypted or broadly accessible. Egypt PDPL requires security measures proportionate to the data's sensitivity.",
    relatedControlCodes: ["EG-SEC-02", "EG-SEC-03"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Encrypt the archive and restrict access to the payroll team.",
  },
  {
    code: "DEMO-PROCESSOR-001",
    version: 1,
    name: "External processor without linked agreement",
    description: "An external processor relationship with no linked processing agreement.",
    category: "processor_management",
    severity: "high",
    condition: {
      all: [
        { field: "externalProcessor", op: "isTrue" },
        { field: "linkedProcessorAgreement", op: "isFalse" },
      ],
    },
    findingTitle: "Processor agreement to verify: {name}",
    findingDescription:
      "This resource references an external processor with no linked processing agreement. Egypt PDPL requires written contracts and licensed processors acting only on your instructions.",
    relatedControlCodes: ["EG-VEN-02"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Execute or locate the written processing agreement and link it as evidence.",
  },
  {
    code: "DEMO-RIGHTS-001",
    version: 1,
    name: "Rights request approaching or past the PDPL deadline",
    description:
      "A data-subject request open for at least the configured PDPL warning threshold (working days).",
    category: "rights_requests",
    severity: "high",
    condition: {
      all: [
        { field: "requestType", op: "present" },
        { field: "workingDaysOpen", op: "gteThreshold", value: 6 },
      ],
    },
    findingTitle: "Rights-request deadline alert: {name}",
    findingDescription:
      "A data-subject request in this resource has been open at or beyond the Egypt PDPL response window of six working days.",
    relatedControlCodes: ["EG-DSR-05"],
    regulationCodes: ["EG-PDPL"],
    recommendedAction: "Answer the outstanding requests immediately and record the response dates.",
  },
];
