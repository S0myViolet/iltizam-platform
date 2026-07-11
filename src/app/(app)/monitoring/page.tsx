// Monitoring — the register of automated findings. Rules-based checks run
// against connector-discovered resources and surface potential findings
// here; nothing on this page affects the official compliance position until
// a human reviewer confirms it. This server shell guards the session,
// resolves the tenant, fetches the finding register and hands plain rows to
// the client board for filtering and review.

import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/page-auth";
import {
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  MONITORING_DISCLAIMER,
  isFindingStatus,
  roleHasPermission,
  type FindingSeverity,
  type FindingStatus,
} from "@/lib/types";
import { FindingsBoard, type FindingRow } from "./FindingsBoard";

export const dynamic = "force-dynamic";

const STATUS_STATS: { status: FindingStatus; label: string; tone: string }[] = [
  { status: "new", label: "New", tone: "text-gold-text" },
  { status: "under_review", label: "Under review", tone: "text-accent-strong" },
  { status: "confirmed", label: "Confirmed", tone: "text-crit-text" },
  { status: "dismissed", label: "Dismissed", tone: "text-ink3" },
  { status: "resolved", label: "Resolved", tone: "text-good-text" },
];

export default async function MonitoringPage() {
  const session = await requirePageSession();
  const org =
    session.activeOrg ??
    (session.isPlatformAdmin
      ? await prisma.organization
          .findFirst({ where: { demoOrganization: true } })
          .then((o) => (o ? { organizationId: o.id, organizationName: o.name } : null))
      : null);

  const findings = org
    ? await prisma.monitoringFinding.findMany({
        where: { organizationId: org.organizationId },
        include: {
          resource: { select: { name: true, externalId: true, location: true } },
          connector: { select: { displayName: true } },
          controlMappings: {
            include: { control: { select: { controlCode: true, question: true } } },
          },
        },
        orderBy: [{ detectedAt: "desc" }],
      })
    : [];

  const canReview =
    session.isPlatformAdmin ||
    (session.activeOrg ? roleHasPermission(session.activeOrg.role, "finding.review") : false);

  const rows: FindingRow[] = findings.map((f) => ({
    id: f.id,
    title: f.title,
    severity: (FINDING_SEVERITIES as readonly string[]).includes(f.severity)
      ? (f.severity as FindingSeverity)
      : "info",
    status: isFindingStatus(f.status) ? f.status : "new",
    ruleCode: f.ruleCode,
    ruleVersion: f.ruleVersion,
    isEvidenceCandidate: f.isEvidenceCandidate,
    connectorName: f.connector?.displayName ?? null,
    resourceName: f.resource?.name ?? null,
    detectedAt: f.detectedAt.toISOString(),
    controlCodes: f.controlMappings.map((m) => m.control.controlCode),
  }));

  const counts = Object.fromEntries(
    FINDING_STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length])
  ) as Record<FindingStatus, number>;

  return (
    <main className="shell py-8 pb-16">
      {/* Section header */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 border-line pb-4">
        <div className="max-w-2xl">
          <h1 className="display text-2xl font-semibold tracking-tight">Monitoring</h1>
          <p className="mt-0.5 text-[13px] leading-5 text-ink3">{MONITORING_DISCLAIMER}</p>
        </div>
        <dl className="flex items-start gap-6 text-right">
          {STATUS_STATS.map((s) => (
            <div key={s.status}>
              <dd className={`text-2xl font-semibold tabular-nums ${s.tone}`}>
                {counts[s.status]}
              </dd>
              <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </header>

      <FindingsBoard rows={rows} canReview={canReview} />
    </main>
  );
}
