// Egypt PDPL control library — seed data.
//
// Source of truth: "Egypt_PDPL_Law_and_Controls.docx" (7 July 2026) — Egypt
// Personal Data Protection Law No. 151 of 2020 with Executive Regulations
// No. 816 of 2025 (Decree of 1 November 2025). 85 controls across 14
// domains: 64 legally mandatory, 21 important. Regulator: Personal Data
// Protection Center (PDPC). Compliance deadline: 1 November 2026.
//
// Question wording, severity, domain and PDPL basis are VERBATIM from the
// document (bases displayed with a "PDPL " prefix). Guidance fields
// (description, whyItMatters, recommendedAction, evidenceExamples) are
// product copy written around the document's own context — the licence and
// permit regime, criminal exposure for sensitive data and cross-border
// breaches, the 6-working-day rights deadline, the 72-hour PDPC / 3-working-
// day affected-person breach notices, DPO registration, and the Holder role.
// Per the document, the Impact Assessments domain is provisional throughout:
// the Law contains no explicit DPIA duty, so those controls await
// confirmation in the Executive Regulations and PDPC guidance. The document
// also notes the whole library still needs counsel sign-off before client-
// facing use.

import type { Severity } from "@/lib/types";

export interface PdplDomainSeed {
  name: string;
  code: string; // platform prefix inside EGP- codes, e.g. "GOV"
  order: number;
  blurb: string;
  expectedControls: number;
}

/** The 14 PDPL platform domains, in the order the document defines. */
export const PDPL_DOMAINS: PdplDomainSeed[] = [
  { name: "Governance & Accountability", code: "GOV", order: 1, expectedControls: 8, blurb: "PDPC licences, accountability and who answers for personal data in Egypt." },
  { name: "Lawful Basis", code: "LAW", order: 2, expectedControls: 6, blurb: "Your legal ground under the PDPL for every use of personal data." },
  { name: "Consent Management", code: "CON", order: 3, expectedControls: 7, blurb: "Explicit consent, written consent for sensitive data, guardians and marketing opt-outs." },
  { name: "Data Subject Rights", code: "DSR", order: 4, expectedControls: 7, blurb: "Handling rights requests on the PDPL's six-working-day clock." },
  { name: "Records of Processing", code: "ROP", order: 5, expectedControls: 5, blurb: "The electronic processing register and what the PDPC can ask to see." },
  { name: "Data Protection Officer", code: "DPO", order: 6, expectedControls: 7, blurb: "Appointing, registering and empowering your DPO with the PDPC." },
  { name: "Security Measures", code: "SEC", order: 7, expectedControls: 8, blurb: "Encryption, confidentiality and security the PDPL expects around personal data." },
  { name: "Breach Management", code: "BRE", order: 8, expectedControls: 6, blurb: "72 hours to the PDPC, 3 working days to affected people, immediately for national security." },
  { name: "Cross-Border Transfers", code: "TRF", order: 9, expectedControls: 6, blurb: "Licences, permits and protection-level checks before data leaves Egypt." },
  { name: "Vendors & Processors", code: "VEN", order: 10, expectedControls: 6, blurb: "Processor licences and contracts for everyone handling data on your behalf." },
  { name: "Retention & Disposal", code: "RET", order: 11, expectedControls: 5, blurb: "Keeping data only as long as the purpose lasts, and disposing of it properly." },
  { name: "Privacy Notices", code: "NOT", order: 12, expectedControls: 5, blurb: "Telling people clearly — in plain Arabic — what you do with their data." },
  { name: "Impact Assessments", code: "DPI", order: 13, expectedControls: 5, blurb: "Assessing privacy risk before high-risk processing (provisional pending PDPC guidance)." },
  { name: "Training & Awareness", code: "TRA", order: 14, expectedControls: 4, blurb: "DPO-led training and the records that prove it happened." },
];

export interface PdplControlSeed {
  /** Stable code: EGP-<domain>-<nn>, e.g. "EGP-GOV-01". */
  code: string;
  /** Plain yes/no question — exact wording from the source document. */
  question: string;
  /** Formal/plain description of the obligation, from the document. */
  description: string;
  domain: string;
  severity: Severity;
  /** PDPL basis citation from the document, e.g. "PDPL Art. 4(10), 26". */
  legalBasis: string;
  evidenceExamples: string[];
  whyItMatters: string;
  recommendedAction: string;
  /** True where the document marks the control provisional (e.g. Impact Assessments). */
  provisional?: boolean;
  /** Roles the control applies to; defaults to ["controller"]. */
  appliesToRoles?: string[];
}

