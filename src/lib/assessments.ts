// Assessment service layer — the only module that talks to the database on
// behalf of assessment pages and API routes. Pages consume the view models
// returned here; scoring/gap math stays in the pure modules.

import { prisma } from "./db";
import { buildGaps, type Gap, type GapInput } from "./gaps";
import { computeScores, type ScorableControl, type ScoreSummary } from "./scoring";
import type {
  AnswerValue,
  AssessmentStatus,
  EvidenceKind,
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
  uploadedBy: string | null;
  uploadedAt: Date;
}

export interface RegimeRef {
  code: string;
  articleReference: string | null;
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
  companyName: string;
  companySize: string | null;
  industry: string | null;
  country: string | null;
  selectedRegimes: string[];
  status: AssessmentStatus;
  readinessScore: number | null;
  mandatoryScore: number | null;
  importantScore: number | null;
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

type AssessmentRecord = {
  id: string;
  companyName: string;
  companySize: string | null;
  industry: string | null;
  country: string | null;
  selectedRegimes: string;
  status: string;
  readinessScore: number | null;
  mandatoryScore: number | null;
  importantScore: number | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toSummary(a: AssessmentRecord): AssessmentSummary {
  return {
    id: a.id,
    companyName: a.companyName,
    companySize: a.companySize,
    industry: a.industry,
    country: a.country,
    selectedRegimes: parseJsonArray(a.selectedRegimes),
    status: a.status as AssessmentStatus,
    readinessScore: a.readinessScore,
    mandatoryScore: a.mandatoryScore,
    importantScore: a.importantScore,
    completedAt: a.completedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export interface AssessmentListItem extends AssessmentSummary {
  totalControls: number;
  answeredControls: number;
}

export async function listAssessments(): Promise<AssessmentListItem[]> {
  const assessments = await prisma.assessment.findMany({
    orderBy: { createdAt: "desc" },
    include: { answers: { select: { answer: true } } },
  });
  return assessments.map((a) => ({
    ...toSummary(a),
    totalControls: a.answers.length,
    answeredControls: a.answers.filter((ans) => ans.answer !== "not_answered").length,
  }));
}

export async function createAssessment(input: {
  companyName: string;
  companySize?: string | null;
  industry?: string | null;
  country?: string | null;
  selectedRegimes: string[];
}): Promise<AssessmentSummary> {
  // Instantiate one answer per control applicable to the selected regimes —
  // "each client gets their own instance of every applicable control".
  const controls = await prisma.control.findMany({
    where: {
      regulationMappings: { some: { regulation: { code: { in: input.selectedRegimes } } } },
    },
    select: { id: true },
  });
  if (controls.length === 0) {
    throw new Error("No controls are mapped to the selected regimes.");
  }
  const created = await prisma.assessment.create({
    data: {
      companyName: input.companyName,
      companySize: input.companySize ?? null,
      industry: input.industry ?? null,
      country: input.country ?? null,
      selectedRegimes: JSON.stringify(input.selectedRegimes),
      status: "not_started",
      answers: { create: controls.map((c) => ({ controlId: c.id })) },
    },
  });
  return toSummary(created);
}

const answerInclude = {
  control: { include: { regulationMappings: { include: { regulation: true } } } },
  evidence: { orderBy: { uploadedAt: "desc" as const } },
};

type AnswerRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.controlAnswer.findFirst<{ include: typeof answerInclude }>>>
>;

function toAnswerRow(ans: AnswerRecord): AnswerRow {
  const c = ans.control;
  return {
    answerId: ans.id,
    controlId: c.id,
    controlCode: c.controlCode,
    question: c.question,
    description: c.description,
    domain: c.domain,
    domainOrder: c.domainOrder,
    orderInDomain: c.orderInDomain,
    severity: c.severity as Severity,
    isMandatory: c.isMandatory,
    regimes: c.regulationMappings
      .map((m) => ({
        code: m.regulation.code,
        articleReference: m.articleReference,
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
      uploadedBy: e.uploadedBy,
      uploadedAt: e.uploadedAt,
    })),
  };
}

export function toScorable(rows: AnswerRow[]): ScorableControl[] {
  return rows.map((r) => ({
    controlCode: r.controlCode,
    domain: r.domain,
    domainOrder: r.domainOrder,
    severity: r.severity,
    answer: r.answer,
    evidenceCount: r.evidence.length,
    requiresEvidence: r.requiresEvidence,
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
    answer: r.answer,
    whyItMatters: r.whyItMatters,
    recommendedAction: r.recommendedAction,
    evidenceExamples: r.evidenceExamples,
    evidenceCount: r.evidence.length,
    requiresEvidence: r.requiresEvidence,
    ownerName: r.ownerName,
    dueDate: r.dueDate,
    remediationStatus: r.remediationStatus,
    answerId: r.answerId,
  }));
}

export async function getAssessmentBundle(id: string): Promise<AssessmentBundle | null> {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: { answers: { include: answerInclude } },
  });
  if (!assessment) return null;

  const rows = assessment.answers
    .map(toAnswerRow)
    .sort((a, b) => a.domainOrder - b.domainOrder || a.orderInDomain - b.orderInDomain);
  const scores = computeScores(toScorable(rows));
  const gaps = buildGaps(toGapInputs(rows));

  return { assessment: toSummary(assessment), rows, scores, gaps };
}

/**
 * Recompute cached scores and derive progress status after any answer change.
 * A manually-set "needs_review" status is sticky; the automatic transitions
 * only move between not_started / in_progress / completed.
 */
export async function refreshAssessmentAfterAnswerChange(assessmentId: string): Promise<void> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { answers: { include: { control: true, evidence: { select: { id: true } } } } },
  });
  if (!assessment) return;

  const scorable: ScorableControl[] = assessment.answers.map((ans) => ({
    controlCode: ans.control.controlCode,
    domain: ans.control.domain,
    domainOrder: ans.control.domainOrder,
    severity: ans.control.severity as Severity,
    answer: ans.answer as AnswerValue,
    evidenceCount: ans.evidence.length,
    requiresEvidence: ans.control.requiresEvidence,
  }));
  const scores = computeScores(scorable);

  let status = assessment.status as AssessmentStatus;
  if (status !== "needs_review") {
    if (scores.unansweredControls === scorable.length) status = "not_started";
    else if (scores.unansweredControls === 0) status = "completed";
    else status = "in_progress";
  }
  const nowCompleted = status === "completed";

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      readinessScore: scores.readinessScore,
      mandatoryScore: scores.mandatoryScore,
      importantScore: scores.importantScore,
      status,
      completedAt: nowCompleted ? (assessment.completedAt ?? new Date()) : null,
    },
  });
}
