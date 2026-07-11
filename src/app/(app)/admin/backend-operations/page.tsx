// Backend operations — the platform administrator's console for the
// Nile Digital Services demonstration backend. Server shell: guards for
// platform admin + demo tools, resolves the demonstration organization,
// reads the vault connector, resource/record aggregates, findings counts,
// the latest synchronization run and the audit trail, then mounts the
// interactive console (OperationsClient) with everything serialized.
//
// Every number on this page is read from the database or the vault manifest
// — nothing is invented, and no scan result is simulated.

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/page-auth";
import { demoToolsEnabled } from "@/lib/auth";
import {
  AUDIT_ORIGIN_LABELS,
  FINDING_STATUSES,
  FINDING_STATUS_LABELS,
  type AuditOrigin,
} from "@/lib/types";
import { INJECT_SCENARIOS, VAULT_NAME, VAULT_PROVIDER, readManifest, vaultExists } from "@/lib/vault";
import {
  OperationsClient,
  type InjectScenarioOption,
  type SerializedConnector,
  type SerializedSyncRun,
} from "./OperationsClient";

export const dynamic = "force-dynamic";

// ─── Data ────────────────────────────────────────────────────────────────────

async function loadOperationsData(organizationId: string) {
  const [connector, resourceAggregate, findingGroups, ruleCount, latestRun, auditLogs, assessment] =
    await Promise.all([
      prisma.connector.findFirst({
        where: { organizationId, provider: VAULT_PROVIDER },
      }),
      prisma.connectorResource.aggregate({
        where: { organizationId, changeStatus: { not: "removed" } },
        _count: { _all: true },
        _sum: { rowCount: true },
      }),
      prisma.monitoringFinding.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
      }),
      prisma.monitoringRule.count({ where: { enabled: true } }),
      prisma.synchronizationRun.findFirst({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.assessment.findFirst({
        where: { organizationId, archivedAt: null },
        orderBy: { createdAt: "desc" },
        select: { title: true },
      }),
    ]);
  return { connector, resourceAggregate, findingGroups, ruleCount, latestRun, auditLogs, assessment };
}

// ─── Presentation helpers ────────────────────────────────────────────────────

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function BandFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold tracking-[0.1em] text-brand-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] leading-5 font-semibold text-brand-ink">{children}</dd>
    </div>
  );
}

const ORIGIN_TAGS: Record<AuditOrigin, { label: string; chip: string }> = {
  human: { label: AUDIT_ORIGIN_LABELS.human, chip: "tag-outline" },
  automated_rule: {
    label: AUDIT_ORIGIN_LABELS.automated_rule,
    chip: "border border-gold/40 bg-gold/[0.08] text-gold-text",
  },
  system_job: {
    label: AUDIT_ORIGIN_LABELS.system_job,
    chip: "border border-accent/30 bg-accent/[0.07] text-accent-strong",
  },
  optional_ai: { label: AUDIT_ORIGIN_LABELS.optional_ai, chip: "tag-outline" },
};

