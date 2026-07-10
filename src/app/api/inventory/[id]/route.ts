import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuthError, requirePermission, requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-guard";
import { writeAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await requireSession();
    const item = await prisma.dataInventoryItem.findUnique({ where: { id } });
    if (!item) throw new AuthError(404, "Not found.");
    requirePermission(session, item.organizationId, "inventory.manage");
    // Connector-discovered records reflect what automated scans observed;
    // they are read-only here and refresh on every sync. The UI hides these
    // controls, but the rule is enforced server-side, not client-side.
    if (item.sourceType !== "manual") {
      return NextResponse.json(
        { error: "Connector-discovered inventory records are maintained by scans and cannot be edited or archived manually." },
        { status: 409 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const k of [
      "name", "systemName", "businessOwner", "technicalOwner", "lawfulBasis",
      "retentionPeriod", "sharingStatus", "encryptionStatus",
    ]) {
      if (k in b && (typeof b[k] === "string" || b[k] === null)) {
        data[k] = typeof b[k] === "string" ? (b[k] as string).trim() || null : null;
      }
    }
    for (const k of ["containsPersonalData", "containsSensitiveData", "crossBorderTransfer"]) {
      if (k in b && typeof b[k] === "boolean") data[k] = b[k];
    }
    if (b.status === "archived" || b.status === "active") data.status = b.status;
    data.lastReviewedAt = new Date();

    const updated = await prisma.dataInventoryItem.update({ where: { id }, data });
    await writeAudit({
      organizationId: item.organizationId,
      actorUserId: session.userId,
      actorName: session.name,
      action: data.status === "archived" ? "inventory_item_archived" : "inventory_item_updated",
      entityType: "DataInventoryItem",
      entityId: id,
      summary: `Inventory item "${item.name}" ${data.status === "archived" ? "archived" : "updated"}.`,
    });
    return NextResponse.json({ item: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
