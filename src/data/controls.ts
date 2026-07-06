// Iltzam control library — seed data.
//
// Source of truth: "Iltzam Control Library" (5 July 2026) — 64 compliance
// controls written as plain yes/no questions, across 14 domains, with
// severity and regime taken verbatim from the document. Formal control
// statements, GDPR article citations and evidence artifacts are cross-mapped
// from "GDPR → Control Framework" (same date), which defines the 62-control
// extraction this questionnaire is phrased from. Two library questions have
// no 1:1 framework row (consent withdrawal, data accuracy) and cite the GDPR
// article directly.
//
// Per the library document, every control currently maps to both EG-PDPL and
// EU-GDPR because the PDPL is closely based on the GDPR. The PDPL mappings
// are provisional until legally confirmed, which is why each mapping carries
// a `provisional` flag and PDPL article references are left null.

import type { RegimeCode, Severity } from "@/lib/types";

export interface RegulationSeed {
  code: RegimeCode;
  name: string;
  version: string;
  effectiveDate: string | null; // ISO date
  status: "in_force" | "provisional";
  notes: string;
}

export const REGULATIONS: RegulationSeed[] = [
  {
    code: "EU-GDPR",
    name: "General Data Protection Regulation (EU) 2016/679",
    version: "2016/679",
    effectiveDate: "2018-05-25",
    status: "in_force",
    notes:
      "Official text: EUR-Lex CELEX 32016R0679. The proposed Digital Omnibus (Nov 2025) may amend breach deadlines, RoPA scope and DPIA templates — controls are versioned against this layer so those changes can ship as a new regulation version.",
  },
  {
    code: "EG-PDPL",
    name: "Egypt Personal Data Protection Law No. 151 of 2020",
    version: "provisional",
    effectiveDate: null,
    status: "provisional",
    notes:
      "PDPL mappings are provisional: the library was extracted from the GDPR and Egypt's PDPL is closely based on it, so the vast majority of controls apply to both. Each mapping awaits legal confirmation, and a few GDPR-specific items (EU representative, exact transfer mechanisms) will need PDPL equivalents swapped in.",
  },
];

export interface DomainSeed {
  name: string;
  code: string;
  order: number;
  blurb: string; // one-line plain-language description used in the UI
}

export const DOMAINS: DomainSeed[] = [
  { name: "Governance & Accountability", code: "GOV", order: 1, blurb: "Who owns privacy in your company, and how you prove you take it seriously." },
  { name: "Lawful Basis", code: "LAW", order: 2, blurb: "Your written legal reason for every way you use personal data." },
  { name: "Consent Management", code: "CON", order: 3, blurb: "Getting a real yes, keeping proof of it, and honouring a no." },
  { name: "Transparency & Notices", code: "TRN", order: 4, blurb: "Telling people clearly what you do with their data." },
  { name: "Data Subject Rights", code: "DSR", order: 5, blurb: "Handling requests about people's data — access, correction, deletion and more." },
  { name: "Records of Processing", code: "ROP", order: 6, blurb: "Your up-to-date map of everything you do with personal data." },
  { name: "Data Protection Officer", code: "DPO", order: 7, blurb: "Appointing and empowering the person who watches over compliance." },
  { name: "Security of Processing", code: "SEC", order: 8, blurb: "Protecting the data you hold with security that matches the risk." },
  { name: "Breach Management", code: "BRE", order: 9, blurb: "Spotting incidents, telling the right people fast, and keeping records." },
  { name: "DPIA & Risk", code: "DPI", order: 10, blurb: "Checking privacy risk before high-risk projects go live." },
  { name: "Processors & Vendors", code: "VEN", order: 11, blurb: "Making sure the suppliers who touch your data keep it safe." },
  { name: "International Transfers", code: "TRF", order: 12, blurb: "Knowing when data leaves the country and protecting it when it does." },
  { name: "Data Lifecycle, Minimisation & Quality", code: "RET", order: 13, blurb: "Keeping only what you need, only as long as you need it, and keeping it accurate." },
  { name: "Training & Awareness", code: "TRA", order: 14, blurb: "Making sure your people know how to handle data properly." },
];

export interface ControlSeed {
  /** Stable platform code: domain prefix + order (GOV-01 … TRA-02). */
  code: string;
  /** ID of the matching control in the framework document, if a 1:1 row exists. */
  frameworkId: string | null;
  /** Plain yes/no question — exact wording from the Control Library document. */
  question: string;
  /** Formal control statement (framework document wording where mapped). */
  description: string;
  domain: string;
  severity: Severity;
  regimes: RegimeCode[];
  /** GDPR article citation(s), from the framework document. */
  gdprArticles: string;
  evidenceExamples: string[];
  whyItMatters: string;
  recommendedAction: string;
}

