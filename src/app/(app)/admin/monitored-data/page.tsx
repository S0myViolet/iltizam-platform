// Monitored data — the platform administrator's register of the actual
// source files the automated scan reads from the Nile Digital Services demo
// data vault. Server shell: guards platform admin + demo tools, loads every
// discovered connector resource with its per-resource findings count and the
// latest scan run, parses each resource's manifest metadata and hands plain
// rows to the client register. All vault contents are synthetic.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/page-auth";
import { demoToolsEnabled } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { MonitoredDataClient, type MonitoredResourceRow } from "./MonitoredDataClient";

export const dynamic = "force-dynamic";

// ─── Data ────────────────────────────────────────────────────────────────────

async function loadRegister(organizationId: string) {
  const [resources, findingGroups, latestRun] = await Promise.all([
    prisma.connectorResource.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    }),
    prisma.monitoringFinding.groupBy({
      by: ["connectorResourceId"],
      where: { organizationId, connectorResourceId: { not: null } },
      _count: { _all: true },
    }),
    prisma.synchronizationRun.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, startedAt: true, completedAt: true, createdAt: true },
    }),
  ]);

  const findingsByResource = new Map<string, number>();
  for (const group of findingGroups) {
    if (group.connectorResourceId) {
      findingsByResource.set(group.connectorResourceId, group._count._all);
    }
  }
  return { resources, findingsByResource, latestRun };
}

// ─── Metadata parsing (manifest fields stored as JSON on each resource) ──────

function parseMetadata(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "—";
  return value.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function MonitoredDataPage() {
  const session = await requirePageSession();
  if (!session.isPlatformAdmin || !demoToolsEnabled()) notFound();

  const org = await prisma.organization.findFirst({ where: { demoOrganization: true } });
  const data = org ? await loadRegister(org.id) : null;

  const rows: MonitoredResourceRow[] = (data?.resources ?? []).map((r) => {
    const meta = parseMetadata(r.metadata);
    const evidenceType = asString(meta.evidenceType);
    return {
      id: r.id,
      externalId: r.externalId,
      name: r.name,
      sourceSystem: asString(meta.sourceSystem),
      fileType: r.fileType,
      rowCount: r.rowCount,
      containsPersonalData: meta.containsPersonalData === true,
      containsSensitiveData: meta.containsSensitiveData === true,
      dataCategories: asStringArray(meta.dataCategories),
      owner: r.owner ?? asString(meta.owner),
      storageCountry: asString(meta.storageCountry),
      destinationCountries: asStringArray(meta.destinationCountries),
      sharingStatus: r.sharingStatus ?? asString(meta.sharingStatus),
      accessLevel: asString(meta.accessLevel),
      encryptionStatus: asString(meta.encryptionStatus),
      retentionPeriod: asString(meta.retentionPeriod),
      retentionDate: asString(meta.retentionDate),
      changeStatus: r.changeStatus,
      modifiedExternallyAt: r.modifiedExternallyAt?.toISOString() ?? null,
      lastSeenAt: r.lastSeenAt?.toISOString() ?? null,
      findingsCount: data?.findingsByResource.get(r.id) ?? 0,
      isEvidenceCandidate: evidenceType !== null,
      evidenceType,
      location: r.location,
      checksum: r.checksum,
    };
  });

  const totalRecords = rows.reduce((sum, r) => sum + r.rowCount, 0);
  const flaggedFiles = rows.filter((r) => r.findingsCount > 0).length;
  const latestRun = data?.latestRun ?? null;

  return (
    <main className="shell py-8 pb-16">
      {/* Section header */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 border-line pb-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-gold-text">Platform administration</p>
          <h1 className="display mt-1.5 text-2xl font-semibold tracking-tight">Monitored data</h1>
          <p className="mt-0.5 text-[13px] leading-5 text-ink3">
            The actual source files the scan reads for Nile Digital Services S.A.E. — combined
            file contents and manifest context.
          </p>
          <p className="mt-2 text-xs text-ink3">
            {latestRun ? (
              <>
                Latest scan run{" "}
                <span className="font-mono text-[11px] tracking-wide text-ink2">
                  {latestRun.id}
                </span>{" "}
                · {formatDateTime(latestRun.completedAt ?? latestRun.startedAt ?? latestRun.createdAt)}
              </>
            ) : (
              "No scan has run yet."
            )}
          </p>
        </div>
        <dl className="flex items-start gap-6 text-right">
          <div>
            <dd className="text-2xl font-semibold tabular-nums">{rows.length}</dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Files
            </dt>
          </div>
          <div>
            <dd className="text-2xl font-semibold tabular-nums">
              {totalRecords.toLocaleString("en-GB")}
            </dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Total records
            </dt>
          </div>
          <div>
            <dd
              className={`text-2xl font-semibold tabular-nums ${flaggedFiles > 0 ? "text-warn-text" : ""}`}
            >
              {flaggedFiles}
            </dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Flagged files
            </dt>
          </div>
        </dl>
      </header>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No resources on record"
            body="Run a scan from Backend operations to discover the demo data vault."
          />
        </div>
      ) : (
        <MonitoredDataClient rows={rows} />
      )}

      <p className="mt-10 max-w-3xl border-t-2 border-line pt-4 text-xs leading-5 text-ink3">
        Every file in this register is synthetic demonstration data generated for Nile Digital
        Services S.A.E. — no real personal data exists in the vault. Row previews are masked by
        default; revealing values is limited to platform administrators, and every reveal is
        recorded in the audit trail. Scans are deterministic rules-based automation; findings
        raised from these files require human review before they can affect the official
        compliance position.
      </p>
    </main>
  );
}
