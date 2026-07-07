"use client";

// The control review — the working surface of the assessment. Lives inside
// the workspace frame (sidebar = sections + work queues); this component
// owns the working state: a sticky progress rail, a domain strip, two
// densities (cards for deciding, register for scanning), and autosave.

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import type { AnswerRow, AssessmentSummary, EvidenceItem } from "@/lib/assessments";
import type { AnswerValue } from "@/lib/types";
import { gapTierFor } from "@/lib/gaps";
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

export const SHOW_FILTERS = [
  { value: "all", label: "All controls" },
  { value: "unanswered", label: "Decisions pending" },
  { value: "gaps", label: "Marked as gap" },
  { value: "missing_evidence", label: "Evidence required" },
  { value: "no_owner", label: "Owner unassigned" },
  { value: "overdue", label: "Overdue" },
] as const;
export type ShowFilter = (typeof SHOW_FILTERS)[number]["value"];

const SEVERITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "legally_mandatory", label: "Mandatory" },
  { value: "important", label: "Important" },
] as const;

function isOpenItem(row: AnswerRow): boolean {
  return (
    gapTierFor({
      severity: row.severity,
      answer: row.answer,
      evidenceCount: row.evidence.length,
      requiresEvidence: row.requiresEvidence,
    }) !== null
  );
}

