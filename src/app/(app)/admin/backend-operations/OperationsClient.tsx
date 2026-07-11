"use client";

// Interactive half of the backend operations console.
//
// Run scan (with a preflight confirmation), poll the synchronization run row
// every 600ms for live stage/counter progress, render the results grid and
// the deterministic before/after position snapshots, control active
// monitoring, inject demonstration changes into the source vault, and expose
// export/reset. Every number shown comes from database rows passed in as
// props or polled from /api/sync-runs/{id} — nothing is simulated
// client-side, and this component never creates findings.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  MONITORING_DISCLAIMER,
  SYNC_STAGES,
  SYNC_STAGE_LABELS,
  type SyncStage,
} from "@/lib/types";
import { formatScore } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

// ─── Serialized shapes (dates as ISO strings) ────────────────────────────────

/** SynchronizationRun row with dates serialized to ISO strings. */
export interface SerializedSyncRun {
  id: string;
  status: string;
  stage: string;
  startedAt: string | null;
  completedAt: string | null;
  resourcesDiscovered: number;
  resourcesCreated: number;
  resourcesUpdated: number;
  resourcesRemoved: number;
  filesRead: number;
  rowsInspected: number;
  rulesEvaluated: number;
  findingsCreated: number;
  findingsResolved: number;
  evidenceCandidatesCreated: number;
  errorsCount: number;
  currentItem: string | null;
  changeSummary: string | null;
  triggerType: string;
  errorSummary: string | null;
  scoreBefore: string | null;
  scoreAfter: string | null;
  createdAt: string;
}

/** The vault connector's monitoring state, serialized on the server. */
export interface SerializedConnector {
  id: string;
  monitoringEnabled: boolean;
  monitoringIntervalSeconds: number;
  nextSyncAt: string | null;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
}

/** One Inject Demo Change scenario (INJECT_SCENARIOS passed through). */
export interface InjectScenarioOption {
  code: string;
  label: string;
  description: string;
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

/** Per-run change detection summary stored on the run (JSON). */
interface ChangeSummary {
  new: string[];
  changed: string[];
  removed: string[];
}

const TERMINAL_STATUSES = ["completed", "completed_with_errors", "failed"];
const POLL_INTERVAL_MS = 600;
const MONITOR_REFRESH_MS = 10_000;
const INTERVAL_OPTIONS = [30, 60, 120, 300];

// ─── Parsing / formatting helpers ────────────────────────────────────────────

function parseSnapshot(json: string | null): PositionSnapshot | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as PositionSnapshot;
  } catch {
    return null;
  }
}

function parseChangeSummary(json: string | null): ChangeSummary | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Partial<Record<keyof ChangeSummary, unknown>>;
    const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
    return { new: list(raw.new), changed: list(raw.changed), removed: list(raw.removed) };
  } catch {
    return null;
  }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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

