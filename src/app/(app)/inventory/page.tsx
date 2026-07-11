// Data inventory — the register of where personal data lives. Rows arrive
// from two sources: manual entries kept by the compliance team, and systems
// discovered by automated connector scans. This page is the server shell:
// it guards the session, resolves the tenant, fetches the active register
// and hands plain rows to the client for search / add / archive.

import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/page-auth";
import { roleHasPermission } from "@/lib/types";
import { InventoryClient, type InventoryRow } from "./InventoryClient";

export const dynamic = "force-dynamic";

/** Defensive parse of a JSON string[] column. */
function parseStringArray(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export default async function InventoryPage() {
  const session = await requirePageSession();
  const org =
    session.activeOrg ??
    (session.isPlatformAdmin
      ? await prisma.organization
          .findFirst({ where: { demoOrganization: true } })
          .then((o) => (o ? { organizationId: o.id, organizationName: o.name } : null))
      : null);

  const items = org
    ? await prisma.dataInventoryItem.findMany({
        where: { organizationId: org.organizationId, status: "active" },
        orderBy: [{ sourceType: "asc" }, { name: "asc" }],
        include: { connector: { select: { displayName: true } } },
      })
    : [];

  const canManage =
    session.isPlatformAdmin ||
    (session.activeOrg
      ? roleHasPermission(session.activeOrg.role, "inventory.manage")
      : false);

  const rows: InventoryRow[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    systemName: i.systemName,
    sourceType: i.sourceType === "connector" ? "connector" : "manual",
    connectorName: i.connector?.displayName ?? null,
    businessOwner: i.businessOwner,
    dataCategories: parseStringArray(i.dataCategories),
    containsPersonalData: i.containsPersonalData,
    containsSensitiveData: i.containsSensitiveData,
    crossBorderTransfer: i.crossBorderTransfer,
    retentionPeriod: i.retentionPeriod,
    sharingStatus: i.sharingStatus,
    encryptionStatus: i.encryptionStatus,
    lastScannedAt: i.lastScannedAt?.toISOString() ?? null,
    lastReviewedAt: i.lastReviewedAt?.toISOString() ?? null,
  }));

  const discovered = rows.filter((r) => r.sourceType === "connector").length;
  const manual = rows.length - discovered;

  return (
    <main className="shell py-8 pb-16">
      {/* Section header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-4">
        <div>
          <h1 className="display text-2xl font-semibold tracking-tight">Data inventory</h1>
          <p className="mt-0.5 text-[13px] text-ink3">
            Where personal data lives — entered manually or discovered by automated scans.
          </p>
        </div>
        <dl className="flex items-start gap-6 text-right">
          <div>
            <dd className="text-2xl font-semibold tabular-nums">{rows.length}</dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Systems
            </dt>
          </div>
          <div>
            <dd className="text-2xl font-semibold text-accent-strong tabular-nums">{discovered}</dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Scan-discovered
            </dt>
          </div>
          <div>
            <dd className="text-2xl font-semibold tabular-nums">{manual}</dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Manual entries
            </dt>
          </div>
        </dl>
      </header>

      <InventoryClient items={rows} canManage={canManage} />
    </main>
  );
}
