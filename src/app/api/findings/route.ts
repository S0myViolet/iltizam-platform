import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgAccess, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.activeOrg) return NextResponse.json({ findings: [] });
    requireOrgAccess(session, session.activeOrg.organizationId);
    const findings = await prisma.monitoringFinding.findMany({
      where: { organizationId: session.activeOrg.organizationId },
      include: {
        resource: { select: { name: true, externalId: true, location: true } },
        controlMappings: { include: { control: { select: { controlCode: true, question: true } } } },
      },
      orderBy: [{ status: "asc" }, { severity: "asc" }, { detectedAt: "desc" }],
    });
    return NextResponse.json({ findings });
  } catch (err) {
    return handleApiError(err);
  }
}
