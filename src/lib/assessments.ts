// Assessment service layer — the only module that queries the database on
// behalf of assessment pages and API routes. Callers are responsible for
// tenancy (verify the session may access the assessment's organization
// BEFORE calling into here — see src/lib/auth.ts).

import { prisma } from "./db";
import { buildGaps, type Gap, type GapInput } from "./gaps";
import { computeScores, type ScorableControl, type ScoreSummary } from "./scoring";
import type {
  AnswerValue,
  AssessmentStatus,
  EvidenceKind,
  EvidenceReviewStatus,
  EvidenceType,
  RemediationStatus,
  Severity,
} from "./types";

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  fileName: string;
  fileUrl: string;
  evidenceType: EvidenceType;
  reviewStatus: EvidenceReviewStatus;
  reviewNotes: string | null;
  expiresAt: Date | null;
  uploadedBy: string | null;
  uploadedAt: Date;
  reviewedAt: Date | null;
}

export interface RegimeRef {
  code: string;
  legalBasis: string | null;
  provisional: boolean;
}

/** One control instance inside an assessment: control + this company's answer. */
export interface AnswerRow {
  answerId: string;
  controlId: string;
  controlCode: string;
  question: string;
  description: string;
  domain: string;
  domainOrder: number;
  orderInDomain: number;
  severity: Severity;
  isMandatory: boolean;
  provisional: boolean;
  regimes: RegimeRef[];
  evidenceExamples: string[];
  whyItMatters: string;
  recommendedAction: string;
  sourceReference: string;
  requiresEvidence: boolean;
  answer: AnswerValue;
  ownerName: string | null;
  ownerEmail: string | null;
  notes: string | null;
  dueDate: Date | null;
  remediationStatus: RemediationStatus;
  lastReviewedAt: Date | null;
  updatedAt: Date;
  evidence: EvidenceItem[];
}

export interface AssessmentSummary {
  id: string;
  organizationId: string;
  title: string;
  companyName: string;
  companySize: string | null;
  industry: string | null;
  country: string | null;
  selectedRegimes: string[];
  status: AssessmentStatus;
  readinessScore: number | null;
  mandatoryScore: number | null;
  importantScore: number | null;
  nextReviewAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentBundle {
  assessment: AssessmentSummary;
  rows: AnswerRow[];
  scores: ScoreSummary;
  gaps: Gap[];
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

const assessmentInclude = {
  organization: true,
  regulations: { include: { regulation: true } },
  answers: {
    include: {
      control: {
        include: {
          domain: true,
          regulationMappings: { include: { regulation: true } },
        },
      },
      evidence: { orderBy: { uploadedAt: "desc" as const } },
    },
  },
};

type AssessmentRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.assessment.findFirst<{ include: typeof assessmentInclude }>>>
>;

function toSummary(a: AssessmentRecord): AssessmentSummary {
  return {
    id: a.id,
    organizationId: a.organizationId,
    title: a.title,
    companyName: a.organization.name,
    companySize: a.organization.companySize,
    industry: a.organization.industry,
    country: a.organization.country,
    selectedRegimes: a.regulations.map((r) => r.regulation.code).sort(),
    status: a.status as AssessmentStatus,
    readinessScore: a.readinessScore,
    mandatoryScore: a.mandatoryScore,
    importantScore: a.importantScore,
    nextReviewAt: a.nextReviewAt,
    completedAt: a.completedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

type AnswerRecord = AssessmentRecord["answers"][number];

function toAnswerRow(ans: AnswerRecord, selectedRegulationIds: Set<string>): AnswerRow {
  const c = ans.control;
  const mappings = c.regulationMappings.filter((m) => selectedRegulationIds.has(m.regulationId));
  const codeNum = Number(c.controlCode.split("-").pop());
  return {
    answerId: ans.id,
    controlId: c.id,
    controlCode: c.controlCode,
    question: c.question,
    description: c.description,
    domain: c.domain.name,
    domainOrder: c.domain.displayOrder,
    orderInDomain: Number.isNaN(codeNum) ? 0 : codeNum,
    severity: c.severity as Severity,
    isMandatory: c.isMandatory,
    provisional: c.provisional,
    regimes: mappings
      .map((m) => ({
        code: m.regulation.code,
        legalBasis: m.legalBasis,
        provisional: m.provisional,
      }))
      .sort((a, b) => a.code.localeCompare(b.code)),
    evidenceExamples: parseJsonArray(c.evidenceExamples),
    whyItMatters: c.whyItMatters,
    recommendedAction: c.recommendedAction,
    sourceReference: c.sourceReference,
    requiresEvidence: c.requiresEvidence,
    answer: ans.answer as AnswerValue,
    ownerName: ans.ownerName,
    ownerEmail: ans.ownerEmail,
    notes: ans.notes,
    dueDate: ans.dueDate,
    remediationStatus: ans.remediationStatus as RemediationStatus,
    lastReviewedAt: ans.lastReviewedAt,
    updatedAt: ans.updatedAt,
    evidence: ans.evidence.map((e) => ({
      id: e.id,
      kind: e.kind as EvidenceKind,
      fileName: e.fileName,
      fileUrl: e.fileUrl,
      evidenceType: e.evidenceType as EvidenceType,
      reviewStatus: e.reviewStatus as EvidenceReviewStatus,
      reviewNotes: e.reviewNotes,
      expiresAt: e.expiresAt,
      uploadedBy: e.uploadedBy,
      uploadedAt: e.uploadedAt,
      reviewedAt: e.reviewedAt,
    })),
  };
}

export function acceptedCount(row: AnswerRow): number {
  return row.evidence.filter((e) => e.reviewStatus === "accepted").length;
}

export function toScorable(rows: AnswerRow[]): ScorableControl[] {
  return rows.map((r) => ({
    controlCode: r.controlCode,
    domain: r.domain,
    domainOrder: r.domainOrder,
    severity: r.severity,
    answer: r.answer,
    evidenceCount: r.evidence.length,
    acceptedEvidenceCount: acceptedCount(r),
    requiresEvidence: r.requiresEvidence,
    regulationCodes: r.regimes.map((m) => m.code),
    provisional: r.provisional,
    ownerName: r.ownerName,
    dueDate: r.dueDate,
    remediationStatus: r.remediationStatus,
  }));
}

export function toGapInputs(rows: AnswerRow[]): GapInput[] {
  return rows.map((r) => ({
    controlCode: r.controlCode,
    question: r.question,
    domain: r.domain,
    domainOrder: r.domainOrder,
    orderInDomain: r.orderInDomain,
    severity: r.severity,
    regimes: r.regimes.map((m) => m.code),
    legalBases: Object.fromEntries(r.regimes.map((m) => [m.code, m.legalBasis])),
    answer: r.answer,
    whyItMatters: r.whyItMatters,
    recommendedAction: r.recommendedAction,
    evidenceExamples: r.evidenceExamples,
    evidenceCount: r.evidence.length,
    acceptedEvidenceCount: acceptedCount(r),
    rejectedEvidenceCount: r.evidence.filter((e) => e.reviewStatus === "rejected").length,
    expiredEvidenceCount: r.evidence.filter((e) => e.reviewStatus === "expired").length,
    requiresEvidence: r.requiresEvidence,
    provisional: r.provisional,
    ownerName: r.ownerName,
    dueDate: r.dueDate,
    remediationStatus: r.remediationStatus,
    answerId: r.answerId,
  }));
}

export interface AssessmentListItem extends AssessmentSummary {
  totalControls: number;
  answeredControls: number;
}

export async function listAssessments(organizationId: string): Promise<AssessmentListItem[]> {
  const assessments = await prisma.assessment.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: assessmentInclude,
  });
  return assessments.map((a) => ({
    ...toSummary(a),
    totalControls: a.answers.length,
    answeredControls: a.answers.filter((ans) => ans.answer !== "not_answered").length,
  }));
}

export async function getAssessmentBundle(id: string): Promise<AssessmentBundle | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: assessmentInclude,
  });
  if (!assessment) return null;

  const selectedRegulationIds = new Set(assessment.regulations.map((r) => r.regulationId));
  const rows = assessment.answers
    .map((a) => toAnswerRow(a, selectedRegulationIds))
    .sort(
      (a, b) =>
        a.domainOrder - b.domainOrder ||
        a.domain.localeCompare(b.domain) ||
        a.orderInDomain - b.orderInDomain ||
        a.controlCode.localeCompare(b.controlCode)
    );
  const scores = computeScores(toScorable(rows));
  const gaps = buildGaps(toGapInputs(rows));

  return { assessment: toSummary(assessment), rows, scores, gaps };
}

