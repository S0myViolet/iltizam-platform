// Deterministic monitoring rules (MON-*) — the fixed, versioned, rules-based
// checks the scan engine evaluates against every normalized vault resource.
// Same facts + same rule version ⇒ same findings, always. No AI anywhere.
//
// Facts come from two places, combined by the scan engine:
//   • the source manifest (owner, sharing, retention, transfers, evidence links)
//   • the parsed file contents (row counts, open rights-request working days)
// Derived facts computed by the engine (documented here because rules use them):
//   • requiresEncryption — containsSensitiveData OR data categories include
//     payroll / financial / biometric
//   • leavesEgypt — storageCountry ≠ Egypt OR any destination country ≠ Egypt
//   • isMarketingData — data categories include marketing_lead
//   • hasOpenRightsRequest / maxOpenWorkingDays — parsed from the rights register

export interface RuleClause {
  field: string;
  op:
    | "eq" | "neq" | "isTrue" | "isFalse" | "missing" | "present"
    | "includes" | "inSet" | "notInSet" | "beforeNow" | "gteThreshold";
  value?: unknown;
}

export interface RuleCondition {
  all?: RuleClause[];
  any?: RuleCondition[];
}

export interface MonitoringRuleSeed {
  code: string;
  version: number;
  name: string;
  category: string;
  severity: "high" | "medium" | "low" | "info";
  description: string;
  condition: RuleCondition;
  findingTitle: string; // {name} replaced with the resource name
  findingDescription: string;
  recommendedAction: string;
  relatedControlCodes: string[]; // Egypt PDPL control codes
  isEvidenceCandidate?: boolean;
}

