import { NextRequest, NextResponse } from "next/server";
import { refreshAssessmentAfterAnswerChange } from "@/lib/assessments";
import { prisma } from "@/lib/db";
import { requirePermission, requireSession, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";
import { isAnswerValue, isRemediationStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const existing = await prisma.controlAnswer.findUnique({
      where: { id },
      include: { assessment: { select: { organizationId: true } }, control: { select: { controlCode: true } } },
    });
    if (!existing) throw new AuthError(404, "Not found.");
    const orgId = existing.assessment.organizationId;
    const membership = requirePermission(session, orgId, "assessment.answer");

    // control_owner may only update controls assigned to them.
    if (membership.role === "control_owner" && existing.ownerMembershipId !== membership.membershipId) {
      throw new AuthError(403, "Control owners can update only their assigned controls.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    const auditActions: string[] = [];

    if ("answer" in b) {
      if (!isAnswerValue(b.answer)) {
        return NextResponse.json({ error: "Invalid answer value." }, { status: 400 });
      }
      data.answer = b.answer;
      data.lastReviewedAt = new Date();
      auditActions.push(existing.answer === "not_answered" ? "control_answered" : "control_answer_changed");
    }
    if ("remediationStatus" in b) {
      if (!isRemediationStatus(b.remediationStatus)) {
        return NextResponse.json({ error: "Invalid remediation status." }, { status: 400 });
      }
      data.remediationStatus = b.remediationStatus;
      auditActions.push("remediation_status_changed");
    }
    for (const key of ["ownerName", "ownerEmail", "notes"] as const) {
      if (key in b) {
        if (typeof b[key] !== "string" && b[key] !== null) {
          return NextResponse.json({ error: `Invalid value for ${key}.` }, { status: 400 });
        }
        const value = typeof b[key] === "string" ? (b[key] as string).trim() : null;
        data[key] = value || null;
        if (key === "ownerName") auditActions.push("owner_assigned");
        if (key === "notes") auditActions.push("notes_updated");
      }
    }
    if ("dueDate" in b) {
      if (b.dueDate === null || b.dueDate === "") data.dueDate = null;
      else if (typeof b.dueDate === "string" && !Number.isNaN(Date.parse(b.dueDate)))
        data.dueDate = new Date(b.dueDate);
      else return NextResponse.json({ error: "Invalid due date." }, { status: 400 });
      auditActions.push("due_date_changed");
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.controlAnswer.update({ where: { id }, data });
    await refreshAssessmentAfterAnswerChange(existing.assessmentId);
    await writeAudit({
      organizationId: orgId,
      actorUserId: session.userId,
      actorName: session.name,
      action: auditActions[0] ?? "control_updated",
      entityType: "ControlAnswer",
      entityId: id,
      summary: `${existing.control.controlCode}: ${auditActions.join(", ") || "updated"}.`,
      before: { answer: existing.answer, ownerName: existing.ownerName, dueDate: existing.dueDate },
      after: data,
    });

    const assessment = await prisma.assessment.findUnique({
      where: { id: existing.assessmentId },
      select: { status: true, readinessScore: true, mandatoryScore: true, importantScore: true },
    });
    return NextResponse.json({ answer: updated, assessment });
  } catch (err) {
    return handleApiError(err);
  }
}
