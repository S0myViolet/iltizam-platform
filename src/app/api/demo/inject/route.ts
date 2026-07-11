import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, demoToolsEnabled, requirePlatformAdmin, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";
import { applyScenario, INJECT_SCENARIOS, type InjectScenario } from "@/lib/vault";

// Inject Demo Change — platform admin only. Mutates the ACTUAL synthetic
// files/manifest; it never creates findings itself. The next scan detects
// the change, which is the point of the demonstration.
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!demoToolsEnabled()) throw new AuthError(404, "Not found.");
    requirePlatformAdmin(session);
    const org = await prisma.organization.findFirst({ where: { demoOrganization: true } });
    if (!org) throw new AuthError(404, "No demonstration organization.");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const scenario = (body as Record<string, unknown>)?.scenario;
    if (!INJECT_SCENARIOS.some((s) => s.code === scenario)) {
      return NextResponse.json({ error: "Unknown scenario." }, { status: 400 });
    }

    const summary = await applyScenario(scenario as InjectScenario);
    await writeAudit({
      organizationId: org.id,
      actorUserId: session.userId,
      actorName: session.name,
      origin: "human",
      action: "demo_change_injected",
      entityType: "Connector",
      summary: `Demo change injected (${scenario}): ${summary} The next scan will detect it.`,
    });
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    if (!demoToolsEnabled()) throw new AuthError(404, "Not found.");
    requirePlatformAdmin(session);
    return NextResponse.json({ scenarios: INJECT_SCENARIOS });
  } catch (err) {
    return handleApiError(err);
  }
}