export const MONITORING_RULES: MonitoringRuleSeed[] = [
  {
    code: "MON-ACCESS-001",
    version: 1,
    name: "Personal data shared publicly",
    category: "access",
    severity: "high",
    description: "Flags any resource containing personal data whose sharing status is public.",
    condition: { all: [
      { field: "containsPersonalData", op: "isTrue" },
      { field: "sharingStatus", op: "eq", value: "public" },
    ] },
    findingTitle: "Personal data may be publicly accessible: {name}",
    findingDescription: "This source contains personal data and is marked publicly shared. Public exposure of personal data is a serious protection failure under the PDPL's security obligations.",
    recommendedAction: "Restrict the sharing setting immediately, confirm who accessed the file, and record the review outcome.",
    relatedControlCodes: ["EG-SEC-03", "EG-SEC-01"],
  },
  {
    code: "MON-SENSITIVE-001",
    version: 1,
    name: "Sensitive data with broad access",
    category: "access",
    severity: "high",
    description: "Flags sensitive-data resources whose access level is broad or unrestricted.",
    condition: { all: [
      { field: "containsSensitiveData", op: "isTrue" },
      { field: "accessLevel", op: "inSet", value: ["broad", "unrestricted"] },
    ] },
    findingTitle: "Sensitive data is broadly accessible: {name}",
    findingDescription: "Sensitive data (for example biometric records) is accessible beyond a restricted group. Sensitive data carries heightened duties, including PDPC authorization, under the PDPL.",
    recommendedAction: "Reduce access to a named, need-to-know group and verify the sensitive-data licence covers this processing.",
    relatedControlCodes: ["EG-SEC-07", "EG-CON-04"],
  },
  {
    code: "MON-SECURITY-001",
    version: 1,
    name: "Encryption missing on high-risk data",
    category: "security",
    severity: "high",
    description: "Flags payroll, financial, biometric, or sensitive resources that are not encrypted. Uses the derived requiresEncryption fact.",
    condition: { all: [
      { field: "requiresEncryption", op: "isTrue" },
      { field: "encryptionStatus", op: "neq", value: "encrypted" },
    ] },
    findingTitle: "High-risk data stored without encryption: {name}",
    findingDescription: "This resource holds payroll, financial, biometric, or otherwise sensitive information and is not encrypted at rest.",
    recommendedAction: "Encrypt the store or migrate the data into an encrypted system, then document the control.",
    relatedControlCodes: ["EG-SEC-02", "EG-SEC-03"],
  },
  {
    code: "MON-TRANSFER-001",
    version: 1,
    name: "Personal data leaving Egypt",
    category: "transfers",
    severity: "high",
    description: "Flags personal data stored in, or sent to, a country other than Egypt. Uses the derived leavesEgypt fact.",
    condition: { all: [
      { field: "containsPersonalData", op: "isTrue" },
      { field: "leavesEgypt", op: "isTrue" },
    ] },
    findingTitle: "Cross-border data flow to review: {name}",
    findingDescription: "Personal data connected to this source is stored in or transferred to a destination outside Egypt. The PDPL requires a licence and an equivalent level of protection for cross-border transfers.",
    recommendedAction: "Verify the transfer licence, the destination's protection level, and the contractual safeguards for this flow.",
    relatedControlCodes: ["EG-TRF-01", "EG-TRF-02", "EG-TRF-03"],
  },
  {
    code: "MON-RETENTION-001",
    version: 1,
    name: "Retention period not documented",
    category: "retention",
    severity: "medium",
    description: "Flags personal-data resources without a documented retention period.",
    condition: { all: [
      { field: "containsPersonalData", op: "isTrue" },
      { field: "retentionPeriod", op: "missing" },
    ] },
    findingTitle: "No documented retention period: {name}",
    findingDescription: "This personal-data source has no documented retention period, so the organization cannot show the data is kept only as long as necessary.",
    recommendedAction: "Assign a retention period from the retention schedule and record its legal basis.",
    relatedControlCodes: ["EG-RET-01"],
  },
  {
    code: "MON-RETENTION-002",
    version: 1,
    name: "Data kept past its retention date",
    category: "retention",
    severity: "medium",
    description: "Flags resources whose retention date has passed without completed deletion.",
    condition: { all: [
      { field: "retentionDate", op: "beforeNow" },
      { field: "deletionStatus", op: "neq", value: "completed" },
    ] },
    findingTitle: "Records retained past their retention date: {name}",
    findingDescription: "The documented retention date for this source has passed and deletion has not been completed.",
    recommendedAction: "Review the records, delete or anonymize what is out of period, and document the disposal.",
    relatedControlCodes: ["EG-RET-02"],
  },
  {
    code: "MON-OWNER-001",
    version: 1,
    name: "Personal data without an accountable owner",
    category: "governance",
    severity: "medium",
    description: "Flags personal-data resources with no assigned business owner.",
    condition: { all: [
      { field: "containsPersonalData", op: "isTrue" },
      { field: "owner", op: "missing" },
    ] },
    findingTitle: "No accountable owner assigned: {name}",
    findingDescription: "No business owner is accountable for this personal-data source, which undermines the accountability the PDPL expects.",
    recommendedAction: "Assign a named owner responsible for access, retention, and accuracy of this source.",
    relatedControlCodes: ["EG-GOV-07"],
  },
  {
    code: "MON-MARKETING-001",
    version: 1,
    name: "Marketing data without consent evidence",
    category: "consent",
    severity: "high",
    description: "Flags marketing-lead data with no linked consent evidence. Uses the derived isMarketingData fact.",
    condition: { all: [
      { field: "isMarketingData", op: "isTrue" },
      { field: "consentEvidenceLinked", op: "isFalse" },
    ] },
    findingTitle: "Electronic marketing without consent evidence: {name}",
    findingDescription: "Marketing contact data exists with no linked consent evidence. The PDPL requires consent for electronic marketing, with a working opt-out.",
    recommendedAction: "Locate or collect consent records for these contacts, or suppress them from marketing until consent exists.",
    relatedControlCodes: ["EG-CON-07"],
  },
  {
    code: "MON-LICENCE-001",
    version: 1,
    name: "Sensitive data without licence evidence",
    category: "authorization",
    severity: "high",
    description: "Flags sensitive-data resources with no linked PDPC licence evidence.",
    condition: { all: [
      { field: "containsSensitiveData", op: "isTrue" },
      { field: "licenceEvidenceLinked", op: "isFalse" },
    ] },
    findingTitle: "Sensitive-data authorization to verify: {name}",
    findingDescription: "Sensitive data is processed with no linked licence evidence. Processing sensitive data requires PDPC authorization under the PDPL.",
    recommendedAction: "Confirm the PDPC licence scope covers this processing and link the licence record as evidence.",
    relatedControlCodes: ["EG-LAW-05", "EG-GOV-03"],
  },
  {
    code: "MON-PROCESSOR-001",
    version: 1,
    name: "External processor without an agreement",
    category: "vendors",
    severity: "medium",
    description: "Flags external processors with no linked processing agreement.",
    condition: { all: [
      { field: "externalProcessor", op: "isTrue" },
      { field: "processorAgreementLinked", op: "isFalse" },
    ] },
    findingTitle: "Processor without a processing agreement: {name}",
    findingDescription: "An external processor handles data from this source with no linked processing agreement on file.",
    recommendedAction: "Put a written processing agreement in place and link it to this vendor before further processing.",
    relatedControlCodes: ["EG-VEN-02"],
  },
  {
    code: "MON-RIGHTS-001",
    version: 1,
    name: "Rights request at the deadline",
    category: "rights",
    severity: "high",
    description: "Flags open data-subject requests at or beyond the 6-working-day PDPL response window. Working days come from the parsed rights register.",
    condition: { all: [
      { field: "hasOpenRightsRequest", op: "isTrue" },
      { field: "maxOpenWorkingDays", op: "gteThreshold", value: 6 },
    ] },
    findingTitle: "Rights-request deadline alert: {name}",
    findingDescription: "An open data-subject request has reached the PDPL's 6-working-day response window.",
    recommendedAction: "Respond to the request today and record the response in the rights register.",
    relatedControlCodes: ["EG-DSR-05"],
  },
  {
    code: "MON-EVIDENCE-001",
    version: 1,
    name: "Compliance evidence detected",
    category: "evidence",
    severity: "info",
    description: "Recognizes policies, licences, registers, agreements, appointment records, consent logs, and training records as evidence candidates. A human reviewer must attach and accept a candidate before it counts.",
    condition: { all: [{ field: "evidenceType", op: "present" }] },
    findingTitle: "Evidence candidate: {name}",
    findingDescription: "This resource looks like compliance evidence. It is an informational candidate only — a reviewer must attach and accept it before it counts toward any control.",
    recommendedAction: "Review the document and, if valid, attach it as evidence to the matching control.",
    relatedControlCodes: [],
    isEvidenceCandidate: true,
  },
];
