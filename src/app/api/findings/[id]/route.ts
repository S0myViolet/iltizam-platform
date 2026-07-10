import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, requireOrgAccess, requirePermission, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";
import { isFindingStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const finding = await prisma.monitoringFinding.findUnique({
      where: { id },
      include: {
        rule: true,
        connector: { select: { displayName: true, provider: true } },
        resource: true,
        syncRun: { select: { id: true, startedAt: true, completedAt: true, stage: true } },
        controlMappings: {
          include: {
            control: {
              include: { domain: true, regulationMappings: { include: { regulation: true } } },
            },
          },
        },
      },
    });
    if (!finding) throw new AuthError(404, "Not found.");
    requireOrgAccess(session, finding.organizationId);

    // Lineage: inventory item + audit trail for this finding.
    const inventoryItem = finding.resource
      ? await prisma.dataInventoryItem.findFirst({
          where: {
            organizationId: finding.organizationId,
            externalResourceId: finding.resource.externalId,
          },
          select: { id: true, name: true, createdAt: true },
        })
      : null;
    const auditTrail = await prisma.auditLog.findMany({
      where: { entityType: "MonitoringFinding", entityId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ finding, inventoryItem, auditTrail });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Human review actions: under_review / confirmed / dismissed / resolved / assign. */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const finding = await prisma.monitoringFinding.findUnique({ where: { id } });
    if (!finding) throw new AuthError(404, "Not found.");
    requirePermission(session, finding.organizationId, "finding.review");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    let action = "finding_updated";

    if ("status" in b) {
      if (!isFindingStatus(b.status)) {
        return NextResponse.json({ error: "Invalid finding status." }, { status: 400 });
      }
      data.status = b.status;
      data.reviewedAt = new Date();
      data.reviewedByUserId = session.userId;
      data.reviewedByName = session.name;
      action =
        b.status === "confirmed"
          ? "finding_confirmed"
          : b.status === "dismissed"
            ? "finding_dismissed"
            : b.status === "resolved"
              ? "finding_resolved"
              : "finding_under_review";
    }
    if ("resolutionNotes" in b) {
      data.resolutionNotes = typeof b.resolutionNotes === "string" ? b.resolutionNotes.trim() || null : null;
    }
    if ("assignedOwnerName" in b) {
      data.assignedOwnerName =
        typeof b.assignedOwnerName === "string" ? b.assignedOwnerName.trim() || null : null;
      if (action === "finding_updated") action = "finding_owner_assigned";
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.monitoringFinding.update({ where: { id }, data });
    await writeAudit({
      organizationId: finding.organizationId,
      actorUserId: session.userId,
      actorName: session.name,
      origin: "human",
      action,
      entityType: "MonitoringFinding",
      entityId: id,
      summary: `Finding "${finding.title.slice(0, 80)}" — ${action.replace(/_/g, " ")} by ${session.name} (rule ${finding.ruleCode} v${finding.ruleVersion}).`,
      before: { status: finding.status },
      after: data,
    });
    return NextResponse.json({ finding: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