function matchesShow(row: AnswerRow, show: ShowFilter): boolean {
  switch (show) {
    case "unanswered":
      return row.answer === "not_answered";
    case "gaps":
      return row.answer === "no";
    case "missing_evidence":
      return row.answer === "yes" && row.requiresEvidence && row.evidence.length === 0;
    case "no_owner":
      return isOpenItem(row) && !row.ownerName;
    case "overdue":
      return (
        !!row.dueDate &&
        row.remediationStatus !== "closed" &&
        new Date(row.dueDate).getTime() < Date.now()
      );
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
  const [density, setDensity] = useState<"cards" | "register">("cards");
  const listTopRef = useRef<HTMLDivElement>(null);

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

  // Regulation filter — only meaningful when the assessment spans several.
  const regulationCodes = useMemo(
    () => [...new Set(rows.map((r) => r.sourceRegulationCode))].sort(),
    [rows]
  );
  const [regulationFilter, setRegulationFilter] = useState<string>("all");

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
      timers.current.set(
        answerId,
        setTimeout(() => {
          timers.current.delete(answerId);
          void flush(answerId);
        }, options.debounce ?? 0)
      );
    },
    [flush]
  );

  const setEvidence = useCallback(
    (answerId: string, updater: (prev: EvidenceItem[]) => EvidenceItem[]) => {
      setRows((prev) =>
        prev.map((r) => (r.answerId === answerId ? { ...r, evidence: updater(r.evidence) } : r))
      );
    },
    []
  );

  // ── derived view ──────────────────────────────────────────────────────────
  const answeredCount = rows.filter((r) => r.answer !== "not_answered").length;
  const progress = rows.length === 0 ? 0 : Math.round((answeredCount / rows.length) * 100);

  const domainStats = useMemo(() => {
    const stats = new Map<string, { total: number; answered: number; gaps: number }>();
    for (const r of rows) {
      const s = stats.get(r.domain) ?? { total: 0, answered: 0, gaps: 0 };
      s.total += 1;
      if (r.answer !== "not_answered") s.answered += 1;
      if (r.answer === "no") s.gaps += 1;
      stats.set(r.domain, s);
    }
    return stats;
  }, [rows]);

  const visibleRows = rows.filter(
    (r) =>
      (domainFilter === "all" || r.domain === domainFilter) &&
      (severityFilter === "all" || r.severity === severityFilter) &&
      (regulationFilter === "all" || r.sourceRegulationCode === regulationFilter) &&
      matchesShow(r, showFilter)
  );
  const visibleDomains = domains.filter((d) => visibleRows.some((r) => r.domain === d.name));

  const activeDomainIndex = domains.findIndex((d) => d.name === domainFilter);
  const prevDomain = activeDomainIndex > 0 ? domains[activeDomainIndex - 1] : null;
  const nextDomain =
    activeDomainIndex >= 0 && activeDomainIndex < domains.length - 1
      ? domains[activeDomainIndex + 1]
      : null;

  function selectDomain(name: string) {
    setDomainFilter(name);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeShow = SHOW_FILTERS.find((f) => f.value === showFilter);
  const saveLabel = saveError
    ? `Couldn't save — ${saveError}`
    : saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "All changes saved"
        : "Progress saves automatically";

  return (
    <main ref={listTopRef} className="scroll-mt-24">
      {/* Section header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-4">
        <div>
          <h1 className="display text-2xl font-semibold tracking-tight">Control review</h1>
          <p className="mt-0.5 text-[13px] text-ink3">
            Decide each control, assign its owner, and build the evidence record as you go.
          </p>
        </div>
        <span
          aria-live="polite"
          className={`text-xs ${saveError ? "text-crit-text" : saveState === "saving" ? "text-ink2" : "text-ink3"}`}
        >
          {saveLabel}
        </span>
      </header>

      {/* Sticky working rail: progress, queue context, filters, density */}
      <div className="sticky top-16 z-30 -mx-2 border-b border-line bg-page/95 px-2 py-2.5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface2 sm:w-40">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs whitespace-nowrap text-ink2">
              <strong className="text-ink">{answeredCount}</strong>/{rows.length} decided ·{" "}
              <strong className="text-ink">{formatScore(readinessScore)}</strong>
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label htmlFor="queue-filter" className="sr-only">
              Work queue
            </label>
            <select
              id="queue-filter"
              className="input !w-auto !py-1.5 !text-xs"
              value={showFilter}
              onChange={(e) => setShowFilter(e.target.value as ShowFilter)}
            >
              {SHOW_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {regulationCodes.length > 1 ? (
              <div className="seg" role="group" aria-label="Filter by regulation">
                {["all", ...regulationCodes].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setRegulationFilter(code)}
                    aria-pressed={regulationFilter === code}
                    className={`seg-item ${regulationFilter === code ? "seg-item-active" : ""}`}
                  >
                    {code === "all" ? "All regulations" : code}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="seg" role="group" aria-label="Filter by legal weight">
              {SEVERITY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setSeverityFilter(f.value)}
                  aria-pressed={severityFilter === f.value}
                  className={`seg-item ${severityFilter === f.value ? "seg-item-active" : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="seg" role="group" aria-label="List density">
              {(["cards", "register"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  aria-pressed={density === d}
                  className={`seg-item ${density === d ? "seg-item-active" : ""}`}
                >
                  {d === "cards" ? "Cards" : "Register"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Domain strip */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Domains">
          <button
            type="button"
            onClick={() => selectDomain("all")}
            aria-pressed={domainFilter === "all"}
            className={`shrink-0 rounded-md px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
              domainFilter === "all" ? "bg-brand text-brand-ink" : "text-ink2 hover:bg-surface"
            }`}
          >
            All domains
          </button>
          {domains.map((d) => {
            const s = domainStats.get(d.name);
            const active = domainFilter === d.name;
            const complete = s && s.answered === s.total;
            return (
              <button
                key={d.name}
                type="button"
                onClick={() => selectDomain(d.name)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-brand text-brand-ink" : "text-ink2 hover:bg-surface"
                }`}
              >
                {d.name}
                <span
                  className={`text-[10.5px] tabular-nums ${
                    active ? "text-brand-muted" : complete ? "text-good-text" : "text-ink3"
                  }`}
                >
                  {complete ? "✓" : `${s?.answered}/${s?.total}`}
                </span>
                {s && s.gaps > 0 ? (
                  <span aria-label={`${s.gaps} gaps`} className="h-1.5 w-1.5 rounded-full bg-crit" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue context line */}
      {showFilter !== "all" || severityFilter !== "all" ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-ink2">
          <span>
            Working through <strong className="text-ink">{activeShow?.label.toLowerCase()}</strong>
            {severityFilter !== "all"
              ? ` · ${severityFilter === "legally_mandatory" ? "legally mandatory" : "important"} only`
              : ""}{" "}
            — {visibleRows.length} item{visibleRows.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="font-medium text-accent-strong hover:underline"
            onClick={() => {
              setShowFilter("all");
              setSeverityFilter("all");
            }}
          >
            Clear
          </button>
        </p>
      ) : null}

      {/* Control list */}
      {visibleRows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 border-y-2 border-line bg-surface2/40 px-6 py-14 text-center">
          <h3 className="display text-lg font-semibold">This queue is clear</h3>
          <p className="max-w-md text-sm leading-6 text-ink2">
            {showFilter === "gaps"
              ? "No controls are marked as gaps in this view — review evidence quality before treating the area as audit-ready."
              : showFilter === "missing_evidence"
                ? "Every Yes in this view has supporting evidence attached."
                : showFilter === "unanswered"
                  ? "Every control in this view has a decision recorded."
                  : showFilter === "no_owner"
                    ? "Every open item in this view has an accountable owner."
                    : showFilter === "overdue"
                      ? "Nothing in this view is past its due date."
                      : "No controls match this view. Clear the view or switch domain to continue the review."}
          </p>
          <button
            type="button"
            className="btn mt-3"
            onClick={() => {
              setDomainFilter("all");
              setSeverityFilter("all");
              setShowFilter("all");
            }}
          >
            Show all controls
          </button>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-10">
          {visibleDomains.map((domain) => {
            const domainRows = visibleRows.filter((r) => r.domain === domain.name);
            const s = domainStats.get(domain.name);
            return (
              <section
                key={domain.name}
                id={`domain-${domain.order}`}
                aria-label={domain.name}
                className="scroll-mt-40"
              >
                <div className="border-b-2 border-line pb-2.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="display text-[19px] font-semibold tracking-tight">
                      <span className="mr-2 text-line2">{String(domain.order).padStart(2, "0")}</span>
                      {domain.name}
                    </h2>
                    <span className="text-xs text-ink3 tabular-nums">
                      {s?.answered}/{s?.total} decided
                    </span>
                  </div>
                  {domainBlurbs[domain.name] ? (
                    <p className="mt-0.5 text-[13px] leading-6 text-ink2">
                      {domainBlurbs[domain.name]}
                    </p>
                  ) : null}
                </div>
                <div className={density === "cards" ? "mt-4 flex flex-col gap-4" : "mt-3 flex flex-col gap-1.5"}>
                  {domainRows.map((row) => (
                    <ControlCard
                      key={row.answerId}
                      row={row}
                      variant={density === "register" ? "row" : "card"}
                      expanded={expandedId === row.answerId}
                      onToggleExpand={() =>
                        setExpandedId((cur) => (cur === row.answerId ? null : row.answerId))
                      }
                      onPatch={queuePatch}
                      onEvidenceChange={setEvidence}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {domainFilter !== "all" ? (
            <div className="flex items-center justify-between border-t-2 border-line pt-4">
              {prevDomain ? (
                <button type="button" className="btn !py-1.5 !text-[13px]" onClick={() => selectDomain(prevDomain.name)}>
                  ← {prevDomain.name}
                </button>
              ) : (
                <span />
              )}
              {nextDomain ? (
                <button type="button" className="btn btn-primary !py-1.5 !text-[13px]" onClick={() => selectDomain(nextDomain.name)}>
                  Next domain: {nextDomain.name} →
                </button>
              ) : (
                <Link href={`/assessments/${assessment.id}`} className="btn btn-primary !py-1.5 !text-[13px]">
                  Finish — open the dashboard
                </Link>
              )}
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
