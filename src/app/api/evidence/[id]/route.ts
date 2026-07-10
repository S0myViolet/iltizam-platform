import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteEvidenceFile } from "@/lib/storage";
import { requirePermission, requireSession, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";
import { refreshAssessmentAfterAnswerChange } from "@/lib/assessments";
import { isEvidenceReviewStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

async function loadEvidence(id: string) {
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: {
      answer: {
        include: {
          assessment: { select: { id: true, organizationId: true } },
          control: { select: { controlCode: true } },
        },
      },
    },
  });
  if (!evidence) throw new AuthError(404, "Not found.");
  return evidence;
}

/** Review evidence: accept / reject / needs_update / expired. Human-only. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const evidence = await loadEvidence(id);
    const orgId = evidence.answer.assessment.organizationId;
    requirePermission(session, orgId, "evidence.review");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    if (!isEvidenceReviewStatus(b.reviewStatus)) {
      return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
    }
    const reviewNotes = typeof b.reviewNotes === "string" ? b.reviewNotes.trim() || null : null;

    const updated = await prisma.evidence.update({
      where: { id },
      data: {
        reviewStatus: b.reviewStatus,
        reviewNotes,
        reviewedAt: new Date(),
        reviewedByUserId: session.userId,
      },
    });
    // Accepted evidence deterministically feeds evidence readiness.
    await refreshAssessmentAfterAnswerChange(evidence.answer.assessment.id);
    await writeAudit({
      organizationId: orgId,
      actorUserId: session.userId,
      actorName: session.name,
      action: b.reviewStatus === "accepted" ? "evidence_accepted" : b.reviewStatus === "rejected" ? "evidence_rejected" : "evidence_review_updated",
      entityType: "Evidence",
      entityId: id,
      summary: `Evidence "${evidence.fileName}" on ${evidence.answer.control.controlCode} marked ${b.reviewStatus} by human reviewer.`,
      before: { reviewStatus: evidence.reviewStatus },
      after: { reviewStatus: b.reviewStatus, reviewNotes },
    });
    return NextResponse.json({ evidence: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const evidence = await loadEvidence(id);
    const orgId = evidence.answer.assessment.organizationId;
    requirePermission(session, orgId, "evidence.add");
    // Accepted evidence feeds evidence readiness — removing it changes the
    // reviewed position, so it additionally requires review authority.
    if (evidence.reviewStatus === "accepted") {
      requirePermission(session, orgId, "evidence.review");
    }

    if (evidence.kind === "file" && evidence.storageKey) {
      await deleteEvidenceFile(evidence.storageKey);
    }
    await prisma.evidence.delete({ where: { id } });
    await refreshAssessmentAfterAnswerChange(evidence.answer.assessment.id);
    await writeAudit({
      organizationId: orgId,
      actorUserId: session.userId,
      actorName: session.name,
      action: "evidence_removed",
      entityType: "Evidence",
      entityId: id,
      summary: `Evidence "${evidence.fileName}" removed from ${evidence.answer.control.controlCode}.`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
