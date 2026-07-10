// Backend operations — the platform administrator's demonstration console.
// Server shell: guards for platform admin + demo tools, checks database
// health, resolves the demonstration organization and fetches the live
// counts the stat cards render. The interactive pipeline (run scan / poll /
// export / reset) lives in OperationsClient.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/page-auth";
import { demoToolsEnabled } from "@/lib/auth";
import { AssessmentStatusBadge } from "@/components/badges";
import { formatDate } from "@/lib/format";
import { AUDIT_ORIGIN_LABELS, isAssessmentStatus, type AuditOrigin } from "@/lib/types";
import { OperationsClient, type SerializedSyncRun } from "./OperationsClient";

export const dynamic = "force-dynamic";

// ─── Data ────────────────────────────────────────────────────────────────────

async function loadOperationsData(organizationId: string) {
  const [
    assessment,
    connector,
    resourceCount,
    inventoryCount,
    findingsTotal,
    findingsNew,
    findingsConfirmed,
    findingsDismissed,
    evidenceCandidates,
    ruleCount,
    auditLogs,
    latestRun,
  ] = await Promise.all([
    prisma.assessment.findFirst({
      where: { organizationId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: { title: true, status: true },
    }),
    prisma.connector.findFirst({
      where: { organizationId, provider: "demo_connector" },
      select: { displayName: true, status: true, lastSyncAt: true },
    }),
    prisma.connectorResource.count({ where: { organizationId } }),
    prisma.dataInventoryItem.count({ where: { organizationId, status: "active" } }),
    prisma.monitoringFinding.count({ where: { organizationId } }),
    prisma.monitoringFinding.count({ where: { organizationId, status: "new" } }),
    prisma.monitoringFinding.count({ where: { organizationId, status: "confirmed" } }),
    prisma.monitoringFinding.count({ where: { organizationId, status: "dismissed" } }),
    // "Awaiting human review" — candidates still in the new state only.
    prisma.monitoringFinding.count({
      where: { organizationId, isEvidenceCandidate: true, status: "new" },
    }),
    prisma.monitoringRule.count({ where: { enabled: true } }),
    prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.synchronizationRun.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    assessment,
    connector,
    resourceCount,
    inventoryCount,
    findingsTotal,
    findingsNew,
    findingsConfirmed,
    findingsDismissed,
    evidenceCandidates,
    ruleCount,
    auditLogs,
    latestRun,
  };
}

// ─── Presentation helpers ────────────────────────────────────────────────────

function Stat({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-4">
      <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">{label}</dt>
      <dd className="mt-1.5">{children}</dd>
      {hint ? <dd className="mt-1 text-[11px] leading-4 text-ink3">{hint}</dd> : null}
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${className}`} />;
}

const CONNECTOR_STATUS_STYLES: Record<string, { chip: string; dot: string }> = {
  connected: { chip: "border border-good/25 bg-good/[0.07] text-good-text", dot: "bg-good" },
  syncing: { chip: "border border-accent/30 bg-accent/[0.07] text-accent-strong", dot: "bg-accent" },
  error: { chip: "border border-crit/25 bg-crit/[0.06] text-crit-text", dot: "bg-crit" },
};

function ConnectorStatusTag({ status }: { status: string }) {
  const style = CONNECTOR_STATUS_STYLES[status] ?? { chip: "tag-outline", dot: "bg-ink3" };
  const label = status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
  return (
    <span className={`tag ${style.chip}`}>
      <Dot className={style.dot} />
      {label}
    </span>
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

function formatDateTime(value: Date): string {
  return value.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DemoOperationsPage() {
  const session = await requirePageSession();
  if (!session.isPlatformAdmin || !demoToolsEnabled()) notFound();

  // Database health — checked first so a broken connection renders as a
  // crit tag instead of a crash.
  let databaseHealthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseHealthy = true;
  } catch {
    databaseHealthy = false;
  }

  const org = databaseHealthy
    ? await prisma.organization.findFirst({ where: { demoOrganization: true } })
    : null;
  const data = org ? await loadOperationsData(org.id) : null;

  const latestRun: SerializedSyncRun | null = data?.latestRun
    ? {
        id: data.latestRun.id,
        status: data.latestRun.status,
        stage: data.latestRun.stage,
        startedAt: data.latestRun.startedAt?.toISOString() ?? null,
        completedAt: data.latestRun.completedAt?.toISOString() ?? null,
        resourcesDiscovered: data.latestRun.resourcesDiscovered,
        resourcesCreated: data.latestRun.resourcesCreated,
        resourcesUpdated: data.latestRun.resourcesUpdated,
        findingsCreated: data.latestRun.findingsCreated,
        evidenceCandidatesCreated: data.latestRun.evidenceCandidatesCreated,
        errorsCount: data.latestRun.errorsCount,
        errorSummary: data.latestRun.errorSummary,
        triggerType: data.latestRun.triggerType,
        scoreBefore: data.latestRun.scoreBefore,
        scoreAfter: data.latestRun.scoreAfter,
        createdAt: data.latestRun.createdAt.toISOString(),
      }
    : null;

  const auditLogs = data?.auditLogs ?? [];

  return (
    <main className="shell py-8 pb-16">
      {/* Section header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-4">
        <div>
          <h1 className="display text-2xl font-semibold tracking-tight">Backend operations</h1>
          <p className="mt-0.5 text-[13px] text-ink3">
            Demonstration tools — database-backed, deterministic, human-review controlled.
          </p>
        </div>
        <span className="tag tag-outline">Platform administration</span>
      </header>

      {/* ── Platform status ─────────────────────────────────────────────────── */}
      <section aria-label="Platform status" className="mt-6">
        <p className="eyebrow text-gold-text">Platform status</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Database" hint="prisma · SELECT 1">
            {databaseHealthy ? (
              <span className="tag border border-good/25 bg-good/[0.07] text-good-text">
                <Dot className="bg-good" />
                Reachable
              </span>
            ) : (
              <span className="tag border border-crit/25 bg-crit/[0.06] text-crit-text">
                <Dot className="bg-crit" />
                Unreachable
              </span>
            )}
          </Stat>

          <Stat label="Organization" hint="Demonstration tenant">
            <span className="block truncate text-sm leading-5 font-semibold">
              {org?.name ?? "Not found"}
            </span>
          </Stat>

          <Stat label="Regulations" hint="Regime coverage">
            <span className="font-mono text-[12px] font-semibold tracking-wide">
              EG-PDPL · EU-GDPR
            </span>
          </Stat>

          <Stat label="Assessment">
            {data?.assessment ? (
              <span className="flex flex-col gap-1.5">
                <span className="truncate text-sm leading-5 font-semibold">
                  {data.assessment.title}
                </span>
                {isAssessmentStatus(data.assessment.status) ? (
                  <span>
                    <AssessmentStatusBadge status={data.assessment.status} />
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="text-sm text-ink3">None on record</span>
            )}
          </Stat>

          <Stat
            label="Connector"
            hint={data?.connector ? `Last sync ${formatDate(data.connector.lastSyncAt)}` : undefined}
          >
            {data?.connector ? (
              <span className="flex flex-col gap-1.5">
                <span className="truncate text-sm leading-5 font-semibold">
                  {data.connector.displayName}
                </span>
                <span>
                  <ConnectorStatusTag status={data.connector.status} />
                </span>
              </span>
            ) : (
              <span className="text-sm text-ink3">Not provisioned</span>
            )}
          </Stat>

          <Stat label="Rules loaded" hint="Rules-based checks · deterministic">
            <span className="text-2xl font-semibold tabular-nums">{data?.ruleCount ?? 0}</span>
          </Stat>

          <Stat label="Source resources" hint="Discovered by automated scan">
            <span className="text-2xl font-semibold tabular-nums">{data?.resourceCount ?? 0}</span>
          </Stat>

          <Stat label="Inventory records" hint="Active register entries">
            <span className="text-2xl font-semibold tabular-nums">{data?.inventoryCount ?? 0}</span>
          </Stat>

          <Stat
            label="Findings"
            hint={`${data?.findingsNew ?? 0} new · ${data?.findingsConfirmed ?? 0} confirmed · ${data?.findingsDismissed ?? 0} dismissed`}
          >
            <span className="text-2xl font-semibold tabular-nums">{data?.findingsTotal ?? 0}</span>
          </Stat>

          <Stat label="Evidence candidates" hint="Awaiting human review">
            <span className="text-2xl font-semibold tabular-nums">
              {data?.evidenceCandidates ?? 0}
            </span>
          </Stat>
        </dl>
      </section>

      {/* ── Demonstration pipeline (client) ─────────────────────────────────── */}
      <OperationsClient latestRun={latestRun} canRun={Boolean(org && data?.connector)} />

      {/* ── Audit trail ─────────────────────────────────────────────────────── */}
      <section aria-label="Audit trail" className="panel mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="eyebrow text-gold-text">Audit trail</p>
            <h2 className="display mt-2 text-xl font-semibold tracking-tight">Recent events</h2>
          </div>
          <span className="text-xs text-ink3">
            Latest {auditLogs.length} events · every action records its origin
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-ink3">
            No audit events on record for the demonstration organization yet. Run a demonstration
            scan to see the pipeline write its trail.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
            {auditLogs.map((log) => (
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