function OriginTag({ origin }: { origin: string }) {
  const tag = ORIGIN_TAGS[origin as AuditOrigin] ?? ORIGIN_TAGS.system_job;
  return <span className={`tag ${tag.chip}`}>{tag.label}</span>;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function BackendOperationsPage() {
  const session = await requirePageSession();
  if (!session.isPlatformAdmin || !demoToolsEnabled()) notFound();

  const org = await prisma.organization.findFirst({ where: { demoOrganization: true } });
  if (!org) {
    return (
      <main className="shell py-8 pb-16">
        <header className="border-b-2 border-line pb-4">
          <h1 className="display text-2xl font-semibold tracking-tight">Backend operations</h1>
        </header>
        <p className="card mt-6 p-5 text-sm leading-6 text-ink2">
          No demonstration organization exists in this database. Run the seed to provision Nile
          Digital Services S.A.E. and its demo data vault.
        </p>
      </main>
    );
  }

  const data = await loadOperationsData(org.id);

  // Files available in the source itself — read from the vault manifest, not
  // the scan output, so the count is truthful before the first scan runs.
  let fileCount = 0;
  try {
    if (vaultExists()) fileCount = readManifest().entries.length;
  } catch {
    fileCount = 0;
  }

  // Estimated records: the sum of per-file row counts recorded by the latest
  // scan. Before the first scan nothing has been read, so show "—".
  const scannedFileCount = data.resourceAggregate._count._all;
  const recordEstimate = scannedFileCount > 0 ? (data.resourceAggregate._sum.rowCount ?? 0) : null;

  const findingCounts = new Map(data.findingGroups.map((g) => [g.status, g._count._all]));
  const findingsTotal = data.findingGroups.reduce((sum, g) => sum + g._count._all, 0);
  const findingBreakdown = FINDING_STATUSES.map((status) => ({
    status,
    count: findingCounts.get(status) ?? 0,
  })).filter((x) => x.count > 0);

  const latestRun: SerializedSyncRun | null = data.latestRun
    ? {
        id: data.latestRun.id,
        status: data.latestRun.status,
        stage: data.latestRun.stage,
        startedAt: data.latestRun.startedAt?.toISOString() ?? null,
        completedAt: data.latestRun.completedAt?.toISOString() ?? null,
        resourcesDiscovered: data.latestRun.resourcesDiscovered,
        resourcesCreated: data.latestRun.resourcesCreated,
        resourcesUpdated: data.latestRun.resourcesUpdated,
        resourcesRemoved: data.latestRun.resourcesRemoved,
        filesRead: data.latestRun.filesRead,
        rowsInspected: data.latestRun.rowsInspected,
        rulesEvaluated: data.latestRun.rulesEvaluated,
        findingsCreated: data.latestRun.findingsCreated,
        findingsResolved: data.latestRun.findingsResolved,
        evidenceCandidatesCreated: data.latestRun.evidenceCandidatesCreated,
        errorsCount: data.latestRun.errorsCount,
        currentItem: data.latestRun.currentItem,
        changeSummary: data.latestRun.changeSummary,
        triggerType: data.latestRun.triggerType,
        errorSummary: data.latestRun.errorSummary,
        scoreBefore: data.latestRun.scoreBefore,
        scoreAfter: data.latestRun.scoreAfter,
        createdAt: data.latestRun.createdAt.toISOString(),
      }
    : null;

  const connector: SerializedConnector | null = data.connector
    ? {
        id: data.connector.id,
        monitoringEnabled: data.connector.monitoringEnabled,
        monitoringIntervalSeconds: data.connector.monitoringIntervalSeconds,
        nextSyncAt: data.connector.nextSyncAt?.toISOString() ?? null,
        lastSyncAt: data.connector.lastSyncAt?.toISOString() ?? null,
        lastSuccessfulSyncAt: data.connector.lastSuccessfulSyncAt?.toISOString() ?? null,
      }
    : null;

  const injectScenarios: InjectScenarioOption[] = INJECT_SCENARIOS.map((s) => ({
    code: s.code,
    label: s.label,
    description: s.description,
  }));

  const monitoringStatus = !connector
    ? "Not provisioned"
    : connector.monitoringEnabled
      ? `Active — every ${connector.monitoringIntervalSeconds}s`
      : "Paused";

  return (
    <main className="shell py-8 pb-16">
      {/* Section header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-4">
        <div>
          <h1 className="display text-2xl font-semibold tracking-tight">Backend operations</h1>
          <p className="mt-0.5 text-[13px] text-ink3">
            Operations console for the demonstration backend — deterministic rules-based scans,
            human-review controlled findings.
          </p>
        </div>
        <span className="tag tag-outline">Platform administration</span>
      </header>

      {/* ── 1. Company context — the heart of the page ──────────────────────── */}
      <section aria-label="Company context" className="mt-6">
        <div className="band overflow-hidden rounded-xl border border-brand-line px-5 py-6 sm:px-8 sm:py-7">
          <p className="eyebrow text-gold-bright">Monitoring context</p>
          <h2 className="display mt-3 text-2xl font-semibold tracking-tight sm:text-[26px]">
            You are monitoring {org.name}.
          </h2>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-brand-muted">
            Source: <span className="font-semibold text-brand-ink">{VAULT_NAME}</span> — entirely
            synthetic client data. No real personal data appears anywhere in this demonstration.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-brand-line pt-5 sm:grid-cols-3 lg:grid-cols-4">
            <BandFact label="Files available">
              <span className="tabular-nums">{fileCount}</span>
            </BandFact>
            <BandFact label="Estimated records">
              <span className="tabular-nums">
                {recordEstimate === null ? "—" : recordEstimate.toLocaleString("en-GB")}
              </span>
            </BandFact>
            <BandFact label="Data location">Egypt — local demo storage</BandFact>
            <BandFact label="Selected regulations">
              <span className="font-mono text-[12px] tracking-wide">EG-PDPL · EU-GDPR</span>
            </BandFact>
            <BandFact label="Scan mode">Full rescan with change detection</BandFact>
            <BandFact label="Last successful scan">
              <span className="tabular-nums">
                {formatDateTime(data.connector?.lastSuccessfulSyncAt)}
              </span>
            </BandFact>
            <BandFact label="Monitoring">{monitoringStatus}</BandFact>
            <BandFact label="Enabled rules">
              <span className="tabular-nums">{data.ruleCount}</span>
            </BandFact>
          </dl>
        </div>

        {/* Secondary strip: assessment + findings by status, straight from the DB. */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-[12px] text-ink3">
          <span>
            Assessment:{" "}
            <span className="font-medium text-ink2">
              {data.assessment?.title ?? "None on record"}
            </span>
          </span>
          <span>
            Findings: <span className="font-semibold text-ink2 tabular-nums">{findingsTotal}</span>{" "}
            total
            {findingBreakdown.map((x) => (
              <span key={x.status}>
                {" · "}
                {FINDING_STATUS_LABELS[x.status]}{" "}
                <span className="font-semibold text-ink2 tabular-nums">{x.count}</span>
              </span>
            ))}
          </span>
        </div>
      </section>

      {/* ── 2. Interactive console ──────────────────────────────────────────── */}
      <OperationsClient
        latestRun={latestRun}
        connector={connector}
        orgName={org.name}
        sourceName={VAULT_NAME}
        fileCount={fileCount}
        recordEstimate={recordEstimate}
        ruleCount={data.ruleCount}
        injectScenarios={injectScenarios}
      />

      {/* ── 3. Quick links ──────────────────────────────────────────────────── */}
      <section aria-label="Quick links" className="panel mt-10">
        <p className="eyebrow text-gold-text">Quick links</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/monitored-data" className="btn">
            View monitored data
          </Link>
          <Link href="/monitoring" className="btn">
            View findings
          </Link>
          <Link href="/admin/synchronization-runs" className="btn">
            Synchronization runs
          </Link>
          <Link href="/admin/data-explorer" className="btn">
            Data explorer
          </Link>
        </div>
      </section>

      {/* ── 4. Audit trail ──────────────────────────────────────────────────── */}
      <section aria-label="Audit trail" className="panel mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="eyebrow text-gold-text">Audit trail</p>
            <h2 className="display mt-2 text-xl font-semibold tracking-tight">Recent events</h2>
          </div>
          <span className="text-xs text-ink3">
            Latest {data.auditLogs.length} events · every action records its origin
          </span>
        </div>

        {data.auditLogs.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-ink3">
            No audit events on record for the demonstration organization yet. Run a scan to see the
            pipeline write its trail.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
            {data.auditLogs.map((log) => (
              <li
                key={log.id}
                className="grid gap-x-4 gap-y-1 py-2.5 sm:grid-cols-[150px_140px_minmax(0,1fr)] sm:items-baseline"
              >
                <span className="font-mono text-[11px] text-ink3 tabular-nums">
                  {formatDateTime(log.createdAt)}
                </span>
                <span>
                  <OriginTag origin={log.origin} />
                </span>
                <span className="min-w-0 text-[13px] leading-5 text-ink2">
                  <span className="mr-2 font-mono text-[11px] font-semibold tracking-wide text-ink">
                    {log.action}
                  </span>
                  {log.summary}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
