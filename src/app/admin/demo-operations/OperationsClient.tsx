"use client";

// Interactive half of the backend operations dashboard. Triggers the
// demonstration scan (POST /api/demo/scan), polls the synchronization run
// every 700ms so the eight pipeline stages advance visibly, renders the
// deterministic before/after snapshots of the official position, and exposes
// the export / reset controls. Everything shown here is database-backed —
// no client-side simulation.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MONITORING_DISCLAIMER,
  SYNC_STAGES,
  SYNC_STAGE_LABELS,
  type SyncStage,
} from "@/lib/types";
import { formatScore } from "@/lib/format";

/** SynchronizationRun with dates serialized to ISO strings on the server. */
export interface SerializedSyncRun {
  id: string;
  status: string;
  stage: string;
  startedAt: string | null;
  completedAt: string | null;
  resourcesDiscovered: number;
  resourcesCreated: number;
  resourcesUpdated: number;
  findingsCreated: number;
  evidenceCandidatesCreated: number;
  errorsCount: number;
  errorSummary: string | null;
  triggerType: string;
  scoreBefore: string | null;
  scoreAfter: string | null;
  createdAt: string;
}

/** Shape of the deterministic position snapshot stored on the run (JSON). */
interface PositionSnapshot {
  readinessScore: number | null;
  mandatoryScore: number | null;
  evidenceReadiness: number | null;
  mandatoryGaps: number;
  importantGaps: number;
  evidenceGaps: number;
  unanswered: number;
  confirmedFindings: number;
  unreviewedFindings: number;
}

const TERMINAL_STATUSES = ["completed", "completed_with_errors", "failed"];
const POLL_INTERVAL_MS = 700;

function parseSnapshot(json: string | null): PositionSnapshot | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as PositionSnapshot;
  } catch {
    return null;
  }
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDuration(startIso: string | null, endIso: string | null): string {
  if (!startIso) return "—";
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) return "—";
  const secs = Math.max(0, end - start) / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`;
}

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${className}`} />;
}

function RunStatusTag({ run }: { run: SerializedSyncRun }) {
  if (run.status === "completed") {
    return (
      <span className="tag border border-good/25 bg-good/[0.07] text-good-text">
        <Dot className="bg-good" />
        Scan completed
      </span>
    );
  }
  if (run.status === "completed_with_errors") {
    return (
      <span className="tag border border-warn/30 bg-warn/[0.07] text-warn-text">
        <Dot className="bg-warn" />
        Completed with errors
      </span>
    );
  }
  if (run.status === "failed") {
    return (
      <span className="tag border border-crit/25 bg-crit/[0.06] text-crit-text">
        <Dot className="bg-crit" />
        Scan failed
      </span>
    );
  }
  const stageLabel = SYNC_STAGE_LABELS[run.stage as SyncStage] ?? run.stage;
  return (
    <span className="tag border border-accent/30 bg-accent/[0.07] text-accent-strong">
      <Dot className="animate-pulse bg-accent" />
      Running — {stageLabel}
    </span>
  );
}

