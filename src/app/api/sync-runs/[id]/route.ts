import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, requireOrgAccess, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const run = await prisma.synchronizationRun.findUnique({
      where: { id },
      include: { connector: { select: { displayName: true, provider: true } } },
    });
    if (!run) throw new AuthError(404, "Not found.");
    requireOrgAccess(session, run.organizationId);
    return NextResponse.json({ run });
  } catch (err) {
    return handleApiError(err);
  }
}
