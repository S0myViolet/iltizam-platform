import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOrgAccess, requirePermission, requireSession, type Session } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";

// Platform admins have no membership; they act on the demo organization —
// the same resolution the inventory page and the scan/export routes use.
async function resolveOrgId(session: Session): Promise<string | null> {
  if (session.activeOrg) return session.activeOrg.organizationId;
  if (!session.isPlatformAdmin) return null;
  const demo = await prisma.organization.findFirst({ where: { demoOrganization: true } });
  return demo?.id ?? null;
}

export async function GET() {
  try {
    const session = await requireSession();
    const orgId = await resolveOrgId(session);
    if (!orgId) return NextResponse.json({ items: [] });
    requireOrgAccess(session, orgId);
    const items = await prisma.dataInventoryItem.findMany({
      where: { organizationId: orgId, status: "active" },
      orderBy: [{ sourceType: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const orgId = await resolveOrgId(session);
    if (!orgId) return NextResponse.json({ error: "No organization." }, { status: 403 });
    requirePermission(session, orgId, "inventory.manage");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const name = typeof b.name === "string" ? b.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

    const str = (k: string) => (typeof b[k] === "string" && (b[k] as string).trim() ? (b[k] as string).trim() : null);
    const list = (k: string) =>
      JSON.stringify(
        Array.isArray(b[k]) ? (b[k] as unknown[]).filter((x): x is string => typeof x === "string") : []
      );
    const bool = (k: string) => b[k] === true;

    const item = await prisma.dataInventoryItem.create({
      data: {
        organizationId: orgId,
        name,
        systemName: str("systemName"),
        sourceType: "manual",
        businessOwner: str("businessOwner"),
        technicalOwner: str("technicalOwner"),
        dataCategories: list("dataCategories"),
        sensitiveDataCategories: list("sensitiveDataCategories"),
        dataSubjects: list("dataSubjects"),
        processingPurposes: list("processingPurposes"),
        lawfulBasis: str("lawfulBasis"),
        storageLocations: list("storageLocations"),
        destinationCountries: list("destinationCountries"),
        retentionPeriod: str("retentionPeriod"),
        processors: list("processors"),
        containsPersonalData: bool("containsPersonalData"),
        containsSensitiveData: bool("containsSensitiveData"),
        crossBorderTransfer: bool("crossBorderTransfer"),
        sharingStatus: str("sharingStatus"),
        encryptionStatus: str("encryptionStatus"),
      },
    });
    await writeAudit({
      organizationId: orgId,
      actorUserId: session.userId,
      actorName: session.name,
      action: "inventory_item_created",
      entityType: "DataInventoryItem",
      entityId: item.id,
      summary: `Inventory item "${name}" created manually.`,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
