// Egypt PDPL control library — seed data.
//
// Source of truth: "Egypt_PDPL_Law_and_Controls.docx" — Egypt Personal Data
// Protection Law No. 151 of 2020 with Executive Regulations No. 816 of 2025.
// 85 controls across 14 domains: 64 legally mandatory, 21 important.
// Regulator: Personal Data Protection Center (PDPC). Compliance deadline:
// 1 November 2026.
//
// ⚠ CONTROLS PENDING DOCUMENT EXTRACTION ⚠
// The PDPL_CONTROLS array below must be populated VERBATIM from the source
// document — question wording, severity, domain and PDPL basis preserved
// exactly. Controls must not be invented, paraphrased into GDPR wording, or
// stripped of Egypt-specific detail (PDPC licences/permits, DPO registration,
// 6-working-day DSR deadline, 72-hour PDPC breach notice, 3-working-day
// affected-person notice, cross-border transfer permits, sensitive-data
// licensing, guardian consent, electronic-marketing consent, Arabic notices,
// PDPC inspection rights). The seed refuses to load a partial library:
// either 0 controls (PDPL not yet available) or exactly the expected counts.

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

/**
 * ⚠ To be populated verbatim from Egypt_PDPL_Law_and_Controls.docx.
 * While empty, seeding skips the PDPL library and the new-assessment flow
 * marks EG-PDPL as "library pending".
 */
export const PDPL_CONTROLS: PdplControlSeed[] = [];

/** Cross-check constants, enforced by the seed script and unit tests. */
export const PDPL_EXPECTED_TOTAL = 85;
export const PDPL_EXPECTED_MANDATORY = 64;
export const PDPL_EXPECTED_IMPORTANT = 21;
