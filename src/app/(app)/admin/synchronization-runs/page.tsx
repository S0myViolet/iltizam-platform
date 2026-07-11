// Synchronization runs — the platform administrator's chronological register
// of every scan the deterministic rules-based engine has executed against the
// demonstration organization. Each row is read verbatim from the
// SynchronizationRun record: trigger, status, timing, per-run counters, the
// change-detection results and any errors. Nothing here is simulated.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/page-auth";
import { demoToolsEnabled } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

// ─── Presentation maps ───────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  manual: "Manual",
  scheduled: "Scheduled",
  demonstration: "Demonstration",
};

const STATUS_PRESENTATION: Record<string, { label: string; chip: string; rail: string }> = {
  completed: {
    label: "Completed",
    chip: "border border-good/25 bg-good/[0.07] text-good-text",
    rail: "border-l-good",
  },
  completed_with_errors: {
    label: "Completed with errors",
    chip: "border border-warn/30 bg-warn/[0.07] text-warn-text",
    rail: "border-l-warn",
  },
  failed: {
    label: "Failed",
    chip: "border border-crit/25 bg-crit/[0.06] text-crit-text",
    rail: "border-l-crit",
  },
  running: {
    label: "Running",
    chip: "border border-gold/40 bg-gold/[0.08] text-gold-text",
    rail: "border-l-gold",
  },
  queued: {
    label: "Queued",
    chip: "border border-gold/40 bg-gold/[0.08] text-gold-text",
    rail: "border-l-gold",
  },
};