export const CONTROLS: ControlSeed[] = [
  // ── 1. Governance & Accountability ────────────────────────────────────────
  {
    code: "GOV-01",
    frameworkId: "GOV-01",
    question:
      "Do you have written data-protection policies that management has signed off on, and do your staff actually know about them?",
    description:
      "Adopt a management-approved data protection policy defining roles, responsibilities and review cycle; review at least annually.",
    domain: "Governance & Accountability",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 5(2), 24",
    evidenceExamples: ["Signed policy", "Review log"],
    whyItMatters:
      "A signed, known policy is the foundation regulators look for first — it shows privacy is managed, not improvised.",
    recommendedAction:
      "Draft a data-protection policy, get management sign-off, share it with all staff, and set an annual review date.",
  },
  {
    code: "GOV-02",
    frameworkId: "GOV-02",
    question:
      "Is it clear who owns data protection in each team — legal, IT, HR, marketing — so nothing slips through the cracks?",
    description:
      "Assign named ownership for every privacy obligation across legal, IT, HR and marketing (RACI).",
    domain: "Governance & Accountability",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 24, 25",
    evidenceExamples: ["RACI matrix"],
    whyItMatters:
      "When nobody owns a duty, it gets missed. Named owners per team are how obligations actually get done.",
    recommendedAction:
      "Build a simple RACI matrix naming an owner for each privacy obligation in every team, and keep it current.",
  },
  {
    code: "GOV-03",
    frameworkId: "GOV-03",
    question:
      "Before you launch a new system, product, or campaign, do you look at its privacy impact first — not after it goes live?",
    description:
      "Embed a privacy-by-design gate in the project and change lifecycle: every new system, product or campaign passes a privacy checkpoint before launch.",
    domain: "Governance & Accountability",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 25",
    evidenceExamples: ["Completed checkpoint records"],
    whyItMatters:
      "Privacy by design is a named legal duty. Fixing privacy after launch is expensive; regulators expect the check to happen before.",
    recommendedAction:
      "Add a privacy checkpoint to your project and change process so nothing launches without a recorded privacy review.",
  },
  {
    code: "GOV-04",
    frameworkId: "GOV-04",
    question:
      "If you run something jointly with another company and you both decide how the data gets used, do you have a written agreement setting out who does what?",
    description:
      "Where two controllers jointly decide purposes and means, execute a joint-controller arrangement allocating duties and a contact point.",
    domain: "Governance & Accountability",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 26",
    evidenceExamples: ["Signed Art. 26 arrangement"],
    whyItMatters:
      "Joint projects without a written split of duties leave both companies exposed when something goes wrong or someone exercises their rights.",
    recommendedAction:
      "Identify joint arrangements, then put a signed agreement in place setting out who handles notices, rights requests and breaches.",
  },
  {
    code: "GOV-05",
    frameworkId: "GOV-05",
    question:
      "If your company is based outside the EU but you serve or track people inside it, have you appointed someone in the EU to represent you?",
    description:
      "Appoint an EU representative where the organisation is outside the EU but offers goods/services to, or monitors, people in the EU.",
    domain: "Governance & Accountability",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 27",
    evidenceExamples: ["Appointment letter", "Published contact"],
    whyItMatters:
      "Serving or tracking people in the EU from abroad without a local representative is a standalone breach, regardless of anything else you do well.",
    recommendedAction:
      "Check whether you target or monitor people in the EU; if so, appoint an EU representative in writing and publish their contact details.",
  },
  {
    code: "GOV-06",
    frameworkId: "GOV-06",
    question:
      "Do you keep a simple calendar of recurring privacy tasks — policy reviews, training, audits — so they don’t get forgotten?",
    description:
      "Maintain a compliance calendar of recurring privacy tasks (policy reviews, audits, training, DPIA refresh) with completion tracking.",
    domain: "Governance & Accountability",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 24",
    evidenceExamples: ["Calendar", "Completion status"],
    whyItMatters:
      "Compliance is recurring work, not a one-off project. A tracked calendar is the difference between a live programme and a stale binder.",
    recommendedAction:
      "Set up a compliance calendar with owners and due dates for every recurring task, and track completion.",
  },

  // ── 2. Lawful Basis ───────────────────────────────────────────────────────
  {
    code: "LAW-01",
    frameworkId: "LAW-01",
    question:
      "For every way you use personal data, have you written down your legal reason for doing it?",
    description:
      "Document a lawful basis for every processing activity before it starts and record it in the RoPA.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 6",
    evidenceExamples: ["Lawful basis register"],
    whyItMatters:
      "Using personal data without a documented legal reason makes the processing itself unlawful — everything downstream inherits that problem.",
    recommendedAction:
      "List every processing activity and record its lawful basis in a register, before new activities start.",
  },
  {
    code: "LAW-02",
    frameworkId: "LAW-08",
    question:
      "Before using data you already hold for a brand-new purpose, do you check the new use fits the reason you collected it in the first place?",
    description:
      "Run a compatibility assessment before reusing personal data for a new purpose.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 6(4)",
    evidenceExamples: ["Purpose-change assessments"],
    whyItMatters:
      "Data collected for one purpose can't quietly be repurposed. An unchecked new use can turn lawful data into an unlawful project.",
    recommendedAction:
      "Add a short compatibility check to any plan that reuses existing data, and keep the completed assessments on file.",
  },
  {
    code: "LAW-03",
    frameworkId: "LAW-07",
    question:
      "When your reason for using data is your own “legitimate interest,” have you weighed that against the person’s rights and written down why it’s fair?",
    description:
      "Complete a Legitimate Interest Assessment (purpose, necessity, balancing) whenever relying on legitimate interests.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 6(1)(f)",
    evidenceExamples: ["LIA on file per activity"],
    whyItMatters:
      "Legitimate interest is only valid if you can show you weighed it against people's rights. Without the written balancing test, the basis fails.",
    recommendedAction:
      "Complete and file a Legitimate Interest Assessment for each activity that relies on legitimate interests.",
  },
  {
    code: "LAW-04",
    frameworkId: "LAW-05",
    question:
      "Before you handle sensitive data — health, religion, biometrics and the like — do you confirm you’re actually allowed to?",
    description:
      "Identify and document an Article 9 condition before processing special-category data (health, biometric, religion, etc.).",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 9",
    evidenceExamples: ["Art. 9 assessments"],
    whyItMatters:
      "Sensitive data is banned by default — you need a specific legal condition before touching it, and fines here are among the highest.",
    recommendedAction:
      "Inventory any sensitive data you process and document the specific legal condition that permits each use.",
  },
  {
    code: "LAW-05",
    frameworkId: "LAW-06",
    question:
      "If you handle data about criminal records or offences, do you have the legal standing to do it?",
    description:
      "Process criminal-offence data only under official authority or where authorised by law.",
    domain: "Lawful Basis",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 10",
    evidenceExamples: ["Legal basis memo"],
    whyItMatters:
      "Criminal-offence data has its own stricter rule: without official authority or explicit legal authorisation, you may not process it at all.",
    recommendedAction:
      "Confirm whether you hold criminal-offence data; if you do, document the legal authority in a memo or stop processing it.",
  },

  // ── 3. Consent Management ─────────────────────────────────────────────────
  {
    code: "CON-01",
    frameworkId: "LAW-02",
    question:
      "When you rely on someone’s consent, did they give it clearly and freely — a real yes, not a pre-ticked box or something buried in the fine print?",
    description:
      "Operate a consent mechanism that is freely given, specific, informed and unambiguous, separate from other terms.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 7",
    evidenceExamples: ["Consent UX screens", "Configuration"],
    whyItMatters:
      "Pre-ticked boxes and buried consent don't count. If consent wasn't a real, informed yes, every use of the data that relies on it is invalid.",
    recommendedAction:
      "Review every consent screen and form: consent must be a clear, separate, unticked opt-in with plain wording.",
  },
  {
    code: "CON-02",
    frameworkId: "LAW-03",
    question: "Can you show, later, exactly who agreed to what and when?",
    description:
      "Keep demonstrable consent records: who consented, when, to what wording/version, via which channel.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 7(1)",
    evidenceExamples: ["Consent log"],
    whyItMatters:
      "The burden of proof is on you. If you can't demonstrate who consented to what and when, the consent effectively doesn't exist.",
    recommendedAction:
      "Log every consent with the person, timestamp, exact wording version and channel, and keep the log queryable.",
  },
  {
    code: "CON-03",
    frameworkId: "LAW-02",
    question:
      "Can people withdraw their consent as easily as they gave it — and does that actually stop you using their data?",
    description:
      "Provide consent withdrawal that is as easy as giving consent, and ensure withdrawal actually halts the processing that relied on it.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 7(3)",
    evidenceExamples: ["Withdrawal mechanism", "Processing stop confirmation"],
    whyItMatters:
      "Consent that is hard to withdraw was never valid consent. Withdrawal also has to take real effect — the processing must stop.",
    recommendedAction:
      "Add a one-step withdrawal path next to every consent, and test that withdrawing actually stops the processing.",
  },
  {
    code: "CON-04",
    frameworkId: "LAW-04",
    question:
      "If your service is aimed at children, do you check their age and get a parent’s permission first?",
    description:
      "Verify age and obtain parental consent before offering information-society services directly to children.",
    domain: "Consent Management",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 8",
    evidenceExamples: ["Age-gate design", "Consent records"],
    whyItMatters:
      "Children get special protection: without age checks and parental permission, consent from a child is not valid consent.",
    recommendedAction:
      "If children can use your service, add an age gate and a parental-consent step, and keep the records.",
  },

  // ── 4. Transparency & Notices ─────────────────────────────────────────────
  {
    code: "TRN-01",
    frameworkId: "TRN-01",
    question:
      "When you collect someone’s data, do you tell them up front who you are, what you’re taking, why, and how long you’ll keep it?",
    description:
      "Serve a privacy notice at the point of collection covering all Art. 13 items: identity, purposes, basis, recipients, transfers, retention, rights.",
    domain: "Transparency & Notices",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 12, 13",
    evidenceExamples: ["Published notices"],
    whyItMatters:
      "People have a right to know what happens to their data at the moment you take it. A missing or incomplete notice is one of the most visible breaches.",
    recommendedAction:
      "Put a complete privacy notice at every collection point, covering identity, purpose, legal basis, recipients, retention and rights.",
  },
  {
    code: "TRN-02",
    frameworkId: "TRN-02",
    question:
      "If you get someone’s data from somewhere other than them directly, do you let them know within a month?",
    description:
      "Where data is obtained indirectly, provide Art. 14 information to data subjects within one month.",
    domain: "Transparency & Notices",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 14",
    evidenceExamples: ["Notification records"],
    whyItMatters:
      "Data bought, scraped or received from partners still comes with a duty to inform the person — the one-month clock starts when you get it.",
    recommendedAction:
      "For every indirect data source, set up a notification within one month of receipt and keep records that it went out.",
  },
  {
    code: "TRN-03",
    frameworkId: "TRN-03",
    question:
      "Are your privacy notices written in plain language a normal person can understand — not dense legal text?",
    description:
      "Write notices in clear, plain language, accessible and free of charge; child-appropriate where relevant.",
    domain: "Transparency & Notices",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 12",
    evidenceExamples: ["Readability review"],
    whyItMatters:
      "A notice nobody can understand doesn't count as informing anyone. Plain language is a legal requirement, not a style choice.",
    recommendedAction:
      "Run a readability pass on your notices and rewrite dense sections in plain language; keep the review on file.",
  },
  {
    code: "TRN-04",
    frameworkId: "TRN-04",
    question:
      "When your data practices change, do you update your privacy notices and tell people?",
    description:
      "Version-control notices; update and re-notify when processing changes materially.",
    domain: "Transparency & Notices",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 12–14",
    evidenceExamples: ["Notice changelog"],
    whyItMatters:
      "An out-of-date notice quietly becomes a false statement about what you do with data. Versioning proves you kept people informed.",
    recommendedAction:
      "Version-control your notices, and add a step to every processing change: update the notice and tell affected people.",
  },

  // ── 5. Data Subject Rights ────────────────────────────────────────────────
  {
    code: "DSR-01",
    frameworkId: "DSR-01",
    question:
      "Is there an easy way for people to ask about their data — a form or an email — and do you log every request that comes in?",
    description:
      "Provide easy intake channels for rights requests (web form, dedicated email) and log every request received.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 12",
    evidenceExamples: ["DSR register"],
    whyItMatters:
      "Rights requests arrive whether you're ready or not. Without an intake channel and a log, requests get lost — and lost requests become complaints.",
    recommendedAction:
      "Publish a simple request channel (form or dedicated email) and log every request in a register with dates.",
  },
  {
    code: "DSR-02",
    frameworkId: "DSR-02",
    question:
      "Before you act on a request, do you check the person is who they say they are?",
    description: "Apply proportionate identity verification before acting on a request.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 12(6)",
    evidenceExamples: ["Verification procedure"],
    whyItMatters:
      "Handing someone's data to the wrong person is itself a data breach. Verification protects the very person making the request.",
    recommendedAction:
      "Write a short identity-verification step into your request procedure, proportionate to the sensitivity of the data.",
  },
  {
    code: "DSR-03",
    frameworkId: "DSR-03",
    question:
      "Can you respond to a data request within one month, and do you keep track of the deadline?",
    description:
      "Respond within one month; track deadlines; documented process for the permitted two-month extension.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 12(3)",
    evidenceExamples: ["SLA tracking", "Extension letters"],
    whyItMatters:
      "The one-month deadline is fixed in law. Missed deadlines are easy for regulators to verify and hard to explain.",
    recommendedAction:
      "Track every request with its legal deadline, and document the process for the permitted extension before you need it.",
  },
  {
    code: "DSR-04",
    frameworkId: "DSR-04",
    question:
      "If someone asks for a copy of the data you hold on them, can you give it to them along with a plain explanation of how it’s used?",
    description:
      "Fulfil access requests with confirmation, a copy of the data and all Art. 15 supplementary information.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 15",
    evidenceExamples: ["Access response template"],
    whyItMatters:
      "Access is the gateway right — it's how people check everything else. Failing it signals you may not know where their data even is.",
    recommendedAction:
      "Build an access-response template and test that you can actually assemble a person's data from all your systems.",
  },
  {
    code: "DSR-05",
    frameworkId: "DSR-05",
    question:
      "Can you correct, delete, or pause the use of someone’s data when they’re entitled to ask — and pass that change on to anyone you shared it with?",
    description:
      "Operate procedures for rectification, erasure and restriction, including propagation of changes to recipients.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 16–19",
    evidenceExamples: ["Procedure docs", "Completion logs"],
    whyItMatters:
      "Correction and deletion rights only work if the change reaches every copy — including the ones you shared with others.",
    recommendedAction:
      "Document procedures for correcting, deleting and restricting data, including notifying everyone you shared it with.",
  },
  {
    code: "DSR-06",
    frameworkId: "DSR-06",
    question:
      "If someone wants their data moved to another provider, can you hand it over in a common, reusable format?",
    description:
      "Provide portability exports in a structured, machine-readable format where the basis is consent or contract.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 20",
    evidenceExamples: ["Export capability"],
    whyItMatters:
      "Portability lets people take their data with them. If you can't export in a reusable format, you can't honour the right at all.",
    recommendedAction:
      "Build or verify an export that produces the person's data in a structured, machine-readable format (e.g. CSV or JSON).",
  },
  {
    code: "DSR-07",
    frameworkId: "DSR-07",
    question:
      "If someone objects to marketing, do you stop straight away and keep them off the list for good?",
    description:
      "Honour objections; stop direct marketing immediately upon objection and maintain a suppression list.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 21",
    evidenceExamples: ["Suppression list"],
    whyItMatters:
      "The marketing objection is absolute — no balancing, no delay. A suppression list is what keeps the person from being re-added later.",
    recommendedAction:
      "Wire every opt-out to stop marketing immediately, and maintain a permanent suppression list across your tools.",
  },
  {
    code: "DSR-08",
    frameworkId: "DSR-08",
    question:
      "Do you know where you make decisions about people purely by computer, with no human involved — and can a person ask for a human to step in?",
    description:
      "Inventory solely-automated decisions with legal or similarly significant effects; safeguard rights including human review.",
    domain: "Data Subject Rights",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 22",
    evidenceExamples: ["ADM inventory", "Review workflow"],
    whyItMatters:
      "Fully automated decisions with real consequences trigger special safeguards. You can't provide human review for decisions you haven't inventoried.",
    recommendedAction:
      "Inventory every solely-automated decision with significant effects, and set up a human-review path people can invoke.",
  },

  // ── 6. Records of Processing ──────────────────────────────────────────────
  {
    code: "ROP-01",
    frameworkId: "ROP-01",
    question:
      "Do you keep an up-to-date record of all the ways your company uses personal data?",
    description:
      "Maintain a controller RoPA with all required fields; update on change and review at least annually.",
    domain: "Records of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 30(1)",
    evidenceExamples: ["RoPA"],
    whyItMatters:
      "The record of processing is the regulator's first request in almost any inquiry — it's the map of everything else you claim to do.",
    recommendedAction:
      "Create a record of processing activities with all required fields, and review it at least annually and on every change.",
  },
  {
    code: "ROP-02",
    frameworkId: "ROP-02",
    question:
      "If you handle data on behalf of clients, do you keep a record of that work too?",
    description:
      "Maintain a processor RoPA for processing carried out on behalf of clients.",
    domain: "Records of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 30(2)",
    evidenceExamples: ["Processor RoPA"],
    whyItMatters:
      "Working on a client's behalf doesn't exempt you from record-keeping — processors have their own, separate record duty.",
    recommendedAction:
      "Keep a separate processor record listing each client, the categories of processing, transfers and security measures.",
  },
  {
    code: "ROP-03",
    frameworkId: "ROP-03",
    question: "If the regulator asks to see these records, can you produce them?",
    description:
      "Make the RoPA available to the supervisory authority on request through a defined procedure.",
    domain: "Records of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 30(4)",
    evidenceExamples: ["Access procedure"],
    whyItMatters:
      "Records you can't produce on request might as well not exist. Regulators expect them promptly, in a usable form.",
    recommendedAction:
      "Define who produces the records, from where, and in what format, and dry-run the procedure once.",
  },

  // ── 7. Data Protection Officer ────────────────────────────────────────────
  {
    code: "DPO-01",
    frameworkId: "DPO-01",
    question:
      "Have you appointed a Data Protection Officer, if the law requires you to have one?",
    description:
      "Document a DPO-requirement assessment; appoint a DPO where required (or voluntarily, applying the same standards).",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 37",
    evidenceExamples: ["Assessment memo", "Appointment"],
    whyItMatters:
      "If the law requires a DPO and you don't have one, that's a direct, easily-checked violation — and the assessment itself must be documented.",
    recommendedAction:
      "Run and document a DPO-requirement assessment; if one is required, appoint them formally.",
  },
  {
    code: "DPO-02",
    frameworkId: "DPO-02",
    question:
      "Have you shared your DPO’s contact details publicly and told the regulator who they are?",
    description:
      "Publish the DPO's contact details and notify them to the supervisory authority.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 37(7)",
    evidenceExamples: ["Published contact", "SA filing"],
    whyItMatters:
      "A DPO nobody can reach doesn't satisfy the law — both the public and the regulator must be able to contact them directly.",
    recommendedAction:
      "Publish the DPO's contact details on your site and file them with the supervisory authority.",
  },
  {
    code: "DPO-03",
    frameworkId: "DPO-03",
    question:
      "Does your DPO have real independence — enough resources, proper access, no conflicting duties, and a direct line to senior management?",
    description:
      "Guarantee DPO independence: adequate resources, access to processing, no conflicting duties, direct reporting to top management.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 38",
    evidenceExamples: ["DPO charter", "Org chart"],
    whyItMatters:
      "A DPO who also owns the systems they police, or can't reach management, fails the independence test — the appointment stops counting.",
    recommendedAction:
      "Give the DPO a written charter: resources, access rights, no conflicting duties, and direct reporting to top management.",
  },
  {
    code: "DPO-04",
    frameworkId: "DPO-04",
    question:
      "Is your DPO actually doing the job — advising the business, checking compliance, and dealing with the regulator?",
    description:
      "DPO performs statutory tasks: advising, monitoring compliance, DPIA advice and cooperation with the supervisory authority.",
    domain: "Data Protection Officer",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 39",
    evidenceExamples: ["DPO activity reports"],
    whyItMatters:
      "The DPO role comes with statutory tasks. A title with no activity reports behind it looks like window dressing to a regulator.",
    recommendedAction:
      "Have the DPO keep periodic activity reports covering advice given, checks performed and regulator contact.",
  },

  // ── 8. Security of Processing ─────────────────────────────────────────────
  {
    code: "SEC-01",
    frameworkId: "SEC-01",
    question:
      "Have you looked at the risks to the data you hold and put security in place that matches those risks?",
    description:
      "Risk-assess each processing activity and implement technical and organisational measures proportionate to the risk.",
    domain: "Security of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 32",
    evidenceExamples: ["Security risk assessment"],
    whyItMatters:
      "The law requires security proportionate to risk — which means you must first know the risk. No assessment, no defensible security.",
    recommendedAction:
      "Run a security risk assessment over your processing activities and match your measures to the risks it finds.",
  },
  {
    code: "SEC-02",
    frameworkId: "SEC-02",
    question:
      "Is personal data protected by encryption — both while it’s stored and while it’s being sent?",
    description:
      "Apply pseudonymisation and encryption of personal data where appropriate, at rest and in transit.",
    domain: "Security of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 32(1)(a)",
    evidenceExamples: ["Encryption standard", "Configs"],
    whyItMatters:
      "Encryption is the named example of appropriate security in the law itself — and often the difference between a contained incident and a notifiable breach.",
    recommendedAction:
      "Adopt an encryption standard covering data at rest and in transit, and verify the configurations that enforce it.",
  },
  {
    code: "SEC-03",
    frameworkId: "SEC-03",
    question:
      "Do only the right people have access to personal data, and do you review that access regularly — especially when someone joins, moves, or leaves?",
    description:
      "Enforce access control: least privilege, joiner-mover-leaver process, periodic access reviews.",
    domain: "Security of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 32(1)(b)",
    evidenceExamples: ["Access review logs"],
    whyItMatters:
      "Stale access is how most internal data leaks happen — the leaver who kept their login, the mover who kept old permissions.",
    recommendedAction:
      "Enforce least-privilege access, add a joiner-mover-leaver checklist, and log periodic access reviews.",
  },
  {
    code: "SEC-04",
    frameworkId: "SEC-04",
    question:
      "Do you back up personal data, and have you actually tested that you can restore it?",
    description:
      "Ensure availability and resilience: backups with tested restoration and recovery objectives.",
    domain: "Security of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 32(1)(c)",
    evidenceExamples: ["Backup and restore test records"],
    whyItMatters:
      "Losing people's data is a breach too. An untested backup is a hope, not a control — the restore test is what makes it real.",
    recommendedAction:
      "Back up personal data on a schedule and run a documented restore test at least annually.",
  },
  {
    code: "SEC-05",
    frameworkId: "SEC-05",
    question:
      "Do you test your security regularly — scans, penetration tests, audits — to check it’s working?",
    description:
      "Regularly test, assess and evaluate the effectiveness of measures (penetration tests, scans, audits).",
    domain: "Security of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 32(1)(d)",
    evidenceExamples: ["Test and audit reports"],
    whyItMatters:
      "The law asks for a process of regularly testing your security, not a one-time setup. Untested controls decay silently.",
    recommendedAction:
      "Schedule recurring security testing — scans, penetration tests or audits — and keep the reports.",
  },
  {
    code: "SEC-06",
    frameworkId: "SEC-06",
    question:
      "Do your staff only handle personal data as instructed, and have they signed confidentiality agreements?",
    description:
      "Ensure staff process personal data only on documented instructions and sign confidentiality commitments.",
    domain: "Security of Processing",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 29, 32(4)",
    evidenceExamples: ["Signed NDAs", "Acknowledgements"],
    whyItMatters:
      "Your people are part of your security. Documented instructions and signed confidentiality are what make staff handling defensible.",
    recommendedAction:
      "Issue documented handling instructions and collect signed confidentiality commitments from everyone touching personal data.",
  },

  // ── 9. Breach Management ──────────────────────────────────────────────────
  {
    code: "BRE-01",
    frameworkId: "BRE-01",
    question:
      "Do you have a clear plan for spotting a data breach, containing it, and escalating it internally when one happens?",
    description:
      "Operate an incident response procedure to detect, contain and internally escalate suspected personal data breaches.",
    domain: "Breach Management",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 33",
    evidenceExamples: ["IR plan", "Escalation flow"],
    whyItMatters:
      "The 72-hour clock starts when anyone in your company becomes aware. Without a plan, the deadline is spent figuring out who to call.",
    recommendedAction:
      "Write an incident-response plan with a clear internal escalation path, and walk the team through it once.",
  },
  {
    code: "BRE-02",
    frameworkId: "BRE-02",
    question:
      "If a breach puts people at risk, can you notify the regulator within 72 hours with the right details?",
    description:
      "Notify the supervisory authority without undue delay and within 72 hours where the breach poses a risk, with the required content.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 33(1)",
    evidenceExamples: ["Notification template", "Timestamps"],
    whyItMatters:
      "72 hours is one of the law's hardest deadlines, and late notification is a separately fineable offence on top of the breach itself.",
    recommendedAction:
      "Prepare a regulator notification template with the required content now, and keep timestamped records for any real incident.",
  },
  {
    code: "BRE-03",
    frameworkId: "BRE-03",
    question:
      "If a breach is serious for the people affected, can you tell them quickly?",
    description:
      "Notify affected data subjects without undue delay where the breach poses a high risk to them.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 34",
    evidenceExamples: ["Comms templates", "Criteria"],
    whyItMatters:
      "When a breach puts people at high risk, they must hear it from you fast enough to protect themselves — not from the news.",
    recommendedAction:
      "Prepare people-facing breach communications and written criteria for when they must be sent.",
  },
  {
    code: "BRE-04",
    frameworkId: "BRE-04",
    question:
      "Do you keep a record of every breach — even the small ones you didn’t have to report?",
    description:
      "Maintain an internal register of all breaches, including those not notified, recording facts, effects and remediation.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 33(5)",
    evidenceExamples: ["Breach register"],
    whyItMatters:
      "The register of all breaches — including unreported ones — is how you prove your notification decisions were right.",
    recommendedAction:
      "Keep a breach register recording every incident's facts, effects and remediation, whether or not it was reported.",
  },
  {
    code: "BRE-05",
    frameworkId: "BRE-05",
    question:
      "If you handle data for a client and you get breached, do you tell them right away?",
    description:
      "As processor, notify the controller without undue delay after becoming aware of a breach.",
    domain: "Breach Management",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 33(2)",
    evidenceExamples: ["Contract clause", "Process"],
    whyItMatters:
      "Your client's 72-hour clock can only start when you tell them. Sitting on a breach puts them in violation and you in breach of contract.",
    recommendedAction:
      "Add immediate client notification to your incident plan and make sure your contracts reflect it.",
  },

  // ── 10. DPIA & Risk ───────────────────────────────────────────────────────
  {
    code: "DPI-01",
    frameworkId: "DPI-01",
    question:
      "When you start something new, do you screen it to spot whether it’s high-risk for people’s privacy?",
    description:
      "Screen every new processing activity to flag likely high risk: new technologies, large-scale special-category data, systematic monitoring.",
    domain: "DPIA & Risk",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 35(1), (3)",
    evidenceExamples: ["Screening checklist"],
    whyItMatters:
      "You can't run the mandatory impact assessments if you never spot which projects need one. Screening is the safety net.",
    recommendedAction:
      "Add a short high-risk screening checklist to the start of every new project or campaign.",
  },
  {
    code: "DPI-02",
    frameworkId: "DPI-02",
    question:
      "For high-risk activities, do you run a proper impact assessment before you begin?",
    description:
      "Conduct DPIAs with the required content: description, necessity and proportionality, risks and mitigations; seek DPO advice.",
    domain: "DPIA & Risk",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 35(7)",
    evidenceExamples: ["Completed DPIAs"],
    whyItMatters:
      "For high-risk processing, the impact assessment is a legal precondition — starting without one is itself the violation.",
    recommendedAction:
      "Run a full impact assessment before any high-risk activity begins, with the DPO's advice recorded in it.",
  },
  {
    code: "DPI-03",
    frameworkId: "DPI-03",
    question:
      "If a high risk is still there even after you’ve done what you can, do you check with the regulator before going ahead?",
    description:
      "Consult the supervisory authority before processing where residual risk remains high after mitigation.",
    domain: "DPIA & Risk",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 36",
    evidenceExamples: ["Consultation records"],
    whyItMatters:
      "When mitigation isn't enough, the law says ask first. Going ahead with unresolved high risk removes your best defence later.",
    recommendedAction:
      "Add a rule: if a DPIA leaves residual high risk, consult the regulator before starting, and keep the records.",
  },
  {
    code: "DPI-04",
    frameworkId: "DPI-04",
    question: "Do you revisit these assessments when the risk changes?",
    description: "Review DPIAs when the risk presented by the processing changes.",
    domain: "DPIA & Risk",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 35(11)",
    evidenceExamples: ["DPIA review log"],
    whyItMatters:
      "An assessment describes the project as it was. When scope, tech or scale changes, yesterday's DPIA stops covering you.",
    recommendedAction:
      "Set review triggers on each DPIA — scope, technology or scale changes — and log each review.",
  },

  // ── 11. Processors & Vendors ──────────────────────────────────────────────
  {
    code: "VEN-01",
    frameworkId: "VEN-01",
    question:
      "Before you hire a supplier to handle data for you, do you check they can actually keep it safe?",
    description:
      "Use only processors providing sufficient guarantees; run documented due diligence before onboarding.",
    domain: "Processors & Vendors",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 28(1)",
    evidenceExamples: ["DD questionnaires"],
    whyItMatters:
      "You stay responsible for data your suppliers mishandle. Documented due diligence is your proof you chose them carefully.",
    recommendedAction:
      "Run a due-diligence questionnaire on every new data supplier before onboarding, and file the answers.",
  },
  {
    code: "VEN-02",
    frameworkId: "VEN-02",
    question:
      "Do you have a signed data-handling contract with every supplier that touches personal data?",
    description:
      "Execute a data processing agreement with every processor containing all mandatory Art. 28(3) clauses.",
    domain: "Processors & Vendors",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 28(3)",
    evidenceExamples: ["Signed DPAs"],
    whyItMatters:
      "A supplier processing personal data without a signed agreement is a violation by itself, before anything even goes wrong.",
    recommendedAction:
      "Inventory every supplier touching personal data and execute a data processing agreement with each one.",
  },
  {
    code: "VEN-03",
    frameworkId: "VEN-03",
    question:
      "If your suppliers bring in their own sub-contractors, do you approve them and hold them to the same rules?",
    description:
      "Control sub-processing: authorisation regime and flow-down of the same obligations to sub-processors.",
    domain: "Processors & Vendors",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 28(2), (4)",
    evidenceExamples: ["Sub-processor list", "Approvals"],
    whyItMatters:
      "Your data protections can't stop one layer down the supply chain — sub-contractors need your approval and the same obligations.",
    recommendedAction:
      "Require approval for sub-contractors in your supplier agreements and keep an approved sub-processor list.",
  },
  {
    code: "VEN-04",
    frameworkId: "VEN-04",
    question:
      "Can you check up on your suppliers — audit them or ask for proof — to make sure they’re keeping their end?",
    description:
      "Exercise audit and information rights over processors periodically or on trigger events.",
    domain: "Processors & Vendors",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 28(3)(h)",
    evidenceExamples: ["Audit reports"],
    whyItMatters:
      "Audit rights that are never used prove nothing. Periodic checks are how supplier promises become supplier facts.",
    recommendedAction:
      "Schedule periodic supplier checks — an audit or a request for certifications — and keep the results.",
  },
  {
    code: "VEN-05",
    frameworkId: "VEN-05",
    question:
      "Do you keep a list of all your data suppliers, what data they handle, and whether the paperwork is in place?",
    description:
      "Maintain a vendor register linking each vendor to data categories, DPA status and transfer mechanism.",
    domain: "Processors & Vendors",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 28",
    evidenceExamples: ["Vendor register"],
    whyItMatters:
      "Without one list of suppliers, data and paperwork, gaps hide — the unsigned DPA nobody noticed is found here first.",
    recommendedAction:
      "Build a vendor register linking each supplier to the data they handle, contract status and transfer mechanism.",
  },

  // ── 12. International Transfers ───────────────────────────────────────────
  {
    code: "TRF-01",
    frameworkId: "TRF-01",
    question:
      "Do you know every time personal data leaves the country — where it goes and who receives it?",
    description:
      "Map every cross-border flow: destination country, recipient, data categories and transfer mechanism.",
    domain: "International Transfers",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 44",
    evidenceExamples: ["Transfer map"],
    whyItMatters:
      "Cloud tools move data abroad quietly. You can't safeguard transfers you don't know about — the map comes first.",
    recommendedAction:
      "Map every cross-border data flow: destination, recipient, data categories and the mechanism covering it.",
  },
  {
    code: "TRF-02",
    frameworkId: "TRF-02",
    question:
      "When data goes abroad, is there a proper legal safeguard in place for that transfer?",
    description:
      "Apply a valid mechanism to each transfer: adequacy decision, executed SCCs or approved BCRs.",
    domain: "International Transfers",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 45, 46",
    evidenceExamples: ["Executed SCCs", "Adequacy check"],
    whyItMatters:
      "A transfer without a valid legal mechanism is unlawful every single time it happens — and it usually happens daily.",
    recommendedAction:
      "Attach a valid mechanism to every transfer on your map — adequacy, signed standard clauses, or approved binding rules.",
  },
  {
    code: "TRF-03",
    frameworkId: "TRF-03",
    question:
      "Have you checked whether the destination country’s laws put the data at risk, and added extra protection if so?",
    description:
      "Perform transfer impact assessments and adopt supplementary measures where the destination's law requires it.",
    domain: "International Transfers",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 46",
    evidenceExamples: ["TIAs on file"],
    whyItMatters:
      "Signed clauses aren't enough if the destination's laws override them — you're expected to check and add protection where needed.",
    recommendedAction:
      "Run a transfer impact assessment per destination and add supplementary measures (e.g. encryption) where local law demands it.",
  },
  {
    code: "TRF-04",
    frameworkId: "TRF-04",
    question:
      "If you’re relying on a special exception to send data abroad, have you documented it and kept it rare?",
    description:
      "Where relying on derogations, document the specific condition and keep such transfers exceptional.",
    domain: "International Transfers",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 49",
    evidenceExamples: ["Derogation log"],
    whyItMatters:
      "Exceptions are for exceptional cases. A routine flow running on a derogation is a transfer running without a real safeguard.",
    recommendedAction:
      "Log every transfer relying on an exception with its specific condition, and move routine flows onto a proper mechanism.",
  },

  // ── 13. Data Lifecycle, Minimisation & Quality ────────────────────────────
  {
    code: "RET-01",
    frameworkId: "RET-01",
    question:
      "Do you have a schedule that says how long you keep each type of data, and why?",
    description:
      "Maintain a retention schedule assigning a period and justification to every category of personal data.",
    domain: "Data Lifecycle, Minimisation & Quality",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 5(1)(e)",
    evidenceExamples: ["Retention schedule"],
    whyItMatters:
      "Keeping data forever 'just in case' is unlawful storage. The schedule is your justification for every month you keep anything.",
    recommendedAction:
      "Write a retention schedule assigning a period and a reason to every category of personal data you hold.",
  },
  {
    code: "RET-02",
    frameworkId: "RET-02",
    question:
      "When data reaches the end of that period, do you actually delete or anonymise it — and check that it happened?",
    description:
      "Enforce deletion or anonymisation at the end of retention and verify execution.",
    domain: "Data Lifecycle, Minimisation & Quality",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 5(1)(e), 17",
    evidenceExamples: ["Deletion logs or certificates"],
    whyItMatters:
      "A retention schedule nobody enforces is worse than none — it documents exactly what you promised to delete and didn't.",
    recommendedAction:
      "Automate or schedule end-of-retention deletion, and keep logs or certificates proving it ran.",
  },
  {
    code: "RET-03",
    frameworkId: "RET-03",
    question:
      "Do you collect only the data you genuinely need, rather than everything you can?",
    description:
      "Apply a data-minimisation check at intake and in system design: collect only what the purpose needs.",
    domain: "Data Lifecycle, Minimisation & Quality",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 5(1)(c)",
    evidenceExamples: ["Design review records"],
    whyItMatters:
      "Every unnecessary field you collect is risk you carry for nothing — more to secure, more to breach, more to justify.",
    recommendedAction:
      "Review every form and integration against its purpose, and cut fields that aren't genuinely needed.",
  },
  {
    code: "RET-04",
    frameworkId: null,
    question:
      "Do you take reasonable steps to keep data accurate and up to date, and fix or remove what’s wrong — even before someone asks?",
    description:
      "Take every reasonable step to keep personal data accurate and up to date, and rectify or erase inaccurate data without delay.",
    domain: "Data Lifecycle, Minimisation & Quality",
    severity: "legally_mandatory",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 5(1)(d)",
    evidenceExamples: ["Data quality procedure", "Correction logs"],
    whyItMatters:
      "Decisions made on wrong data hurt real people — accuracy is a duty you owe proactively, not only when someone complains.",
    recommendedAction:
      "Set up periodic accuracy checks for key records and a fast path to fix or remove data found to be wrong.",
  },

  // ── 14. Training & Awareness ──────────────────────────────────────────────
  {
    code: "TRA-01",
    frameworkId: "TRA-01",
    question:
      "Do your people get privacy training when they join, and regularly after that?",
    description:
      "Deliver privacy training at onboarding and at least annually; role-based modules for high-exposure teams.",
    domain: "Training & Awareness",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 24, 39(1)(b)",
    evidenceExamples: ["Completion records"],
    whyItMatters:
      "Most incidents start with a person, not a system. Training records are also the first thing asked for after a human-error breach.",
    recommendedAction:
      "Deliver privacy training at onboarding and annually, with extra modules for high-exposure teams, and record completions.",
  },
  {
    code: "TRA-02",
    frameworkId: "TRA-02",
    question:
      "Do you keep privacy front-of-mind with ongoing reminders — not just a one-off session?",
    description:
      "Run an ongoing awareness programme reinforcing correct handling of personal data.",
    domain: "Training & Awareness",
    severity: "important",
    regimes: ["EG-PDPL", "EU-GDPR"],
    gdprArticles: "Art. 24",
    evidenceExamples: ["Campaign records"],
    whyItMatters:
      "One session fades in weeks. Ongoing reminders are what turn training into everyday habits.",
    recommendedAction:
      "Run a light ongoing awareness programme — periodic reminders, posters, or short refreshers — and keep the campaign records.",
  },
];

/** Cross-check constants, verified in unit tests against the seed data. */
export const EXPECTED_CONTROL_COUNT = 64;
export const EXPECTED_MANDATORY_COUNT = 54;
export const EXPECTED_IMPORTANT_COUNT = 10;
