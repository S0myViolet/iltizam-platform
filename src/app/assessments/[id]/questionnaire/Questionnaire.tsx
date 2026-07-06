"use client";

// Questionnaire — the interactive assessment flow. Controls grouped by domain,
// filterable, with autosave. Each card expands into the control detail drawer
// (notes, owner, due date, remediation status, evidence).

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import type { AnswerRow, AssessmentSummary, EvidenceItem } from "@/lib/assessments";
import type { AnswerValue } from "@/lib/types";
import { SEVERITY_LABELS } from "@/lib/types";
import { formatScore } from "@/lib/format";
import { ControlCard } from "./ControlCard";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface AnswerPatch {
  answer?: AnswerValue;
  ownerName?: string | null;
  ownerEmail?: string | null;
  notes?: string | null;
  dueDate?: string | null;
  remediationStatus?: string;
}

const SHOW_FILTERS = [
  { value: "all", label: "All controls" },
  { value: "unanswered", label: "Unanswered" },
  { value: "gaps", label: "Gaps (answered No)" },
  { value: "missing_evidence", label: "Missing evidence" },
] as const;
type ShowFilter = (typeof SHOW_FILTERS)[number]["value"];

function matchesShow(row: AnswerRow, show: ShowFilter): boolean {
  switch (show) {
    case "unanswered":
      return row.answer === "not_answered";
    case "gaps":
      return row.answer === "no";
    case "missing_evidence":
      return row.answer === "yes" && row.requiresEvidence && row.evidence.length === 0;
    default:
      return true;
  }
}