const FALLBACK_STATUS = { label: "Unknown", chip: "tag-outline", rail: "border-l-line2" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(value: Date | null | undefined): string {
  if (!value) return "—";
  return value.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(startedAt: Date | null, completedAt: Date | null): string {
  if (!startedAt || !completedAt) return "—";
  const ms = completedAt.getTime() - startedAt.getTime();
  if (ms < 0) return "—";
  if (ms < 1000) return "<1s";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

interface ChangeSummary {
  new: string[];
  changed: string[];
  removed: string[];
}

function parseChangeSummary(raw: string | null): ChangeSummary | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof ChangeSummary, unknown>>;
    const names = (v: unknown) =>
      Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
    return { new: names(parsed.new), changed: names(parsed.changed), removed: names(parsed.removed) };
  } catch {
    return null;
  }
}

// ─── Row fragments ───────────────────────────────────────────────────────────

function Counter({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div>
      <dd
        className={`text-[15px] font-semibold tabular-nums ${
          alert && value > 0 ? "text-crit-text" : "text-ink"
        }`}
      >
        {value.toLocaleString("en-GB")}
      </dd>
      <dt className="mt-0.5 text-[10px] font-semibold tracking-[0.06em] text-ink3 uppercase">
        {label}
      </dt>
    </div>
  );
}

function ChangeGroup({ title, names }: { title: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div>
      <h5 className="text-[10px] font-semibold tracking-[0.06em] text-ink3 uppercase">
        {title} · {names.length}
      </h5>
      <ul className="mt-1 flex flex-col gap-0.5">
        {names.map((name) => (
          <li key={name} className="font-mono text-[11.5px] leading-5 tracking-wide text-ink2">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function SynchronizationRunsPage() {
  const session = await requirePageSession();
  if (!session.isPlatformAdmin || !demoToolsEnabled()) notFound();

  const org = await prisma.organization.findFirst({ where: { demoOrganization: true } });
  const runs = org
    ? await prisma.synchronizationRun.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
        include: { connector: { select: { displayName: true } } },
      })
    : [];

  const lastCompleted = runs.find(
    (r) => (r.status === "completed" || r.status === "completed_with_errors") && r.completedAt
  );
  const totalFindingsCreated = runs.reduce((sum, r) => sum + r.findingsCreated, 0);

  return (
    <main className="shell py-8 pb-16">
      {/* Section header */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 border-line pb-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-gold-text">Platform administration</p>
          <h1 className="display mt-1.5 text-2xl font-semibold tracking-tight">
            Synchronization runs
          </h1>
          <p className="mt-0.5 text-[13px] leading-5 text-ink3">
            Every scan executed against{" "}
            {org ? org.name : "the demonstration organization"} — deterministic rules-based
            automation; each run records exactly what it read, evaluated and changed.
          </p>
        </div>
        <dl className="flex items-start gap-6 text-right">
          <div>
            <dd className="text-2xl font-semibold tabular-nums">{runs.length}</dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Total runs
            </dt>
          </div>
          <div>
            <dd className="text-2xl font-semibold tabular-nums">{totalFindingsCreated}</dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Findings created
            </dt>
          </div>
          <div>
            <dd className="text-sm leading-8 font-semibold whitespace-nowrap">
              {lastCompleted ? formatDateTime(lastCompleted.completedAt) : "—"}
            </dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Last completed
            </dt>
          </div>
        </dl>
      </header>

      {runs.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No scans yet — run one from Backend operations." />
        </div>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {runs.map((run) => {
            const status = STATUS_PRESENTATION[run.status] ?? FALLBACK_STATUS;
            const changes = parseChangeSummary(run.changeSummary);
            const hasChanges =
              changes !== null &&
              changes.new.length + changes.changed.length + changes.removed.length > 0;
            return (
              <li key={run.id} className={`record ${status.rail} px-4 py-4 sm:px-5`}>
                {/* Identity strip */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    title={run.id}
                    className="font-mono text-[11.5px] font-semibold tracking-wide text-ink2"
                  >
                    {run.id.length > 14 ? `${run.id.slice(0, 14)}…` : run.id}
                  </span>
                  <span className="tag tag-outline">
                    {TRIGGER_LABELS[run.triggerType] ?? run.triggerType}
                  </span>
                  <span className={`tag ${status.chip}`}>{status.label}</span>
                  <span className="ml-auto text-[11px] whitespace-nowrap text-ink3">
                    {run.connector.displayName}
                  </span>
                </div>

                {/* Timing */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink3">
                  <span>
                    Started:{" "}
                    <span className="text-ink2 tabular-nums">{formatDateTime(run.startedAt)}</span>
                  </span>
                  <span>
                    Completed:{" "}
                    <span className="text-ink2 tabular-nums">{formatDateTime(run.completedAt)}</span>
                  </span>
                  <span>
                    Duration:{" "}
                    <span className="text-ink2 tabular-nums">
                      {formatDuration(run.startedAt, run.completedAt)}
                    </span>
                  </span>
                </div>

                {/* Counter strip */}
                <dl className="mt-3 grid grid-cols-3 gap-x-5 gap-y-3 border-t border-line pt-3 sm:grid-cols-6 lg:grid-cols-11">
                  <Counter label="Files read" value={run.filesRead} />
                  <Counter label="Discovered" value={run.resourcesDiscovered} />
                  <Counter label="Records inspected" value={run.rowsInspected} />
                  <Counter label="Rules evaluated" value={run.rulesEvaluated} />
                  <Counter label="Findings created" value={run.findingsCreated} />
                  <Counter label="Auto-resolved" value={run.findingsResolved} />
                  <Counter label="Evidence candidates" value={run.evidenceCandidatesCreated} />
                  <Counter label="New resources" value={run.resourcesCreated} />
                  <Counter label="Changed" value={run.resourcesUpdated} />
                  <Counter label="Removed" value={run.resourcesRemoved} />
                  <Counter label="Errors" value={run.errorsCount} alert />
                </dl>

                {/* Change detection results */}
                {changes !== null ? (
                  <div className="mt-3 border-t border-line pt-3">
                    <h4 className="text-[11px] font-semibold tracking-wide text-ink3 uppercase">
                      Changes detected
                    </h4>
                    {hasChanges ? (
                      <div className="mt-2 grid gap-x-8 gap-y-3 sm:grid-cols-3">
                        <ChangeGroup title="New" names={changes.new} />
                        <ChangeGroup title="Changed" names={changes.changed} />
                        <ChangeGroup title="Removed" names={changes.removed} />
                      </div>
                    ) : (
                      <p className="mt-1 text-[12.5px] leading-5 text-ink3">
                        No changes since the previous scan.
                      </p>
                    )}
                  </div>
                ) : null}

                {/* Errors */}
                {run.errorSummary ? (
                  <p className="mt-3 rounded-md border border-crit/25 bg-crit/[0.06] px-3.5 py-2.5 text-[12.5px] leading-5 text-crit-text">
                    <span className="mr-2 font-semibold tracking-wide uppercase">Errors</span>
                    {run.errorSummary}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-10 max-w-3xl border-t-2 border-line pt-4 text-xs leading-5 text-ink3">
        Scans are deterministic rules-based automation — no AI takes part in any decision. Findings
        a run creates default to “new” and require human review before they can affect the official
        compliance position. All scanned content is synthetic demonstration data.
      </p>
    </main>
  );
}
