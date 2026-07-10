import { NextRequest, NextResponse } from "next/server";
import { getAssessmentBundle } from "@/lib/assessments";
import { prisma } from "@/lib/db";
import { requireAssessmentAccess, requirePermission, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    await requireAssessmentAccess(session, id);
    const bundle = await getAssessmentBundle(id);
    return NextResponse.json(bundle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const { assessment } = await requireAssessmentAccess(session, id);
    requirePermission(session, assessment.organizationId, "assessment.manage");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if (typeof b.title === "string" && b.title.trim()) data.title = b.title.trim();
    if (typeof b.status === "string" &&
        ["not_started", "in_progress", "needs_review", "completed", "archived"].includes(b.status)) {
      data.status = b.status;
      if (b.status === "completed") data.completedAt = new Date();
      if (b.status === "archived") data.archivedAt = new Date();
    }
    if (typeof b.nextReviewAt === "string" && !Number.isNaN(Date.parse(b.nextReviewAt))) {
      data.nextReviewAt = new Date(b.nextReviewAt);
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }
    await prisma.assessment.update({ where: { id }, data });
    await writeAudit({
      organizationId: assessment.organizationId,
      actorUserId: session.userId,
      actorName: session.name,
      action: data.status === "completed" ? "assessment_completed" : "assessment_updated",
      entityType: "Assessment",
      entityId: id,
      summary: `Assessment updated (${Object.keys(data).join(", ")}).`,
      after: data,
    });
    const bundle = await getAssessmentBundle(id);
    return NextResponse.json(bundle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const { assessment } = await requireAssessmentAccess(session, id);
    requirePermission(session, assessment.organizationId, "assessment.manage");
    await prisma.assessment.update({ where: { id }, data: { archivedAt: new Date(), status: "archived" } });
    await writeAudit({
      organizationId: assessment.organizationId,
      actorUserId: session.userId,
      actorName: session.name,
      action: "assessment_archived",
      entityType: "Assessment",
      entityId: id,
      summary: "Assessment archived.",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