export function Questionnaire({
  assessment,
  initialRows,
  domainBlurbs,
  initialDomain,
  initialSeverity,
  initialShow,
}: {
  assessment: AssessmentSummary;
  initialRows: AnswerRow[];
  domainBlurbs: Record<string, string>;
  initialDomain: string;
  initialSeverity: string;
  initialShow: string;
}) {
  const [rows, setRows] = useState<AnswerRow[]>(initialRows);
  const [readinessScore, setReadinessScore] = useState<number | null>(assessment.readinessScore);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const domains = useMemo(() => {
    const seen = new Map<string, { name: string; order: number }>();
    for (const r of rows) {
      if (!seen.has(r.domain)) seen.set(r.domain, { name: r.domain, order: r.domainOrder });
    }
    return [...seen.values()].sort((a, b) => a.order - b.order);
  }, [rows]);

  const [domainFilter, setDomainFilter] = useState<string>(
    domains.some((d) => d.name === initialDomain) ? initialDomain : "all"
  );
  const [severityFilter, setSeverityFilter] = useState<string>(
    initialSeverity === "legally_mandatory" || initialSeverity === "important"
      ? initialSeverity
      : "all"
  );
  const [showFilter, setShowFilter] = useState<ShowFilter>(
    (SHOW_FILTERS.some((f) => f.value === initialShow) ? initialShow : "all") as ShowFilter
  );

  // ── autosave plumbing ─────────────────────────────────────────────────────
  const pendingPatches = useRef(new Map<string, AnswerPatch>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(0);

  const flush = useCallback(async (answerId: string) => {
    const patch = pendingPatches.current.get(answerId);
    if (!patch || Object.keys(patch).length === 0) return;
    pendingPatches.current.delete(answerId);
    inFlight.current += 1;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/answers/${answerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      const data = await res.json();
      if (data.assessment) setReadinessScore(data.assessment.readinessScore);
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      setSaveState("error");
    } finally {
      inFlight.current -= 1;
      if (inFlight.current === 0 && pendingPatches.current.size === 0) {
        setSaveState((prev) => (prev === "error" ? prev : "saved"));
      }
    }
  }, []);

  const queuePatch = useCallback(
    (answerId: string, patch: AnswerPatch, options: { debounce?: number } = {}) => {
      // optimistic local update
      setRows((prev) =>
        prev.map((r) => {
          if (r.answerId !== answerId) return r;
          const next = { ...r };
          if (patch.answer !== undefined) next.answer = patch.answer;
          if (patch.ownerName !== undefined) next.ownerName = patch.ownerName;
          if (patch.ownerEmail !== undefined) next.ownerEmail = patch.ownerEmail;
          if (patch.notes !== undefined) next.notes = patch.notes;
          if (patch.dueDate !== undefined)
            next.dueDate = patch.dueDate ? new Date(patch.dueDate) : null;
          if (patch.remediationStatus !== undefined)
            next.remediationStatus = patch.remediationStatus as AnswerRow["remediationStatus"];
          return next;
        })
      );
      pendingPatches.current.set(answerId, {
        ...pendingPatches.current.get(answerId),
        ...patch,
      });
      setSaveState("saving");
      setSaveError(null);
      const existing = timers.current.get(answerId);
      if (existing) clearTimeout(existing);
      const delay = options.debounce ?? 0;
      timers.current.set(
        answerId,
        setTimeout(() => {
          timers.current.delete(answerId);
          void flush(answerId);
        }, delay)
      );
    },
    [flush]
  );

  const setEvidence = useCallback((answerId: string, updater: (prev: EvidenceItem[]) => EvidenceItem[]) => {
    setRows((prev) =>
      prev.map((r) => (r.answerId === answerId ? { ...r, evidence: updater(r.evidence) } : r))
    );
  }, []);

  // ── derived view ──────────────────────────────────────────────────────────
  const answeredCount = rows.filter((r) => r.answer !== "not_answered").length;
  const progress = rows.length === 0 ? 0 : Math.round((answeredCount / rows.length) * 100);

  const visibleRows = rows.filter(
    (r) =>
      (domainFilter === "all" || r.domain === domainFilter) &&
      (severityFilter === "all" || r.severity === severityFilter) &&
      matchesShow(r, showFilter)
  );

  const visibleDomains = domains.filter((d) => visibleRows.some((r) => r.domain === d.name));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Sticky progress + filter bar */}
      <div className="sticky top-14 z-30 -mx-4 border-b border-line bg-page/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={`/assessments/${assessment.id}`}
                className="font-medium text-ink2 hover:text-ink"
              >
                {assessment.companyName}
              </Link>
              <span className="text-ink3">/</span>
              <span className="font-semibold">Questionnaire</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface2 sm:w-56">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-ink2">
                {answeredCount}/{rows.length} answered · readiness{" "}
                <strong>{formatScore(readinessScore)}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              aria-live="polite"
              className={
                saveState === "error" || saveError
                  ? "text-crit-text"
                  : saveState === "saving"
                    ? "text-ink2"
                    : "text-ink3"
              }
            >
              {saveError
                ? `Couldn't save: ${saveError}`
                : saveState === "saving"
                  ? "Saving…"
                  : saveState === "saved"
                    ? "All changes saved"
                    : ""}
            </span>
            <Link href={`/assessments/${assessment.id}/gaps`} className="btn !px-3 !py-1.5 !text-xs">
              Gap report
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="domain-filter">
            Filter by area
          </label>
          <select
            id="domain-filter"
            className="input !w-auto !py-1.5 !text-xs"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option value="all">All areas</option>
            {domains.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="severity-filter">
            Filter by severity
          </label>
          <select
            id="severity-filter"
            className="input !w-auto !py-1.5 !text-xs"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All severities</option>
            <option value="legally_mandatory">{SEVERITY_LABELS.legally_mandatory}</option>
            <option value="important">{SEVERITY_LABELS.important}</option>
          </select>

          <div role="group" aria-label="Filter by answer status" className="flex flex-wrap gap-1">
            {SHOW_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setShowFilter(f.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  showFilter === f.value
                    ? "border-transparent bg-accent text-accent-ink"
                    : "border-line bg-surface text-ink2 hover:bg-surface2"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      {visibleRows.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-2 px-6 py-12 text-center">
          <h3 className="text-sm font-semibold">No controls match these filters</h3>
          <p className="max-w-md text-sm leading-6 text-ink2">
            {showFilter === "gaps"
              ? "No controls are currently answered No in this view — that's good news."
              : showFilter === "missing_evidence"
                ? "Every Yes answer in this view has evidence attached."
                : "Try a different area, severity, or status filter."}
          </p>
          <button
            type="button"
            className="btn mt-2"
            onClick={() => {
              setDomainFilter("all");
              setSeverityFilter("all");
              setShowFilter("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-10">
          {visibleDomains.map((domain, di) => {
            const domainRows = visibleRows.filter((r) => r.domain === domain.name);
            const domainAnswered = domainRows.filter((r) => r.answer !== "not_answered").length;
            const prev = di > 0 ? visibleDomains[di - 1] : null;
            const next = di < visibleDomains.length - 1 ? visibleDomains[di + 1] : null;
            return (
              <section key={domain.name} id={`domain-${domain.order}`} aria-label={domain.name}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">{domain.name}</h2>
                    {domainBlurbs[domain.name] ? (
                      <p className="mt-0.5 text-sm text-ink2">{domainBlurbs[domain.name]}</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-ink3">
                    {domainAnswered}/{domainRows.length} answered
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {domainRows.map((row) => (
                    <ControlCard
                      key={row.answerId}
                      row={row}
                      expanded={expandedId === row.answerId}
                      onToggleExpand={() =>
                        setExpandedId((cur) => (cur === row.answerId ? null : row.answerId))
                      }
                      onPatch={queuePatch}
                      onEvidenceChange={setEvidence}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {prev ? (
                    <a href={`#domain-${prev.order}`} className="btn !py-1.5 !text-xs">
                      ← {prev.name}
                    </a>
                  ) : (
                    <span />
                  )}
                  {next ? (
                    <a href={`#domain-${next.order}`} className="btn !py-1.5 !text-xs">
                      {next.name} →
                    </a>
                  ) : (
                    <Link
                      href={`/assessments/${assessment.id}`}
                      className="btn btn-primary !py-1.5 !text-xs"
                    >
                      Finish — view dashboard
                    </Link>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
