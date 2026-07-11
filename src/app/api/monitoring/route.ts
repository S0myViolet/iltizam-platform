import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, demoToolsEnabled, requirePermission, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { setMonitoring } from "@/lib/monitor";
import { VAULT_PROVIDER } from "@/lib/vault";

// Start / stop active monitoring for the demo organization's vault connector.
// Body: { action: "start" | "stop", intervalSeconds?: number }
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!demoToolsEnabled()) throw new AuthError(404, "Not found.");

    const org = session.activeOrg
      ? await prisma.organization.findUnique({ where: { id: session.activeOrg.organizationId } })
      : await prisma.organization.findFirst({ where: { demoOrganization: true } });
    if (!org) throw new AuthError(404, "Not found.");
    if (!org.demoOrganization) {
      throw new AuthError(403, "Active monitoring is only available for the demonstration organization.");
    }
    if (!session.isPlatformAdmin) requirePermission(session, org.id, "connector.manage");

    const connector = await prisma.connector.findFirst({
      where: { organizationId: org.id, provider: VAULT_PROVIDER },
    });
    if (!connector) throw new AuthError(404, "Demo connector not found.");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    if (b.action !== "start" && b.action !== "stop") {
      return NextResponse.json({ error: "action must be \"start\" or \"stop\"." }, { status: 400 });
    }
    const state = await setMonitoring({
      connectorId: connector.id,
      organizationId: org.id,
      enabled: b.action === "start",
      intervalSeconds: typeof b.intervalSeconds === "number" ? b.intervalSeconds : undefined,
      actorUserId: session.userId,
      actorName: session.name,
    });
    return NextResponse.json({ monitoring: state });
  } catch (err) {
    return handleApiError(err);
  }
}
