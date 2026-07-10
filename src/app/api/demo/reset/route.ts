import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, demoToolsEnabled, requirePlatformAdmin, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { resetDemonstration } from "@/lib/reset";

// Reset Demonstration — platform admin + demo tools + demo org only.
export async function POST() {
  try {
    const session = await requireSession();
    if (!demoToolsEnabled()) throw new AuthError(404, "Not found.");
    requirePlatformAdmin(session);
    const org = await prisma.organization.findFirst({ where: { demoOrganization: true } });
    if (!org) throw new AuthError(404, "No demonstration organization.");
    await resetDemonstration({
      organizationId: org.id,
      actorUserId: session.userId,
      actorName: session.name,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