export const PDPL_CONTROLS: PdplControlSeed[] = [
  // ── 1. Governance & Accountability (8) ────────────────────────────────────
  {
    code: "EGP-GOV-01",
    question:
      "Do you have written data-protection policies, approved by management and shared with staff?",
    description:
      "Adopt management-approved data-protection policies and make them known to staff, as part of the controller's general duties under the PDPL.",
    domain: "Governance & Accountability",
    severity: "important",
    legalBasis: "PDPL Art 4",
    evidenceExamples: ["Signed policy", "Staff circulation record"],
    whyItMatters:
      "Written, approved policies are the first evidence of compliance the PDPC will expect a licensed organisation to produce.",
    recommendedAction:
      "Draft data-protection policies, obtain management approval, share them with all staff, and keep the circulation record.",
  },
  {
    code: "EGP-GOV-02",
    question:
      "Is there a named senior person formally accountable for personal-data protection across the company?",
    description:
      "Assign formal senior accountability for personal-data protection across the organisation.",
    domain: "Governance & Accountability",
    severity: "important",
    legalBasis: "PDPL Art 4",
    evidenceExamples: ["Appointment memo", "Org chart"],
    whyItMatters:
      "PDPL duties attach to the organisation; without a named senior owner, licence conditions and deadlines have no one answerable for them.",
    recommendedAction:
      "Name a senior accountable owner for data protection in writing, distinct from (and senior sponsor to) the DPO.",
  },
  {
    code: "EGP-GOV-03",
    question: "Do you hold a valid licence or permit from the PDPC to process personal data?",
    description:
      "Hold a valid PDPC licence (three years) or permit (one year / specific purpose) covering your processing of personal data.",
    domain: "Governance & Accountability",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.10, 26",
    evidenceExamples: ["PDPC licence or permit", "Renewal tracking"],
    whyItMatters:
      "Processing without the required PDPC licence or permit is unlawful in itself — this is the gateway obligation the whole Egyptian regime hangs on.",
    recommendedAction:
      "Identify the licence or permit category your processing needs, apply to the PDPC, and diarise renewal well before expiry.",
  },
  {
    code: "EGP-GOV-04",
    question:
      "If your company is based outside Egypt, have you appointed a representative inside Egypt?",
    description:
      "Where established outside Egypt but within the PDPL's extraterritorial scope, appoint a representative inside Egypt.",
    domain: "Governance & Accountability",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.11, 5.12",
    evidenceExamples: ["Appointment letter", "Representative contact record"],
    whyItMatters:
      "The PDPL reaches foreign companies processing Egyptians' data; the in-Egypt representative is how the PDPC holds them answerable.",
    recommendedAction:
      "If you serve or monitor people in Egypt from abroad, appoint an Egyptian representative in writing and record their details.",
  },
  {
    code: "EGP-GOV-05",
    question:
      "Can you produce evidence of your compliance and allow the PDPC to inspect it on request?",
    description:
      "Maintain compliance evidence and cooperate with PDPC inspection and evidence-production requests.",
    domain: "Governance & Accountability",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.12",
    evidenceExamples: ["Compliance evidence pack", "Inspection procedure"],
    whyItMatters:
      "The PDPC has inspection rights; failure to produce evidence turns an inspection into a violation even where the underlying practice was sound.",
    recommendedAction:
      "Keep an inspection-ready evidence pack (licences, register, policies, notices) and a procedure for handling PDPC requests.",
  },
  {
    code: "EGP-GOV-06",
    question:
      "Before you launch a new system, product, or campaign, do you check its privacy impact first?",
    description:
      "Run a privacy check before launching new systems, products or campaigns that process personal data.",
    domain: "Governance & Accountability",
    severity: "important",
    legalBasis: "PDPL Art 4",
    evidenceExamples: ["Pre-launch checkpoint records"],
    whyItMatters:
      "Catching licence, consent or transfer issues before launch is far cheaper than unwinding them under PDPC scrutiny afterwards.",
    recommendedAction:
      "Add a privacy checkpoint to your launch process so nothing ships without a recorded review.",
  },
  {
    code: "EGP-GOV-07",
    question:
      "Is it clear who owns data protection across each team — IT, HR, marketing, legal?",
    description:
      "Assign clear per-team ownership of data-protection duties across IT, HR, marketing and legal.",
    domain: "Governance & Accountability",
    severity: "important",
    legalBasis: "PDPL Art 4",
    evidenceExamples: ["RACI matrix"],
    whyItMatters:
      "PDPL deadlines are short — six working days for rights requests, 72 hours for breaches — and only pre-assigned owners can hit them.",
    recommendedAction:
      "Map every PDPL obligation to a named owner in each team and keep the matrix current.",
  },
  {
    code: "EGP-GOV-08",
    question:
      "Do you keep a compliance calendar of recurring privacy tasks so nothing is missed?",
    description:
      "Maintain a compliance calendar of recurring privacy tasks — licence renewals, register reviews, training, audits.",
    domain: "Governance & Accountability",
    severity: "important",
    legalBasis: "PDPL Art 4",
    evidenceExamples: ["Compliance calendar", "Completion tracking"],
    whyItMatters:
      "Licences and permits expire on fixed terms; a missed renewal quietly converts lawful processing into unlicensed processing.",
    recommendedAction:
      "Build a calendar of recurring PDPL tasks with owners and due dates, starting with licence and permit renewals.",
  },

  // ── 2. Lawful Basis (6) ───────────────────────────────────────────────────
  {
    code: "EGP-LAW-01",
    question:
      "For every way you use personal data, have you identified and recorded a lawful basis under the PDPL?",
    description:
      "Identify and record a PDPL lawful basis for every processing activity before it starts.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 6",
    evidenceExamples: ["Lawful basis register"],
    whyItMatters:
      "Processing without a lawful basis breaches the PDPL's core rule, and controller-duty failures carry fines up to EGP 3 million.",
    recommendedAction:
      "List every processing activity and record its PDPL basis in a register before new activities begin.",
  },
  {
    code: "EGP-LAW-02",
    question: "Where you rely on consent, is it explicit and properly obtained before processing?",
    description:
      "Obtain explicit, properly formed consent before processing wherever consent is the basis relied on.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2",
    evidenceExamples: ["Consent capture flow", "Consent records"],
    whyItMatters:
      "The PDPL requires consent to be explicit — implied or bundled consent leaves the processing without a basis at all.",
    recommendedAction:
      "Review every consent-based activity and confirm consent is captured explicitly, before processing starts.",
  },
  {
    code: "EGP-LAW-03",
    question:
      "Do you collect personal data only for specific, legitimate, and clearly declared purposes?",
    description:
      "Collect personal data only for specific, legitimate and declared purposes.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 3.1",
    evidenceExamples: ["Purpose register", "Collection notices"],
    whyItMatters:
      "Purpose limitation is a named PDPL principle — undeclared purposes make the collection itself unlawful.",
    recommendedAction:
      "Declare the purpose at every collection point and check each dataset against its declared purpose.",
  },
  {
    code: "EGP-LAW-04",
    question:
      "Do you avoid using data in ways that conflict with your declared purpose or your activity?",
    description:
      "Do not process personal data in ways incompatible with the declared purpose or your activity.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 3.6",
    evidenceExamples: ["Purpose-change assessments"],
    whyItMatters:
      "Reuse beyond the declared purpose is a standalone violation, however lawful the original collection was.",
    recommendedAction:
      "Gate any new use of existing data behind a documented purpose-compatibility check.",
  },
  {
    code: "EGP-LAW-05",
    question:
      "Before handling sensitive data, do you confirm both a lawful basis and the required PDPC licence?",
    description:
      "Confirm a lawful basis and hold the required PDPC sensitive-data licence before processing sensitive personal data.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 6, 12",
    evidenceExamples: ["Sensitive-data licence", "Basis assessment"],
    whyItMatters:
      "Sensitive data is the PDPL's criminal zone: processing it without consent or licence carries at least three months' imprisonment and fines up to EGP 5 million.",
    recommendedAction:
      "Inventory sensitive data, confirm the basis for each use, and obtain the PDPC sensitive-data licence before processing.",
  },
  {
    code: "EGP-LAW-06",
    question:
      "When you rely on a basis other than consent, have you documented which one and why it fits?",
    description:
      "Document the non-consent lawful basis relied on for each activity and why it applies.",
    domain: "Lawful Basis",
    severity: "important",
    legalBasis: "PDPL Art 6",
    evidenceExamples: ["Basis memos"],
    whyItMatters:
      "When the PDPC asks why processing was lawful, a written basis decided in advance is worth far more than one reconstructed afterwards.",
    recommendedAction:
      "Write a short basis memo for every non-consent activity, naming the basis and the reasoning.",
  },

  // ── 3. Consent Management (7) ─────────────────────────────────────────────
  {
    code: "EGP-CON-01",
    question:
      "Is consent captured as a clear, explicit, affirmative action — never pre-ticked boxes or silence?",
    description:
      "Capture consent through a clear, explicit, affirmative action; pre-ticked boxes and silence do not qualify.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2",
    evidenceExamples: ["Consent UX screens", "Configuration"],
    whyItMatters:
      "Consent that isn't explicit is void under the PDPL — everything processed on top of it loses its legal ground.",
    recommendedAction:
      "Audit every consent screen and form: unticked, separate, affirmative opt-ins only.",
  },
  {
    code: "EGP-CON-02",
    question:
      "Can people withdraw consent as easily as they gave it, and does that stop the processing?",
    description:
      "Provide withdrawal of consent as easy as giving it, with withdrawal actually halting the processing.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2.2",
    evidenceExamples: ["Withdrawal mechanism", "Processing stop confirmation"],
    whyItMatters:
      "The PDPL makes withdrawal a right of the data subject; consent that is hard to withdraw was never freely given.",
    recommendedAction:
      "Add a one-step withdrawal path beside every consent and test that withdrawing stops the processing.",
  },
  {
    code: "EGP-CON-03",
    question: "Can you show, later, who consented, to what, and when?",
    description: "Keep demonstrable consent records: who consented, to what, and when.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2, 18",
    evidenceExamples: ["Consent log"],
    whyItMatters:
      "In a PDPC inspection or dispute, consent you cannot evidence is consent that does not exist.",
    recommendedAction:
      "Log every consent with person, timestamp, wording version and channel, and keep the log queryable.",
  },
  {
    code: "EGP-CON-04",
    question: "For sensitive personal data, do you obtain explicit written consent?",
    description: "Obtain explicit written consent before processing sensitive personal data.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 12",
    evidenceExamples: ["Written consent records"],
    whyItMatters:
      "Sensitive data demands written consent on top of licensing — and failures here are the PDPL's imprisonment tier.",
    recommendedAction:
      "Upgrade sensitive-data consent flows to explicit written form and retain the signed records.",
  },
  {
    code: "EGP-CON-05",
    question: "For a child’s data, do you obtain the guardian’s consent first?",
    description: "Obtain the guardian's consent before processing a child's personal data.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 12",
    evidenceExamples: ["Guardian consent records", "Age screening"],
    whyItMatters:
      "A child cannot consent under the PDPL — without the guardian's prior consent there is no basis at all.",
    recommendedAction:
      "Add age screening and a guardian-consent step wherever children's data can enter your systems.",
  },
  {
    code: "EGP-CON-06",
    question:
      "Do you avoid making a child’s entry to a game or competition conditional on extra data?",
    description:
      "Do not condition a child's participation in a game or competition on providing data beyond what the activity needs.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 12",
    evidenceExamples: ["Entry flow review"],
    whyItMatters:
      "The PDPL specifically bans trading a child's participation for extra data — a detail generic frameworks miss.",
    recommendedAction:
      "Review every child-facing game or competition entry flow and strip data fields the activity doesn't need.",
  },
  {
    code: "EGP-CON-07",
    question:
      "For electronic marketing, do you have prior consent and a clear opt-out in every message?",
    description:
      "Obtain prior consent for electronic marketing and include a clear opt-out in every message.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 17",
    evidenceExamples: ["Marketing consent records", "Message templates with opt-out"],
    whyItMatters:
      "Electronic marketing without prior consent is a named PDPL violation, and every message must carry its own way out.",
    recommendedAction:
      "Gate marketing sends on recorded prior consent and add a working opt-out to every template.",
  },

  // ── 4. Data Subject Rights (7) ────────────────────────────────────────────
  {
    code: "EGP-DSR-01",
    question: "Can people see the data you hold on them and get a copy on request?",
    description: "Provide data subjects access to their data and a copy on request.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2.1",
    evidenceExamples: ["Access response procedure"],
    whyItMatters:
      "Access is the PDPL's gateway right — denying it draws fines up to EGP 1 million.",
    recommendedAction:
      "Test that you can assemble one person's data from all systems and hand it over on request.",
  },
  {
    code: "EGP-DSR-02",
    question: "Can people correct, update, complete, or erase their data?",
    description: "Operate correction, update, completion and erasure of personal data on request.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2.3",
    evidenceExamples: ["Procedure docs", "Completion logs"],
    whyItMatters:
      "Correction and erasure are enumerated PDPL rights; refusing them is a rights violation with direct fines.",
    recommendedAction:
      "Document and test the correction/erasure procedure across every system holding personal data.",
  },
  {
    code: "EGP-DSR-03",
    question: "Can people ask you to limit the scope of processing?",
    description: "Honour requests to restrict or limit the scope of processing.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2.4",
    evidenceExamples: ["Restriction procedure"],
    whyItMatters:
      "Limitation is its own PDPL right — systems must be able to keep data while pausing its use.",
    recommendedAction:
      "Add a restriction state to your systems so processing can be limited without deleting the record.",
  },
  {
    code: "EGP-DSR-04",
    question: "Can people object to how their data is processed?",
    description: "Provide a working path for data subjects to object to processing.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2.6",
    evidenceExamples: ["Objection handling procedure"],
    whyItMatters:
      "Objection is an enumerated right; ignoring one converts routine processing into a violation.",
    recommendedAction:
      "Route objections to a named owner with a documented decision procedure and deadline tracking.",
  },
  {
    code: "EGP-DSR-05",
    question: "Do you respond to a rights request within 6 working days?",
    description: "Answer data-subject rights requests within six working days.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 10, 32",
    evidenceExamples: ["SLA tracking", "Request register"],
    whyItMatters:
      "Six working days is far tighter than the GDPR's month — without tracking from day one, the deadline is missed before anyone notices.",
    recommendedAction:
      "Track every request with its six-working-day deadline and alert owners well before it falls due.",
  },
  {
    code: "EGP-DSR-06",
    question: "Is there an easy way to submit a request, and do you verify who is asking?",
    description:
      "Provide an easy intake channel for rights requests and verify the requester's identity.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 10",
    evidenceExamples: ["Request channel", "Verification procedure"],
    whyItMatters:
      "With six working days on the clock, a lost request is a missed deadline — and data released to the wrong person is a breach.",
    recommendedAction:
      "Publish a request channel, log every request on arrival, and verify identity before acting.",
  },
  {
    code: "EGP-DSR-07",
    question:
      "Is any fee for exercising rights within the legal cap (max EGP 20,000), and is breach notice always free?",
    description:
      "Keep any rights-request fee within the legal cap (max EGP 20,000) and never charge for breach notification.",
    domain: "Data Subject Rights",
    severity: "important",
    legalBasis: "PDPL Art 2",
    evidenceExamples: ["Fee schedule"],
    whyItMatters:
      "The PDPL lets you charge for rights handling only within a capped fee — and telling someone they were breached must always be free.",
    recommendedAction:
      "Set your fee schedule against the cap and hard-code breach notices as free of charge.",
  },

  // ── 5. Records of Processing (5) ──────────────────────────────────────────
  {
    code: "EGP-ROP-01",
    question: "Do you keep a register of your personal-data processing activities?",
    description: "Maintain a register of personal-data processing activities.",
    domain: "Records of Processing",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.9",
    evidenceExamples: ["Processing register"],
    whyItMatters:
      "The register is a named controller duty and the PDPC's map of your processing — its absence is a violation on its own.",
    recommendedAction:
      "Build the processing register now and make updating it part of every new project.",
  },
  {
    code: "EGP-ROP-02",
    question: "If you process data for clients, do you keep a processor register too?",
    description: "Maintain a processor register for processing performed on behalf of clients.",
    domain: "Records of Processing",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 5.9",
    evidenceExamples: ["Processor register"],
    whyItMatters:
      "Processors carry their own PDPL register duty — working on a client's behalf does not exempt you.",
    recommendedAction:
      "Keep a separate register of client processing: categories, scope, retention and security.",
    appliesToRoles: ["processor"],
  },
  {
    code: "EGP-ROP-03",
    question:
      "Is the register secure and electronic — covering consent, categories, scope, retention, and security?",
    description:
      "Keep the register electronic and secure, covering consent, data categories, scope, retention and security measures.",
    domain: "Records of Processing",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.9; ER",
    evidenceExamples: ["Electronic register", "Access controls"],
    whyItMatters:
      "The Executive Regulations specify the register's electronic form and required contents — a spreadsheet missing fields fails the duty.",
    recommendedAction:
      "Move the register to a secured electronic system and check its fields against the Executive Regulations list.",
  },
  {
    code: "EGP-ROP-04",
    question: "Can you produce the register for the PDPC on request?",
    description: "Be able to produce the processing register to the PDPC on request.",
    domain: "Records of Processing",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.12",
    evidenceExamples: ["Production procedure"],
    whyItMatters:
      "A register you cannot produce during an inspection might as well not exist.",
    recommendedAction:
      "Define who produces the register, from where, in what format — and dry-run it once.",
  },
  {
    code: "EGP-ROP-05",
    question: "Does your DPO keep the register reviewed, accurate, and up to date?",
    description: "Have the DPO review and maintain the accuracy of the processing register.",
    domain: "Records of Processing",
    severity: "important",
    legalBasis: "PDPL Art 9.6",
    evidenceExamples: ["Review log"],
    whyItMatters:
      "Register upkeep is one of the DPO's statutory tasks — a stale register signals an inactive DPO to the PDPC.",
    recommendedAction:
      "Put register review on the DPO's recurring calendar and log each review.",
  },

  // ── 6. Data Protection Officer (7) ────────────────────────────────────────
  {
    code: "EGP-DPO-01",
    question: "Have you appointed a Data Protection Officer?",
    description: "Appoint a Data Protection Officer.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 8",
    evidenceExamples: ["Appointment letter"],
    whyItMatters:
      "The DPO is mandatory under the PDPL — most of the law's operational duties run through this role.",
    recommendedAction: "Appoint a qualified DPO formally, in writing, with defined duties.",
  },
  {
    code: "EGP-DPO-02",
    question: "Is your DPO registered in the PDPC’s DPO register?",
    description: "Register the appointed DPO in the PDPC's DPO register.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 8",
    evidenceExamples: ["PDPC registration record"],
    whyItMatters:
      "Appointment alone is not enough — an unregistered DPO leaves the statutory duty unmet.",
    recommendedAction: "File the DPO's registration with the PDPC and keep the confirmation.",
  },
  {
    code: "EGP-DPO-03",
    question:
      "Does your DPO run periodic evaluations of your data-protection systems and document the results?",
    description:
      "Have the DPO periodically evaluate data-protection systems and document the results.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 9.1",
    evidenceExamples: ["Evaluation reports"],
    whyItMatters:
      "Periodic evaluation is a statutory DPO task — undocumented evaluations cannot be shown to the PDPC.",
    recommendedAction:
      "Schedule recurring DPO evaluations of systems and keep the written results.",
  },
  {
    code: "EGP-DPO-04",
    question: "Is your DPO the point of contact with the PDPC?",
    description: "Make the DPO the organisation's point of contact with the PDPC.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 9.2",
    evidenceExamples: ["Contact designation", "Correspondence records"],
    whyItMatters:
      "The PDPC expects one accountable channel; regulator contact routed around the DPO breaks the statutory design.",
    recommendedAction:
      "Designate the DPO as PDPC contact in filings and route all regulator correspondence through them.",
  },
  {
    code: "EGP-DPO-05",
    question: "Does your DPO handle data-subject requests and complaints?",
    description: "Have the DPO receive and handle data-subject requests and complaints.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 9.3, 9.5",
    evidenceExamples: ["Request register", "Complaint records"],
    whyItMatters:
      "Requests and complaints are statutory DPO business — and the six-working-day clock runs while they sit unrouted.",
    recommendedAction:
      "Route the rights-request channel to the DPO and log every request and complaint they handle.",
  },
  {
    code: "EGP-DPO-06",
    question: "Does your DPO notify the PDPC when a breach occurs?",
    description: "Have the DPO notify the PDPC of personal-data breaches.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 9.4",
    evidenceExamples: ["Notification procedure", "Timestamped notices"],
    whyItMatters:
      "Breach notification is personally on the DPO's task list — the 72-hour clock needs a named sender, ready in advance.",
    recommendedAction:
      "Put the DPO in the breach workflow as the PDPC notifier, with the template and channel prepared.",
  },
  {
    code: "EGP-DPO-07",
    question: "Does your DPO fix violations inside the company and run staff training?",
    description:
      "Have the DPO remedy internal violations and run staff data-protection training.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 9.7, 9.8",
    evidenceExamples: ["Remediation log", "Training records"],
    whyItMatters:
      "The PDPL casts the DPO as internal enforcer and trainer — a title without these activities fails the statute.",
    recommendedAction:
      "Give the DPO a remediation log and a training programme, and keep both active.",
  },

  // ── 7. Security Measures (8) ──────────────────────────────────────────────
  {
    code: "EGP-SEC-01",
    question:
      "Have you assessed the risks to personal data and put matching security measures in place?",
    description:
      "Assess the risks to personal data and implement security measures matching those risks.",
    domain: "Security Measures",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.6",
    evidenceExamples: ["Risk assessment", "Security measure inventory"],
    whyItMatters:
      "Securing the data is a named controller duty — and the reference point for every breach the PDPC later examines.",
    recommendedAction:
      "Run a risk assessment over personal-data systems and align measures to what it finds.",
  },
  {
    code: "EGP-SEC-02",
    question: "Is personal data protected by encryption, both stored and in transit?",
    description: "Protect personal data with encryption at rest and in transit.",
    domain: "Security Measures",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.6; ER",
    evidenceExamples: ["Encryption standard", "Configurations"],
    whyItMatters:
      "The Executive Regulations name encryption specifically — unencrypted personal data is a finding waiting to happen.",
    recommendedAction:
      "Adopt an encryption standard for data at rest and in transit and verify the configurations enforcing it.",
  },
  {
    code: "EGP-SEC-03",
    question:
      "Do only authorised people have access, with reviews when staff join, move, or leave?",
    description:
      "Restrict access to authorised staff with joiner-mover-leaver reviews.",
    domain: "Security Measures",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.6",
    evidenceExamples: ["Access review logs"],
    whyItMatters:
      "Stale access is how internal leaks happen — and under the PDPL the organisation answers for them.",
    recommendedAction:
      "Enforce least-privilege access with a joiner-mover-leaver checklist and periodic reviews.",
  },
  {
    code: "EGP-SEC-04",
    question: "Do you back up personal data and test that you can actually restore it?",
    description: "Back up personal data and test restoration.",
    domain: "Security Measures",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.6",
    evidenceExamples: ["Backup schedule", "Restore test records"],
    whyItMatters:
      "Losing people's data is a security failure too — an untested backup is a hope, not a measure.",
    recommendedAction:
      "Schedule backups and run a documented restore test at least annually.",
  },
  {
    code: "EGP-SEC-05",
    question: "Do you test your security regularly — scans, penetration tests, audits?",
    description:
      "Test security effectiveness regularly through scans, penetration tests and audits.",
    domain: "Security Measures",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.6; ER",
    evidenceExamples: ["Test and audit reports"],
    whyItMatters:
      "The Regulations expect security that is verified, not assumed — untested controls decay silently.",
    recommendedAction:
      "Put scans, penetration tests or audits on a recurring schedule and keep the reports.",
  },
  {
    code: "EGP-SEC-06",
    question:
      "Do staff handle personal data only as instructed and under confidentiality obligations?",
    description:
      "Ensure staff process personal data only on instructions and under confidentiality obligations.",
    domain: "Security Measures",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 5.1",
    evidenceExamples: ["Signed confidentiality undertakings", "Handling instructions"],
    whyItMatters:
      "Your people are inside the security perimeter — instructions and confidentiality are what make their handling defensible.",
    recommendedAction:
      "Issue documented handling instructions and collect signed confidentiality undertakings.",
    appliesToRoles: ["controller", "processor"],
  },
  {
    code: "EGP-SEC-07",
    question:
      "For sensitive data, do the DPO and staff follow specific, stricter security policies?",
    description:
      "Apply specific, stricter security policies to sensitive data, followed by the DPO and staff.",
    domain: "Security Measures",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 13",
    evidenceExamples: ["Sensitive-data policy", "Acknowledgements"],
    whyItMatters:
      "Sensitive data sits in the PDPL's criminal tier — ordinary controls are not enough where prison is the downside.",
    recommendedAction:
      "Write a stricter sensitive-data security policy and have the DPO and handling staff acknowledge it.",
  },
  {
    code: "EGP-SEC-08",
    question: "Do you keep your security measures documented and current?",
    description: "Keep security measures documented and up to date.",
    domain: "Security Measures",
    severity: "important",
    legalBasis: "PDPL Art 4.6",
    evidenceExamples: ["Security documentation", "Review log"],
    whyItMatters:
      "In an inspection or after a breach, documentation is how yesterday's security decisions defend you.",
    recommendedAction:
      "Document your measures and review the documentation on a fixed cycle.",
  },

  // ── 8. Breach Management (6) ──────────────────────────────────────────────
  {
    code: "EGP-BRE-01",
    question: "Can you notify the PDPC within 72 hours of a personal-data breach?",
    description: "Notify the PDPC of a personal-data breach within 72 hours.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 7",
    evidenceExamples: ["Notification template", "Timestamped records"],
    whyItMatters:
      "72 hours to the regulator is one of the PDPL's hardest deadlines — late notice is a second violation on top of the breach.",
    recommendedAction:
      "Prepare the PDPC notification template and escalation path now, before any incident.",
  },
  {
    code: "EGP-BRE-02",
    question:
      "Do you notify the affected person within 3 working days of reporting the breach?",
    description:
      "Notify the affected data subject within three working days of reporting the breach to the PDPC.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 7",
    evidenceExamples: ["Person-facing notice templates", "Send records"],
    whyItMatters:
      "The PDPL gives affected people their own notification right on a three-working-day clock after the PDPC report — and it must be free.",
    recommendedAction:
      "Prepare person-facing breach notices and track the three-working-day deadline from each PDPC report.",
  },
  {
    code: "EGP-BRE-03",
    question: "For a breach touching national security, can you notify immediately?",
    description:
      "Notify immediately where a breach touches national-security considerations.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 7",
    evidenceExamples: ["Escalation criteria", "Immediate-notice procedure"],
    whyItMatters:
      "National-security breaches collapse the 72-hour window to immediately — a distinction unique to the Egyptian regime.",
    recommendedAction:
      "Add a national-security trigger to your incident criteria with an immediate-notification path.",
  },
  {
    code: "EGP-BRE-04",
    question:
      "Does your breach notice carry the required detail — nature, DPO contact, consequences, and remedial steps?",
    description:
      "Include the required content in breach notices: nature of the breach, DPO contact, consequences and remedial steps.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 7",
    evidenceExamples: ["Notice template with required fields"],
    whyItMatters:
      "A notice missing the statutory content doesn't discharge the duty, however fast it was sent.",
    recommendedAction:
      "Build the four required elements into the notice template so no drafting happens mid-incident.",
  },
  {
    code: "EGP-BRE-05",
    question: "Do you keep a record of every breach and how you responded?",
    description: "Keep records of every breach and the response to it.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 9.1",
    evidenceExamples: ["Breach register"],
    whyItMatters:
      "The breach record is how you prove notification decisions and remedial steps to the PDPC afterwards.",
    recommendedAction:
      "Keep a breach register recording facts, decisions, notices sent and remediation for every incident.",
  },
  {
    code: "EGP-BRE-06",
    question: "Do you have a plan to detect, contain, and escalate a breach internally?",
    description:
      "Operate an internal plan to detect, contain and escalate personal-data breaches.",
    domain: "Breach Management",
    severity: "important",
    legalBasis: "PDPL Art 4.6, 7",
    evidenceExamples: ["Incident response plan", "Escalation flow"],
    whyItMatters:
      "The 72-hour and 3-working-day clocks start ticking at once — without a rehearsed plan they are spent finding out who to call.",
    recommendedAction:
      "Write the incident plan with named escalation steps and walk the team through it once.",
  },

  // ── 9. Cross-Border Transfers (6) ─────────────────────────────────────────
  {
    code: "EGP-TRF-01",
    question: "Do you hold a PDPC licence or permit to move personal data outside Egypt?",
    description:
      "Hold a PDPC licence or permit before transferring personal data outside Egypt.",
    domain: "Cross-Border Transfers",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 14",
    evidenceExamples: ["Transfer licence or permit"],
    whyItMatters:
      "Cross-border transfer without PDPC authorisation sits in the criminal tier — imprisonment plus fines up to EGP 5 million.",
    recommendedAction:
      "Map your outbound flows and obtain the PDPC transfer licence or permit before data leaves Egypt.",
  },
  {
    code: "EGP-TRF-02",
    question: "Is the destination country’s level of protection no lower than Egypt’s?",
    description:
      "Transfer only where the destination provides a level of protection no lower than Egypt's.",
    domain: "Cross-Border Transfers",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 14, 16",
    evidenceExamples: ["Destination assessments"],
    whyItMatters:
      "The PDPL's adequacy test is Egypt's own protection level — a transfer to a weaker regime fails even with paperwork.",
    recommendedAction:
      "Assess and record each destination's protection level against Egypt's before transferring.",
  },
  {
    code: "EGP-TRF-03",
    question: "Do you map every cross-border flow — where it goes, to whom, and why?",
    description: "Map every cross-border flow: destination, recipient and purpose.",
    domain: "Cross-Border Transfers",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 14",
    evidenceExamples: ["Transfer map"],
    whyItMatters:
      "Cloud tools move data abroad quietly — you cannot licence or defend flows you haven't found.",
    recommendedAction:
      "Build the transfer map — destination, recipient, purpose — and keep it current as systems change.",
  },
  {
    code: "EGP-TRF-04",
    question:
      "Where you rely on an exception, do you have explicit consent and a valid legal ground?",
    description:
      "Rely on transfer exceptions only with explicit consent and a valid legal ground.",
    domain: "Cross-Border Transfers",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 15",
    evidenceExamples: ["Consent records", "Exception log"],
    whyItMatters:
      "The exception route still demands explicit consent plus a legal ground — it is not a loophole around licensing.",
    recommendedAction:
      "Log every exception-based transfer with its consent record and legal ground, and keep them rare.",
  },
  {
    code: "EGP-TRF-05",
    question:
      "When making data available to a party abroad, is it work-related, purpose-consistent, and adequately protected?",
    description:
      "Make data available to foreign parties only where work-related, purpose-consistent and adequately protected.",
    domain: "Cross-Border Transfers",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 16",
    evidenceExamples: ["Sharing assessments"],
    whyItMatters:
      "Even giving a foreign party access — not just sending data — is regulated availability under Article 16.",
    recommendedAction:
      "Check every foreign access grant for work-relatedness, purpose fit and protection before enabling it.",
  },
  {
    code: "EGP-TRF-06",
    question: "Have you assessed the risk of the transfer where it is needed?",
    description: "Assess transfer risk where required.",
    domain: "Cross-Border Transfers",
    severity: "important",
    legalBasis: "PDPL Art 14; ER",
    evidenceExamples: ["Transfer risk assessments"],
    whyItMatters:
      "A recorded risk assessment is how a licensed transfer stays defensible when circumstances at the destination change.",
    recommendedAction:
      "Run and file a risk assessment for transfers that need one, and revisit when destinations change.",
  },

  // ── 10. Vendors & Processors (6) ──────────────────────────────────────────
  {
    code: "EGP-VEN-01",
    question: "Before you appoint a processor, do you check they can protect the data?",
    description: "Vet a processor's ability to protect personal data before appointment.",
    domain: "Vendors & Processors",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4, 5",
    evidenceExamples: ["Due-diligence records"],
    whyItMatters:
      "You remain answerable to the PDPC for data your processors mishandle — vetting is your first defence.",
    recommendedAction:
      "Run documented due diligence on every processor before onboarding.",
  },
  {
    code: "EGP-VEN-02",
    question: "Do you have a written contract with every processor setting out their duties?",
    description: "Execute a written contract with every processor defining their duties.",
    domain: "Vendors & Processors",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 5.1",
    evidenceExamples: ["Signed processor contracts"],
    whyItMatters:
      "A processor working without a written contract is a violation before anything goes wrong.",
    recommendedAction:
      "Inventory processors and execute written contracts covering PDPL duties with each.",
  },
  {
    code: "EGP-VEN-03",
    question: "Do your processors hold their own PDPC licence or permit where they need one?",
    description:
      "Confirm processors hold their own PDPC licence or permit where required.",
    domain: "Vendors & Processors",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 5.11",
    evidenceExamples: ["Processor licence records"],
    whyItMatters:
      "Egypt licenses processors too — an unlicensed processor contaminates the lawfulness of your chain.",
    recommendedAction:
      "Collect and track each processor's PDPC licence or permit status in your vendor records.",
  },
  {
    code: "EGP-VEN-04",
    question: "Do your processors act only on your instructions and within the agreed purpose?",
    description:
      "Ensure processors act only on documented instructions within the agreed purpose.",
    domain: "Vendors & Processors",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 5.1–5.3",
    evidenceExamples: ["Instruction records"],
    whyItMatters:
      "A processor acting beyond instructions becomes an unlawful controller — and drags your processing with it.",
    recommendedAction:
      "Keep processor instructions documented and bound to the agreed purpose in the contract.",
  },
  {
    code: "EGP-VEN-05",
    question: "Do you keep a register of processors, the data they handle, and their status?",
    description:
      "Maintain a register of processors, the data they handle and their status.",
    domain: "Vendors & Processors",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 5.9",
    evidenceExamples: ["Processor register"],
    whyItMatters:
      "Without one register of processors, data and licence status, gaps hide — the unlicensed processor surfaces here first.",
    recommendedAction:
      "Build the processor register with data categories, contract and licence status per vendor.",
  },
  {
    code: "EGP-VEN-06",
    question: "Can you check up on your processors — audit them or ask for proof?",
    description: "Exercise audit or proof rights over processors.",
    domain: "Vendors & Processors",
    severity: "important",
    legalBasis: "PDPL Art 4.12",
    evidenceExamples: ["Audit reports", "Proof requests"],
    whyItMatters:
      "When the PDPC inspects you, your processors' assurances become your evidence — collect it before you need it.",
    recommendedAction:
      "Schedule periodic processor checks — an audit or proof request — and file the results.",
  },

  // ── 11. Retention & Disposal (5) ──────────────────────────────────────────
  {
    code: "EGP-RET-01",
    question: "Do you have a schedule setting how long each type of data is kept, and why?",
    description:
      "Maintain a retention schedule with a period and justification per data type.",
    domain: "Retention & Disposal",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 3.4",
    evidenceExamples: ["Retention schedule"],
    whyItMatters:
      "The PDPL ties retention to the declared purpose — keeping data past it is unlawful holding.",
    recommendedAction:
      "Write a retention schedule assigning a period and reason to every category of personal data.",
  },
  {
    code: "EGP-RET-02",
    question:
      "Do you erase personal data, or return it to the controller, at the end of the processing period?",
    description:
      "Erase personal data, or return it to the controller, when the processing period ends.",
    domain: "Retention & Disposal",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.7, 5.4",
    evidenceExamples: ["Deletion logs", "Return records"],
    whyItMatters:
      "End-of-period erasure (or return, for processors) is a named duty — a schedule nobody executes documents the violation.",
    recommendedAction:
      "Automate or diarise end-of-period erasure and keep logs or return records proving it ran.",
    appliesToRoles: ["controller", "processor"],
  },
  {
    code: "EGP-RET-03",
    question: "Do you collect only the data you genuinely need for the purpose?",
    description: "Collect only the data necessary for the declared purpose.",
    domain: "Retention & Disposal",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 3.3",
    evidenceExamples: ["Collection reviews"],
    whyItMatters:
      "Every unnecessary field is data you must licence, secure, register and eventually erase — risk carried for nothing.",
    recommendedAction:
      "Review every form and feed against its purpose and cut the fields you don't need.",
  },
  {
    code: "EGP-RET-04",
    question: "Do you keep data accurate and fix errors once you become aware of them?",
    description: "Keep personal data accurate and correct errors on becoming aware of them.",
    domain: "Retention & Disposal",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 4.8",
    evidenceExamples: ["Correction logs"],
    whyItMatters:
      "Accuracy is a controller duty that triggers on awareness — sitting on a known error is the violation.",
    recommendedAction:
      "Give staff a fast correction path and log fixes from the moment an error is known.",
  },
  {
    code: "EGP-RET-05",
    question:
      "Do you inform the person, or the controller, of the period the data will be processed?",
    description:
      "Inform the data subject, or the controller, of the processing period.",
    domain: "Retention & Disposal",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 3.3",
    evidenceExamples: ["Notice wording", "Contract clauses"],
    whyItMatters:
      "The processing period is part of what people (and controllers) are entitled to know up front under the PDPL.",
    recommendedAction:
      "State the processing period in notices — and in contracts when acting as processor.",
    appliesToRoles: ["controller", "processor"],
  },

  // ── 12. Privacy Notices (5) ───────────────────────────────────────────────
  {
    code: "EGP-NOT-01",
    question:
      "When you collect data, do you tell people who you are and why you’re collecting it?",
    description:
      "Tell people at collection who you are and why the data is collected.",
    domain: "Privacy Notices",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 3.1",
    evidenceExamples: ["Collection notices"],
    whyItMatters:
      "Identity and purpose at the point of collection are the PDPL's baseline transparency — their absence taints the collection.",
    recommendedAction:
      "Put a notice at every collection point stating who you are and the declared purpose.",
  },
  {
    code: "EGP-NOT-02",
    question:
      "Do you disclose the purpose, the categories of data, and how long you’ll keep it?",
    description:
      "Disclose the purpose, data categories and retention period.",
    domain: "Privacy Notices",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 3.1; ER",
    evidenceExamples: ["Notice content review"],
    whyItMatters:
      "The Regulations spell out the notice contents — a notice missing categories or retention fails the duty.",
    recommendedAction:
      "Check every notice against the required contents: purpose, categories, retention period.",
  },
  {
    code: "EGP-NOT-03",
    question: "Do you tell people if their data will be transferred outside Egypt?",
    description: "Disclose intended transfers of data outside Egypt.",
    domain: "Privacy Notices",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 14; ER",
    evidenceExamples: ["Transfer disclosures in notices"],
    whyItMatters:
      "Cross-border movement is sensitive enough to be licensed — people must be told before their data leaves Egypt.",
    recommendedAction:
      "Add a transfer disclosure to notices wherever data leaves Egypt, naming that it does.",
  },
  {
    code: "EGP-NOT-04",
    question: "Do you inform people of their rights and how to exercise them?",
    description: "Inform people of their PDPL rights and how to exercise them.",
    domain: "Privacy Notices",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 2; ER",
    evidenceExamples: ["Rights section in notices"],
    whyItMatters:
      "Rights people don't know about go unexercised — which is why telling them is itself a duty.",
    recommendedAction:
      "Add a rights section to your notices with the practical route for exercising each right.",
  },
  {
    code: "EGP-NOT-05",
    question:
      "Are your notices written in clear, plain Arabic that a normal person can follow?",
    description: "Write notices in clear, plain Arabic accessible to a normal reader.",
    domain: "Privacy Notices",
    severity: "important",
    legalBasis: "PDPL ER / PDPC guidance",
    evidenceExamples: ["Arabic notices", "Readability review"],
    whyItMatters:
      "An Egyptian notice that only works in English or legalese doesn't inform the people the law protects.",
    recommendedAction:
      "Produce plain-Arabic versions of your notices and run a readability pass on them.",
  },

  // ── 13. Impact Assessments (5 — provisional pending ER/PDPC confirmation) ──
  {
    code: "EGP-DPI-01",
    question:
      "Do you screen new or high-risk processing for its privacy impact before starting?",
    description:
      "Screen new or high-risk processing for privacy impact before it starts.",
    domain: "Impact Assessments",
    severity: "important",
    legalBasis: "PDPL ER (to confirm)",
    evidenceExamples: ["Screening checklist"],
    whyItMatters:
      "Screening is how licence, sensitive-data and transfer triggers get spotted before the PDPC spots them for you.",
    recommendedAction:
      "Add a short privacy screening step at the start of new or high-risk projects.",
    provisional: true,
  },
  {
    code: "EGP-DPI-02",
    question: "For high-risk activities, do you carry out an impact assessment first?",
    description: "Carry out an impact assessment before high-risk activities.",
    domain: "Impact Assessments",
    severity: "important",
    legalBasis: "PDPL ER (to confirm)",
    evidenceExamples: ["Completed assessments"],
    whyItMatters:
      "Where the Regulations confirm the duty, high-risk processing without an assessment starts unlawfully.",
    recommendedAction:
      "Run an impact assessment before high-risk activities begin and keep it on file.",
    provisional: true,
  },
  {
    code: "EGP-DPI-03",
    question: "For cross-border transfers, do you assess the transfer risk?",
    description: "Assess the risk of cross-border transfers.",
    domain: "Impact Assessments",
    severity: "important",
    legalBasis: "PDPL Art 14; ER",
    evidenceExamples: ["Transfer risk assessments"],
    whyItMatters:
      "Transfers are the PDPL's criminal tier — a recorded risk assessment is the diligence that keeps a licensed flow defensible.",
    recommendedAction:
      "Fold transfer-risk assessment into your cross-border process alongside licensing.",
    provisional: true,
  },
  {
    code: "EGP-DPI-04",
    question:
      "For automated decisions or AI, can you show PDPC-approved ways for people to exercise their rights?",
    description:
      "Provide PDPC-approved means for people to exercise their rights over automated decisions or AI processing.",
    domain: "Impact Assessments",
    severity: "important",
    legalBasis: "PDPL ER (AI provisions)",
    evidenceExamples: ["Rights mechanism documentation"],
    whyItMatters:
      "The Regulations reach into AI processing — rights people cannot practically exercise against a model will not satisfy the PDPC.",
    recommendedAction:
      "Inventory automated decisions and document the rights mechanism for each, tracking PDPC guidance.",
    provisional: true,
  },
  {
    code: "EGP-DPI-05",
    question: "Do you revisit these assessments when the risk changes?",
    description: "Review impact assessments when the risk changes.",
    domain: "Impact Assessments",
    severity: "important",
    legalBasis: "PDPL ER (to confirm)",
    evidenceExamples: ["Review log"],
    whyItMatters:
      "An assessment describes the activity as it was — scope or technology changes quietly retire its cover.",
    recommendedAction:
      "Set review triggers on each assessment and log the reviews.",
    provisional: true,
  },

  // ── 14. Training & Awareness (4) ──────────────────────────────────────────
  {
    code: "EGP-TRA-01",
    question: "Does your DPO run training to prepare staff for the PDPL’s requirements?",
    description: "Have the DPO run staff training on the PDPL's requirements.",
    domain: "Training & Awareness",
    severity: "legally_mandatory",
    legalBasis: "PDPL Art 9.8",
    evidenceExamples: ["Training plan", "Session records"],
    whyItMatters:
      "PDPL training is a statutory DPO task, not an HR nicety — its absence is a DPO-duty failure.",
    recommendedAction:
      "Have the DPO own a PDPL training programme and keep the delivery records.",
  },
  {
    code: "EGP-TRA-02",
    question: "Do staff receive privacy training when they join, and regularly after?",
    description: "Deliver privacy training at joining and regularly after.",
    domain: "Training & Awareness",
    severity: "important",
    legalBasis: "PDPL Art 9.8",
    evidenceExamples: ["Onboarding records", "Refresher schedule"],
    whyItMatters:
      "Most incidents start with a person — onboarding plus refreshers is what keeps the six-day and 72-hour clocks known.",
    recommendedAction:
      "Add privacy training to onboarding and set a recurring refresher cycle.",
  },
  {
    code: "EGP-TRA-03",
    question: "Do you keep privacy awareness ongoing, not a one-off session?",
    description: "Maintain ongoing privacy awareness beyond one-off sessions.",
    domain: "Training & Awareness",
    severity: "important",
    legalBasis: "PDPL Art 9.8",
    evidenceExamples: ["Campaign records"],
    whyItMatters:
      "A single session fades in weeks; ongoing reminders are what turn the rules into habits.",
    recommendedAction:
      "Run a light ongoing awareness programme — reminders, briefings, short refreshers.",
  },
  {
    code: "EGP-TRA-04",
    question: "Do you keep a record of who has completed training?",
    description: "Keep completion records of staff training.",
    domain: "Training & Awareness",
    severity: "important",
    legalBasis: "PDPL Art 9.8",
    evidenceExamples: ["Completion records"],
    whyItMatters:
      "After a human-error incident, training records are the first thing the PDPC will ask the DPO to produce.",
    recommendedAction:
      "Track training completion per person and keep the records with the DPO.",
  },
];

/** Cross-check constants, enforced by the seed script and unit tests. */
export const PDPL_EXPECTED_TOTAL = 85;
export const PDPL_EXPECTED_MANDATORY = 64;
export const PDPL_EXPECTED_IMPORTANT = 21;
