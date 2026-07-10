import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, demoToolsEnabled, requirePermission, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { executeDemoScan, startDemoScan } from "@/lib/scan";

// Run Demonstration Scan — demo-org + demo-tools + connector.manage gated.
export async function POST() {
  try {
    const session = await requireSession();
    if (!demoToolsEnabled()) throw new AuthError(404, "Not found.");
    if (!session.activeOrg && !session.isPlatformAdmin) throw new AuthError(403, "No organization.");

    // Platform admins may run the scan for the demo org even without membership.
    const org = session.activeOrg
      ? await prisma.organization.findUnique({ where: { id: session.activeOrg.organizationId } })
      : await prisma.organization.findFirst({ where: { demoOrganization: true } });
    if (!org) throw new AuthError(404, "Not found.");
    if (!org.demoOrganization) {
      throw new AuthError(403, "The demonstration scan is only available for the demonstration organization.");
    }
    if (!session.isPlatformAdmin) {
      requirePermission(session, org.id, "connector.manage");
    }

    const connector = await prisma.connector.findFirst({
      where: { organizationId: org.id, provider: "demo_connector" },
    });
    if (!connector) throw new AuthError(404, "Demo connector not found.");

    const { runId } = await startDemoScan({
      organizationId: org.id,
      connectorId: connector.id,
      triggeredByUserId: session.userId,
      triggeredByName: session.name,
    });
    // Execute after the response is sent; the UI polls the run for progress.
    after(() => executeDemoScan(runId));
    return NextResponse.json({ runId }, { status: 202 });
  } catch (err) {
    return handleApiError(err);
  }
}
