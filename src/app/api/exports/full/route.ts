import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, requirePermission, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";
import { buildDemoWorkbook, workbookToBuffer } from "@/lib/excel";

// Export the full backend demonstration workbook (22 sheets, XLSX).
// Tenant-safe: exports only the caller's organization.
export async function GET() {
  try {
    const session = await requireSession();
    const org = session.activeOrg
      ? await prisma.organization.findUnique({ where: { id: session.activeOrg.organizationId } })
      : session.isPlatformAdmin
        ? await prisma.organization.findFirst({ where: { demoOrganization: true } })
        : null;
    if (!org) throw new AuthError(404, "Not found.");
    if (!session.isPlatformAdmin) {
      requirePermission(session, org.id, "export.run");
    }

    const wb = await buildDemoWorkbook(org.id, session.name);
    const buffer = await workbookToBuffer(wb);

    await prisma.report.create({
      data: {
        organizationId: org.id,
        type: "backend_demo_export",
        status: "completed",
        generatedByUserId: session.userId,
        generatedAt: new Date(),
      },
    });
    await writeAudit({
      organizationId: org.id,
      actorUserId: session.userId,
      actorName: session.name,
      action: "excel_export_generated",
      entityType: "Report",
      summary: `Full backend demonstration workbook exported by ${session.name}.`,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="iltizam-backend-demo-${org.name.replace(/[^a-zA-Z0-9-]+/g, "-")}.xlsx"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