// ─── Small presentational pieces ─────────────────────────────────────────────

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${className}`} />;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[13px] leading-5 font-medium text-ink">{children}</dd>
    </div>
  );
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
      {run.status === "queued" ? "Queued" : `Running — ${stageLabel}`}
    </span>
  );
}

/** The 12 pipeline stages: done = teal check, current = gold ring. */
function StageStepper({ run }: { run: SerializedSyncRun }) {
  const stageIdx = SYNC_STAGES.indexOf(run.stage as SyncStage);
  const allDone = run.status === "completed" || run.status === "completed_with_errors";
  return (
    <ol
      aria-label="Scan pipeline stages"
      className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6"
    >
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

function ChangeList({ title, names }: { title: string; names: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
        {title} <span className="tabular-nums">({names.length})</span>
      </p>
      {names.length === 0 ? (
        <p className="mt-1 text-[12px] text-ink3">None</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-0.5">
          {names.map((name) => (
            <li key={name} className="font-mono text-[11px] leading-5 text-ink2">
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
      className={`text-[12px] font-semibold tabular-nums ${emphasize ? "text-gold-text" : "text-ink2"}`}
    >
      {delta > 0 ? "+" : "−"}
      {Math.abs(delta)}
      {isScore ? " pts" : ""}
    </span>
  );
}

// ─── The console ─────────────────────────────────────────────────────────────

export function OperationsClient({
  latestRun,
  connector,
  orgName,
  sourceName,
  fileCount,
  recordEstimate,
  ruleCount,
  injectScenarios,
}: {
  latestRun: SerializedSyncRun | null;
  connector: SerializedConnector | null;
  orgName: string;
  sourceName: string;
  fileCount: number;
  recordEstimate: number | null;
  ruleCount: number;
  injectScenarios: InjectScenarioOption[];
}) {
  const router = useRouter();
  const [run, setRun] = useState<SerializedSyncRun | null>(latestRun);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitorBusy, setMonitorBusy] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(
    connector?.monitoringIntervalSeconds ?? 60
  );
  const [scenario, setScenario] = useState(injectScenarios[0]?.code ?? "");
  const [injecting, setInjecting] = useState(false);
  const [injectSummary, setInjectSummary] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const mountedRef = useRef(true);
  const scanningRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Adopt the server's latest run (scheduled scans surface via router.refresh)
  // unless a manual scan is being polled right now.
  useEffect(() => {
    if (!scanningRef.current) setRun(latestRun);
  }, [latestRun]);

  // While monitoring is active, refresh the server props every 10s so
  // scheduled runs, sync stamps and the audit trail stay current. Stops as
  // soon as monitoring is paused.
  const monitoringActive = connector?.monitoringEnabled ?? false;
  useEffect(() => {
    if (!monitoringActive) return;
    const timer = window.setInterval(() => router.refresh(), MONITOR_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [monitoringActive, router]);

  const canRun = Boolean(connector) && fileCount > 0;

  async function pollRun(runId: string): Promise<void> {
    let transientFailures = 0;
    for (;;) {
      if (!mountedRef.current) return;
      const res = await fetch(`/api/sync-runs/${runId}`, { cache: "no-store" });
      if (res.ok) {
        transientFailures = 0;
        const data = (await res.json()) as { run: SerializedSyncRun };
        if (!mountedRef.current) return;
        setRun(data.run);
        if (TERMINAL_STATUSES.includes(data.run.status)) return;
      } else if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Your session can no longer read this scan run. Sign in again and reload the page."
        );
      } else if (res.status === 404) {
        throw new Error(
          "The scan run no longer exists — it may have been removed by a reset in another tab. Reload the page."
        );
      } else {
        transientFailures += 1;
        if (transientFailures >= 8) {
          throw new Error(
            "The scan status could not be read after repeated attempts. Reload the page to check the result."
          );
        }
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  async function onConfirmScan() {
    setPreflightOpen(false);
    setError(null);
    setInjectSummary(null);
    setScanning(true);
    scanningRef.current = true;
    try {
      const res = await fetch("/api/demo/scan", { method: "POST" });
      const body = (await res.json().catch(() => null)) as
        | { runId?: string; error?: string }
        | null;
      if (!res.ok || !body?.runId) {
        throw new Error(body?.error ?? "The scan could not be started.");
      }
      await pollRun(body.runId);
      if (mountedRef.current) router.refresh();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "The scan could not be started.");
      }
    } finally {
      scanningRef.current = false;
      if (mountedRef.current) setScanning(false);
    }
  }

  async function onSetMonitoring(action: "start" | "stop") {
    setError(null);
    setMonitorBusy(true);
    try {
      const res = await fetch("/api/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, intervalSeconds }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "The monitoring state could not be changed.");
      }
      if (mountedRef.current) router.refresh();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "The monitoring state could not be changed.");
      }
    } finally {
      if (mountedRef.current) setMonitorBusy(false);
    }
  }

  async function onInject() {
    if (!scenario) return;
    setError(null);
    setInjectSummary(null);
    setInjecting(true);
    try {
      const res = await fetch("/api/demo/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const body = (await res.json().catch(() => null)) as
        | { summary?: string; error?: string }
        | null;
      if (!res.ok || !body?.summary) {
        throw new Error(body?.error ?? "The change could not be injected.");
      }
      if (mountedRef.current) {
        setInjectSummary(body.summary);
        router.refresh();
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "The change could not be injected.");
      }
    } finally {
      if (mountedRef.current) setInjecting(false);
    }
  }

  async function onReset() {
    const confirmed = window.confirm(
      "Reset the demonstration? This restores the synthetic data vault byte-for-byte, clears all scan artefacts (runs, discovered resources, findings and scan-generated inventory) and stops active monitoring. The audit trail is preserved — the reset itself is recorded as an audit event."
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
        setInjectSummary(null);
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
  const changes = parseChangeSummary(run?.changeSummary ?? null);
  const finished = run
    ? run.status === "completed" || run.status === "completed_with_errors"
    : false;
  const readinessIdentical =
    before !== null &&
    after !== null &&
    formatScore(before.readinessScore) === formatScore(after.readinessScore);
  const unreviewedDelta =
    before !== null && after !== null ? after.unreviewedFindings - before.unreviewedFindings : 0;
  const selectedScenario = injectScenarios.find((s) => s.code === scenario) ?? null;

  return (
    <>
      {/* ── Scan operations ───────────────────────────────────────────────── */}
      <section aria-label="Scan operations" className="panel mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-gold-text">Scan operations</p>
            <h2 className="display mt-2 text-xl font-semibold tracking-tight">
              Run a monitoring scan
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-ink2">
              Reads every file in the source, detects changes by checksum, evaluates the enabled
              deterministic rules and records findings for human review. Every stage persists to
              the database and every action is audited. No AI takes part in any decision.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setPreflightOpen((open) => !open)}
              disabled={!canRun || scanning || resetting}
            >
              {scanning ? "Scan running…" : "Run scan now"}
            </button>
            <a href="/api/exports/full" download className="btn">
              Export monitoring workbook
            </a>
            <button type="button" className="btn" onClick={onReset} disabled={scanning || resetting}>
              {resetting ? "Resetting…" : "Reset demonstration"}
            </button>
          </div>
        </div>

        {!canRun ? (
          <p className="mt-3 text-[13px] leading-5 text-ink3">
            {!connector
              ? "The vault connector is not provisioned — run the seed to create it."
              : "The data vault has no files to scan — reset the demonstration to regenerate it."}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-crit/25 bg-crit/[0.06] px-3.5 py-2.5 text-[13px] leading-5 text-crit-text"
          >
            {error}
          </p>
        ) : null}

        {/* Preflight: exactly what will be scanned, before anything runs. */}
        {preflightOpen ? (
          <div
            role="region"
            aria-label="Scan preflight"
            className="card mt-5 border-gold/50 p-5 sm:p-6"
          >
            <p className="eyebrow text-gold-text">Preflight — confirm before running</p>
            <p className="display mt-2 text-lg font-semibold tracking-tight">
              Scan {fileCount} synthetic client files for {orgName}.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Fact label="Company">{orgName}</Fact>
              <Fact label="Source">{sourceName}</Fact>
              <Fact label="Data location">Egypt — local demo storage</Fact>
              <Fact label="Files available">
                <span className="tabular-nums">{fileCount}</span>
              </Fact>
              <Fact label="Estimated records">
                <span className="tabular-nums">
                  {recordEstimate === null ? "—" : recordEstimate.toLocaleString("en-GB")}
                </span>
              </Fact>
              <Fact label="Rules selected">
                <span className="tabular-nums">{ruleCount}</span> deterministic rules
              </Fact>
              <Fact label="Scan type">Manual full rescan with change detection</Fact>
              <Fact label="Last scan">
                <span className="tabular-nums">{formatDateTime(connector?.lastSyncAt)}</span>
              </Fact>
              <Fact label="Monitoring">
                {monitoringActive
                  ? `Active — every ${connector?.monitoringIntervalSeconds}s`
                  : "Paused"}
              </Fact>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onConfirmScan}
                disabled={!canRun || scanning || resetting}
              >
                Confirm and run scan
              </button>
              <button type="button" className="btn" onClick={() => setPreflightOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {/* Live progress: the 12 pipeline stages + counters from the run row. */}
        <div className="card mt-5 p-5 sm:p-6">
          {run ? (
            <>
              <div aria-live="polite" className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <RunStatusTag run={run} />
                <span className="text-xs text-ink3">
                  Started{" "}
                  <span className="font-semibold text-ink2 tabular-nums">
                    {formatDateTime(run.startedAt)}
                  </span>
                </span>
                <span className="text-xs text-ink3">
                  Elapsed{" "}
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
                <p
                  role="alert"
                  className="mt-4 rounded-md border border-crit/25 bg-crit/[0.06] px-3.5 py-2.5 text-[13px] leading-5 text-crit-text"
                >
                  {run.errorSummary}
                </p>
              ) : null}

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-3 lg:grid-cols-5">
                <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                  <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
                    Current file
                  </dt>
                  <dd className="mt-0.5 truncate font-mono text-[12px] leading-6 font-semibold text-ink">
                    {run.currentItem ?? "—"}
                  </dd>
                </div>
                {(
                  [
                    {
                      label: "Files read / discovered",
                      value: `${run.filesRead} / ${run.resourcesDiscovered}`,
                    },
                    { label: "Records inspected", value: run.rowsInspected.toLocaleString("en-GB") },
                    { label: "Rules evaluated", value: String(run.rulesEvaluated) },
                    { label: "Findings created", value: String(run.findingsCreated) },
                    { label: "Auto-resolved", value: String(run.findingsResolved) },
                    { label: "Evidence candidates", value: String(run.evidenceCandidatesCreated) },
                    { label: "Errors", value: String(run.errorsCount), critical: run.errorsCount > 0 },
                    { label: "Elapsed", value: formatDuration(run.startedAt, run.completedAt) },
                  ] as { label: string; value: string; critical?: boolean }[]
                ).map((c) => (
                  <div key={c.label}>
                    <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
                      {c.label}
                    </dt>
                    <dd
                      className={`mt-0.5 text-xl font-semibold tabular-nums ${c.critical ? "text-crit-text" : "text-ink"}`}
                    >
                      {c.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <EmptyState
              title="No scan on record"
              body={`Run a scan to read the ${fileCount} files in ${sourceName} and watch the pipeline execute stage by stage. Every step persists to the database and is audited.`}
            />
          )}
        </div>

        {/* Results: read entirely from the completed run row. */}
        {run && finished ? (
          <div className="card mt-4 p-5 sm:p-6">
            <p className="eyebrow text-gold-text">Scan results</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {(
                [
                  { label: "Files discovered", value: String(run.resourcesDiscovered) },
                  { label: "Files read", value: String(run.filesRead) },
                  { label: "Records inspected", value: run.rowsInspected.toLocaleString("en-GB") },
                  { label: "Rules evaluated", value: String(run.rulesEvaluated) },
                  { label: "Findings created", value: String(run.findingsCreated) },
                  { label: "Findings auto-resolved", value: String(run.findingsResolved) },
                  { label: "Evidence candidates", value: String(run.evidenceCandidatesCreated) },
                  { label: "Errors", value: String(run.errorsCount), critical: run.errorsCount > 0 },
                ] as { label: string; value: string; critical?: boolean }[]
              ).map((c) => (
                <div key={c.label}>
                  <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
                    {c.label}
                  </dt>
                  <dd
                    className={`mt-0.5 text-xl font-semibold tabular-nums ${c.critical ? "text-crit-text" : "text-ink"}`}
                  >
                    {c.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 grid gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-3">
              <ChangeList title="New resources" names={changes?.new ?? []} />
              <ChangeList title="Changed resources" names={changes?.changed ?? []} />
              <ChangeList title="Removed resources" names={changes?.removed ?? []} />
            </div>

            {run.errorsCount > 0 && run.errorSummary ? (
              <p className="mt-4 rounded-md border border-warn/30 bg-warn/[0.07] px-3.5 py-2.5 text-[13px] leading-5 text-warn-text">
                {run.errorSummary}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Official position: deterministic before/after snapshots. */}
        <div className="card mt-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow text-gold-text">Official position — before / after</p>
            {before && after && readinessIdentical ? (
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
                    Official readiness is identical before and after the scan (
                    {formatScore(after.readinessScore)}).
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
                : "Run a scan to capture deterministic before/after snapshots of the official position."}
            </p>
          )}

          <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-ink3">
            {MONITORING_DISCLAIMER}
          </p>
        </div>
      </section>

      {/* ── Active monitoring ─────────────────────────────────────────────── */}
      <section aria-label="Active monitoring" className="panel mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-gold-text">Active monitoring</p>
            <h2 className="display mt-2 text-xl font-semibold tracking-tight">
              Scheduled rescans
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-6 text-ink2">
              Re-scans the source on a fixed interval using the same deterministic pipeline as a
              manual scan. Findings still default to new and await human review.
            </p>
          </div>
          {connector ? (
            monitoringActive ? (
              <span className="tag border border-accent/30 bg-accent/[0.07] text-accent-strong">
                <Dot className="animate-pulse bg-accent" />
                Active — every {connector.monitoringIntervalSeconds}s
              </span>
            ) : (
              <span className="tag tag-outline">
                <Dot className="bg-ink3" />
                Paused
              </span>
            )
          ) : (
            <span className="tag tag-outline">Not provisioned</span>
          )}
        </div>

        <div className="card mt-5 flex flex-wrap items-end gap-x-6 gap-y-4 p-5 sm:p-6">
          <div className="w-44">
            <label htmlFor="monitoring-interval" className="field-label">
              Scan interval
            </label>
            <select
              id="monitoring-interval"
              className="input"
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              disabled={!connector || monitorBusy}
            >
              {!INTERVAL_OPTIONS.includes(intervalSeconds) ? (
                <option value={intervalSeconds}>Every {intervalSeconds} seconds</option>
              ) : null}
              {INTERVAL_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  Every {s} seconds
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSetMonitoring("start")}
              disabled={!connector || monitorBusy || monitoringActive}
            >
              {monitorBusy ? "Applying…" : "Start monitoring"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onSetMonitoring("stop")}
              disabled={!connector || monitorBusy || !monitoringActive}
            >
              Stop monitoring
            </button>
          </div>
          <dl className="ml-auto grid grid-cols-2 gap-x-8 gap-y-3">
            <Fact label="Last successful scan">
              <span className="tabular-nums">
                {formatDateTime(connector?.lastSuccessfulSyncAt)}
              </span>
            </Fact>
            <Fact label="Next scheduled scan">
              <span className="tabular-nums">
                {monitoringActive ? formatDateTime(connector?.nextSyncAt) : "—"}
              </span>
            </Fact>
          </dl>
        </div>
      </section>

      {/* ── Inject demonstration change ───────────────────────────────────── */}
      <section aria-label="Inject demonstration change" className="panel mt-10">
        <div>
          <p className="eyebrow text-gold-text">Inject demonstration change</p>
          <h2 className="display mt-2 text-xl font-semibold tracking-tight">
            Change the source data
          </h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-6 text-ink2">
            Mutates the actual synthetic files and manifest in the source vault. This action never
            creates findings — the next scan detects the change through checksums and the
            deterministic rules.
          </p>
        </div>

        <div className="card mt-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <div className="w-full max-w-md">
              <label htmlFor="inject-scenario" className="field-label">
                Scenario
              </label>
              <select
                id="inject-scenario"
                className="input"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                disabled={injecting || scanning || resetting}
              >
                {injectScenarios.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-ink"
              onClick={onInject}
              disabled={!scenario || injecting || scanning || resetting}
            >
              {injecting ? "Injecting…" : "Inject change"}
            </button>
          </div>
          {selectedScenario ? (
            <p className="mt-2 text-[12px] leading-5 text-ink3">{selectedScenario.description}</p>
          ) : null}

          {injectSummary ? (
            <p className="mt-4 rounded-md border border-gold/40 bg-gold/[0.07] px-3.5 py-2.5 text-[13px] leading-6 text-ink2">
              <span className="font-semibold text-gold-text">{injectSummary}</span> Change applied
              to the source. Run a scan (or wait for the next scheduled scan) to watch it get
              detected.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