/** The eight pipeline stages: done = checked, current = gold ring. */
function StageStepper({ run }: { run: SerializedSyncRun }) {
  const stageIdx = SYNC_STAGES.indexOf(run.stage as SyncStage);
  const allDone = run.status === "completed";
  return (
    <ol aria-label="Scan pipeline stages" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-8">
      {SYNC_STAGES.map((stage, i) => {
        const done = allDone || i < stageIdx;
        const current = !allDone && i === stageIdx;
        const failedHere = current && run.status === "failed";
        return (
          <li
            key={stage}
            aria-current={current ? "step" : undefined}
            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 ${
              current
                ? failedHere
                  ? "border-crit/50 bg-crit/[0.05] ring-2 ring-crit/50"
                  : "border-gold/60 bg-gold/[0.07] ring-2 ring-gold"
                : done
                  ? "border-line bg-surface"
                  : "border-line bg-surface opacity-55"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                done
                  ? "bg-accent text-accent-ink"
                  : current
                    ? failedHere
                      ? "bg-crit text-white"
                      : "bg-gold text-white"
                    : "bg-surface2 text-ink3"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-[11px] leading-4 font-medium ${done || current ? "text-ink" : "text-ink3"}`}
            >
              {SYNC_STAGE_LABELS[stage]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const COUNTERS: { key: keyof SerializedSyncRun; label: string }[] = [
  { key: "resourcesDiscovered", label: "Resources discovered" },
  { key: "resourcesCreated", label: "Resources created" },
  { key: "resourcesUpdated", label: "Resources updated" },
  { key: "findingsCreated", label: "Potential findings" },
  { key: "evidenceCandidatesCreated", label: "Evidence candidates" },
  { key: "errorsCount", label: "Errors" },
];

const SNAPSHOT_ROWS: { key: keyof PositionSnapshot; label: string; isScore?: boolean }[] = [
  { key: "readinessScore", label: "Official readiness", isScore: true },
  { key: "mandatoryScore", label: "Mandatory readiness", isScore: true },
  { key: "evidenceReadiness", label: "Evidence readiness", isScore: true },
  { key: "mandatoryGaps", label: "Mandatory gaps" },
  { key: "importantGaps", label: "Important gaps" },
  { key: "evidenceGaps", label: "Evidence gaps" },
  { key: "unanswered", label: "Undecided controls" },
  { key: "confirmedFindings", label: "Confirmed findings" },
  { key: "unreviewedFindings", label: "Findings awaiting review" },
];

function DeltaCell({
  before,
  after,
  isScore,
  emphasize,
}: {
  before: number | null;
  after: number | null;
  isScore?: boolean;
  emphasize?: boolean;
}) {
  if (before === null || after === null) return <span className="text-xs text-ink3">—</span>;
  const delta = isScore ? Math.round(after) - Math.round(before) : after - before;
  if (delta === 0) return <span className="text-[11px] text-ink3">unchanged</span>;
  return (
    <span
      className={`text-[12px] font-semibold tabular-nums ${
        emphasize ? "text-gold-text" : "text-ink2"
      }`}
    >
      {delta > 0 ? "+" : "−"}
      {Math.abs(delta)}
      {isScore ? " pts" : ""}
    </span>
  );
}

export function OperationsClient({
  latestRun,
  canRun,
}: {
  latestRun: SerializedSyncRun | null;
  canRun: boolean;
}) {
  const router = useRouter();
  const [run, setRun] = useState<SerializedSyncRun | null>(latestRun);
  const [scanning, setScanning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function pollRun(runId: string): Promise<void> {
    let consecutiveFailures = 0;
    for (;;) {
      if (!mountedRef.current) return;
      const res = await fetch(`/api/sync-runs/${runId}`, { cache: "no-store" });
      if (res.ok) {
        consecutiveFailures = 0;
        const data = (await res.json()) as { run: SerializedSyncRun };
        if (!mountedRef.current) return;
        setRun(data.run);
        if (TERMINAL_STATUSES.includes(data.run.status)) return;
      } else if (res.status === 401 || res.status === 403 || res.status === 404) {
        // Session expired, access revoked, or the run was deleted (e.g. a
        // reset from another tab) — the run can never complete from here.
        throw new Error(
          res.status === 404
            ? "The scan run no longer exists — it may have been removed by a reset. Reload the page."
            : "Your session can no longer read the scan run. Sign in again and reload."
        );
      } else {
        consecutiveFailures += 1;
        if (consecutiveFailures >= 8) {
          throw new Error("The scan status could not be read after repeated attempts. Reload the page to check the result.");
        }
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  async function onRunScan() {
    setError(null);
    setScanning(true);
    try {
      const res = await fetch("/api/demo/scan", { method: "POST" });
      const body = (await res.json().catch(() => null)) as { runId?: string; error?: string } | null;
      if (!res.ok || !body?.runId) {
        throw new Error(body?.error ?? "The demonstration scan could not be started.");
      }
      await pollRun(body.runId);
      // Refresh the server-rendered stat cards and audit trail.
      if (mountedRef.current) router.refresh();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "The demonstration scan could not be started.");
      }
    } finally {
      if (mountedRef.current) setScanning(false);
    }
  }

  async function onReset() {
    const confirmed = window.confirm(
      "Reset the demonstration? This clears scan results, automated findings and discovered inventory, and restores the seeded state. The audit trail is preserved — the reset itself is recorded as an audit event."
    );
    if (!confirmed) return;
    setError(null);
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "The demonstration could not be reset.");
      }
      if (mountedRef.current) {
        setRun(null);
        router.refresh();
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "The demonstration could not be reset.");
      }
    } finally {
      if (mountedRef.current) setResetting(false);
    }
  }

  const before = parseSnapshot(run?.scoreBefore ?? null);
  const after = parseSnapshot(run?.scoreAfter ?? null);
  const readinessIdentical =
    before !== null &&
    after !== null &&
    formatScore(before.readinessScore) === formatScore(after.readinessScore);
  const unreviewedDelta =
    before !== null && after !== null ? after.unreviewedFindings - before.unreviewedFindings : 0;

  return (
    <section aria-label="Demonstration pipeline" className="panel mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-text">Demonstration pipeline</p>
          <h2 className="display mt-2 text-xl font-semibold tracking-tight">Automated scan</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-6 text-ink2">
            Runs the full monitoring pipeline against the demonstration connector — discovery,
            normalization, rules-based checks, control mapping and a deterministic position
            snapshot. Every stage persists to the database, and every scan action — trigger,
            rule match, finding, mapping, snapshot — is recorded in the audit trail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRunScan}
            disabled={!canRun || scanning || resetting}
          >
            {scanning ? "Scan running…" : "Run demonstration scan"}
          </button>
          <a href="/api/exports/full" download className="btn">
            Export backend data (Excel)
          </a>
          <button
            type="button"
            className="btn"
            onClick={onReset}
            disabled={scanning || resetting}
          >
            {resetting ? "Resetting…" : "Reset demonstration"}
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-crit/25 bg-crit/[0.06] px-3.5 py-2.5 text-[13px] leading-5 text-crit-text"
        >
          {error}
        </p>
      ) : null}

      {/* ── Pipeline progress ─────────────────────────────────────────────── */}
      <div className="card mt-5 p-5 sm:p-6">
        {run ? (
          <>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <RunStatusTag run={run} />
              <span className="text-xs text-ink3">
                Started{" "}
                <span className="font-semibold text-ink2 tabular-nums">{formatTime(run.startedAt)}</span>
              </span>
              <span className="text-xs text-ink3">
                Duration{" "}
                <span className="font-semibold text-ink2 tabular-nums">
                  {formatDuration(run.startedAt, run.completedAt)}
                </span>
              </span>
              <span className="tag tag-outline ml-auto font-mono text-[10px] tracking-wide">
                Run {run.id.slice(-8)} · {run.triggerType}
              </span>
            </div>

            <div className="mt-5">
              <StageStepper run={run} />
            </div>

            {run.status === "failed" && run.errorSummary ? (
              <p className="mt-4 rounded-md border border-crit/25 bg-crit/[0.06] px-3.5 py-2.5 text-[13px] leading-5 text-crit-text">
                {run.errorSummary}
              </p>
            ) : null}

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-3 lg:grid-cols-6">
              {COUNTERS.map((c) => {
                const value = run[c.key] as number;
                const critical = c.key === "errorsCount" && value > 0;
                return (
                  <div key={c.key}>
                    <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
                      {c.label}
                    </dt>
                    <dd
                      className={`mt-0.5 text-xl font-semibold tabular-nums ${critical ? "text-crit-text" : "text-ink"}`}
                    >
                      {value}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="display text-lg font-semibold">No scan on record</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-ink2">
              Run the demonstration scan to watch the pipeline execute stage by stage — every
              step persists to the database and every scan action is audited.
            </p>
          </div>
        )}
      </div>

      {/* ── Official position: before / after ─────────────────────────────── */}
      <div className="card mt-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow text-gold-text">Official position — before / after</p>
          {readinessIdentical ? (
            <span className="tag border border-good/25 bg-good/[0.07] text-good-text">
              <Dot className="bg-good" />
              Official readiness unchanged
            </span>
          ) : null}
        </div>

        {before && after ? (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b-2 border-line text-[11px] font-semibold tracking-wide text-ink3 uppercase">
                    <th scope="col" className="py-2 pr-4 text-left font-semibold">
                      Measure
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-semibold">
                      Before scan
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-semibold">
                      After scan
                    </th>
                    <th scope="col" className="py-2 text-right font-semibold">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {SNAPSHOT_ROWS.map((row) => {
                    const b = before[row.key];
                    const a = after[row.key];
                    const emphasize = row.key === "unreviewedFindings" && unreviewedDelta > 0;
                    const anchor = row.key === "readinessScore";
                    return (
                      <tr key={row.key} className={emphasize ? "bg-gold/[0.06]" : undefined}>
                        <th
                          scope="row"
                          className={`py-2 pr-4 text-left text-[13px] font-medium ${anchor || emphasize ? "text-ink" : "text-ink2"}`}
                        >
                          {row.label}
                        </th>
                        <td
                          className={`py-2 pr-4 text-right tabular-nums ${anchor ? "text-[15px] font-semibold" : "font-medium"}`}
                        >
                          {row.isScore ? formatScore(b) : (b ?? "—")}
                        </td>
                        <td
                          className={`py-2 pr-4 text-right tabular-nums ${anchor ? "text-[15px] font-semibold" : "font-medium"} ${emphasize ? "text-gold-text" : ""}`}
                        >
                          {row.isScore ? formatScore(a) : (a ?? "—")}
                        </td>
                        <td className="py-2 text-right">
                          <DeltaCell before={b} after={a} isScore={row.isScore} emphasize={emphasize} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {readinessIdentical && unreviewedDelta > 0 ? (
              <p className="mt-4 rounded-md border border-gold/40 bg-gold/[0.07] px-3.5 py-2.5 text-[13px] leading-6 text-ink2">
                <span className="font-semibold text-gold-text">
                  Official readiness is identical before and after the scan
                  {" "}({formatScore(after.readinessScore)}).
                </span>{" "}
                Findings awaiting review rose from {before.unreviewedFindings} to{" "}
                {after.unreviewedFindings} — potential findings are recorded, not applied. Only a
                human reviewer can confirm a finding into the official position.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-[13px] leading-6 text-ink3">
            {run && !TERMINAL_STATUSES.includes(run.status)
              ? "The after-scan snapshot is captured when the run completes."
              : "Run a demonstration scan to capture deterministic before/after snapshots of the official position."}
          </p>
        )}

        <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-ink3">
          {MONITORING_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}