/**
 * Recompute cached scores and derive progress status after any answer or
 * evidence-review change. Deterministic: uses the central scoring engine.
 */
export async function refreshAssessmentAfterAnswerChange(assessmentId: string): Promise<void> {
  const bundle = await getAssessmentBundle(assessmentId);
  if (!bundle) return;
  const { scores, assessment } = bundle;

  let status: string = assessment.status;
  if (status !== "needs_review" && status !== "archived") {
    if (scores.unansweredControls === scores.totalControls) status = "not_started";
    else if (scores.unansweredControls === 0) status = "completed";
    else status = "in_progress";
  }

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      readinessScore: scores.readinessScore,
      mandatoryScore: scores.mandatoryScore,
      importantScore: scores.importantScore,
      status,
      completedAt: status === "completed" ? (assessment.completedAt ?? new Date()) : null,
    },
  });
}

/** Compact official-position snapshot used for scan before/after records. */
export interface PositionSnapshot {
  readinessScore: number | null;
  mandatoryScore: number | null;
  evidenceReadiness: number | null;
  mandatoryGaps: number;
  importantGaps: number;
  evidenceGaps: number;
  unanswered: number;
  confirmedFindings: number;
  unreviewedFindings: number;
}

export async function snapshotOfficialPosition(organizationId: string): Promise<PositionSnapshot> {
  const assessment = await prisma.assessment.findFirst({
    where: { organizationId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const [confirmed, unreviewed] = await Promise.all([
    prisma.monitoringFinding.count({ where: { organizationId, status: "confirmed" } }),
    prisma.monitoringFinding.count({ where: { organizationId, status: "new" } }),
  ]);
  if (!assessment) {
    return {
      readinessScore: null,
      mandatoryScore: null,
      evidenceReadiness: null,
      mandatoryGaps: 0,
      importantGaps: 0,
      evidenceGaps: 0,
      unanswered: 0,
      confirmedFindings: confirmed,
      unreviewedFindings: unreviewed,
    };
  }
  const bundle = await getAssessmentBundle(assessment.id);
  const s = bundle!.scores;
  return {
    readinessScore: s.readinessScore,
    mandatoryScore: s.mandatoryScore,
    evidenceReadiness: s.evidenceReadiness,
    mandatoryGaps: s.mandatoryGaps,
    importantGaps: s.importantGaps,
    evidenceGaps: s.controlsMissingEvidence,
    unanswered: s.unansweredControls,
    confirmedFindings: confirmed,
    unreviewedFindings: unreviewed,
  };
}
