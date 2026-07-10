import { NextRequest, NextResponse } from "next/server";
import { listAssessments } from "@/lib/assessments";
import { createAssessmentWithControls } from "@/lib/seeding";
import { prisma } from "@/lib/db";
import { requirePermission, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.activeOrg) return NextResponse.json({ assessments: [] });
    const assessments = await listAssessments(session.activeOrg.organizationId);
    return NextResponse.json({ assessments });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.activeOrg) throw Object.assign(new Error("No organization."), { status: 403 });
    const organizationId = session.activeOrg.organizationId;
    requirePermission(session, organizationId, "assessment.manage");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const title = typeof b.title === "string" && b.title.trim()
      ? b.title.trim()
      : typeof b.companyName === "string" && b.companyName.trim()
        ? `${(b.companyName as string).trim()} readiness review`
        : "";
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

    const selectedRegimes = Array.isArray(b.selectedRegimes)
      ? b.selectedRegimes.filter((r): r is string => typeof r === "string")
      : [];
    if (selectedRegimes.length === 0) {
      return NextResponse.json({ error: "Select at least one regulation." }, { status: 400 });
    }
    const known = await prisma.regulation.findMany({
      where: { code: { in: selectedRegimes } },
      select: { code: true },
    });
    if (known.length !== selectedRegimes.length) {
      return NextResponse.json({ error: "Unknown regulation code." }, { status: 400 });
    }

    const { assessment, controlCount } = await createAssessmentWithControls(prisma, {
      organizationId,
      title,
      regulationCodes: selectedRegimes,
      startedByUserId: session.userId,
    });
    await writeAudit({
      organizationId,
      actorUserId: session.userId,
      actorName: session.name,
      action: "assessment_created",
      entityType: "Assessment",
      entityId: assessment.id,
      summary: `Assessment "${title}" created with ${controlCount} control instances (${selectedRegimes.join(", ")}).`,
    });
    return NextResponse.json({ assessment: { id: assessment.id, title }, controlCount }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
