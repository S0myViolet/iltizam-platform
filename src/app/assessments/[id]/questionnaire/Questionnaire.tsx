"use client";

// The guided control review workspace: a domain stepper on the left, the
// control review feed on the right, autosave throughout. Filters are part of
// the stepper — reviewing an area and navigating to it are the same gesture.

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import type { AnswerRow, AssessmentSummary, EvidenceItem } from "@/lib/assessments";
import type { AnswerValue } from "@/lib/types";
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
  { value: "all", label: "Full control library" },
  { value: "unanswered", label: "Decision pending" },
  { value: "gaps", label: "Marked as gap" },
  { value: "missing_evidence", label: "Evidence required" },
] as const;
type ShowFilter = (typeof SHOW_FILTERS)[number]["value"];

const SEVERITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "legally_mandatory", label: "Mandatory" },
  { value: "important", label: "Important" },
] as const;

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

  const saveLabel = saveError
    ? `Couldn't save — ${saveError}`
    : saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "All changes saved"
        : "Progress saves automatically";

  return (
    <main className="pb-16">
      {/* ── Band header ────────────────────────────────────────────────────── */}
      <div className="band">
        <div className="shell pt-6 pb-10 sm:pt-8">
          <div className="mb-4 text-[13px] text-brand-muted">
            <Link href="/" className="hover:text-brand-ink">
              Assessments
            </Link>
            <span aria-hidden> › </span>
            <Link href={`/assessments/${assessment.id}`} className="hover:text-brand-ink">
              {assessment.companyName}
            </Link>
            <span aria-hidden> › </span>
            <span className="text-brand-ink">Control review</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-gold-bright">Control review</p>
              <h1 className="display mt-2 text-[26px] leading-tight font-semibold sm:text-3xl">
                Review your control position
              </h1>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-brand-muted">
                Decide each control, assign its owner, and build the evidence record as you go.
              </p>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Link href={`/assessments/${assessment.id}/gaps`} className="btn btn-on-band !py-1.5 !text-[13px]">
                Gap analysis
              </Link>
              <Link href={`/assessments/${assessment.id}`} className="btn btn-gold-on-band !py-1.5 !text-[13px]">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky progress rail ───────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 border-b border-line bg-page/95 backdrop-blur">
        <div className="shell flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface2 sm:w-48">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs whitespace-nowrap text-ink2">
              <strong className="text-ink">{answeredCount}</strong> of {rows.length} answered ·
              readiness <strong className="text-ink">{formatScore(readinessScore)}</strong>
            </span>
          </div>
          <span
            aria-live="polite"
            className={`text-xs ${saveError ? "text-crit-text" : saveState === "saving" ? "text-ink2" : "text-ink3"}`}
          >
            {saveLabel}
          </span>
        </div>
      </div>

      <div ref={listTopRef} className="shell scroll-mt-32 pt-8">
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[270px_minmax(0,1fr)]">
          {/* ── Domain stepper / filters ─────────────────────────────────────── */}
          <aside className="min-w-0 lg:sticky lg:top-32 lg:max-h-[calc(100vh-9.5rem)] lg:self-start lg:overflow-y-auto lg:pb-6">
            <nav aria-label="Assessment domains">
              <p className="eyebrow text-gold-text">Domains</p>
              <ul className="mt-3 flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
                <li className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => selectDomain("all")}
                    aria-current={domainFilter === "all" ? "true" : undefined}
                    className={`w-full rounded-md border-l-2 px-3 py-2 text-left text-[13px] font-semibold whitespace-nowrap transition-colors lg:whitespace-normal ${
                      domainFilter === "all"
                        ? "border-l-gold bg-surface text-ink shadow-[var(--shadow-card)]"
                        : "border-l-transparent text-ink2 hover:bg-surface hover:text-ink"
                    }`}
                  >
                    All domains
                  </button>
                </li>
                {domains.map((d) => {
                  const s = domainStats.get(d.name);
                  const active = domainFilter === d.name;
                  const complete = s && s.answered === s.total;
                  const pct = s && s.total > 0 ? (s.answered / s.total) * 100 : 0;
                  return (
                    <li key={d.name} className="w-56 shrink-0 lg:w-auto lg:shrink">
                      <button
                        type="button"
                        onClick={() => selectDomain(d.name)}
                        aria-current={active ? "true" : undefined}
                        className={`w-full rounded-md border-l-2 px-3 py-2 text-left transition-colors ${
                          active
                            ? "border-l-gold bg-surface shadow-[var(--shadow-card)]"
                            : "border-l-transparent hover:bg-surface"
                        }`}
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="font-mono text-[10px] font-semibold text-ink3">
                              {String(d.order).padStart(2, "0")}
                            </span>
                            <span
                              className={`truncate text-[13px] font-medium whitespace-nowrap lg:whitespace-normal ${
                                active ? "text-ink" : "text-ink2"
                              }`}
                            >
                              {d.name}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-[11px] tabular-nums ${
                              complete ? "text-good-text" : "text-ink3"
                            }`}
                          >
                            {complete ? "✓ " : ""}
                            {s?.answered}/{s?.total}
                          </span>
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <span className="h-[3px] w-full max-w-24 overflow-hidden rounded-full bg-surface2">
                            <span
                              className={`block h-full rounded-full ${complete ? "bg-good" : "bg-accent"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          {s && s.gaps > 0 ? (
                            <span className="flex items-center gap-1 text-[10.5px] font-medium text-crit-text">
                              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-crit" />
                              {s.gaps} gap{s.gaps === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-6 border-t-2 border-line pt-4">
              <p className="eyebrow text-gold-text">View</p>
              <div className="mt-3 flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
                {SHOW_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setShowFilter(f.value)}
                    aria-pressed={showFilter === f.value}
                    className={`rounded-lg px-3 py-1.5 text-left text-[13px] font-medium transition-colors ${
                      showFilter === f.value
                        ? "bg-accent/10 text-accent-strong"
                        : "text-ink2 hover:bg-surface2 hover:text-ink"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="seg mt-4" role="group" aria-label="Filter by legal weight">
                {SEVERITY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setSeverityFilter(f.value)}
                    aria-pressed={severityFilter === f.value}
                    className={`seg-item flex-1 ${severityFilter === f.value ? "seg-item-active" : ""}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Control feed ─────────────────────────────────────────────────── */}
          <div className="min-w-0">
            {visibleRows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 border-y-2 border-line bg-surface2/40 px-6 py-14 text-center">
                <h3 className="display text-lg font-semibold">Nothing matches this view</h3>
                <p className="max-w-md text-sm leading-6 text-ink2">
                  {showFilter === "gaps"
                    ? "No controls are marked as gaps in this view — review evidence quality before treating the area as audit-ready."
                    : showFilter === "missing_evidence"
                      ? "Every Yes in this view has supporting evidence attached."
                      : showFilter === "unanswered"
                        ? "Every control in this view has a decision recorded."
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
                  Show the full control library
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                {visibleDomains.map((domain) => {
                  const domainRows = visibleRows.filter((r) => r.domain === domain.name);
                  const s = domainStats.get(domain.name);
                  return (
                    <section
                      key={domain.name}
                      id={`domain-${domain.order}`}
                      aria-label={domain.name}
                      className="scroll-mt-36"
                    >
                      <div className="border-b-2 border-line pb-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h2 className="display text-[22px] font-semibold tracking-tight">
                            <span className="mr-2 text-line2">
                              {String(domain.order).padStart(2, "0")}
                            </span>
                            {domain.name}
                          </h2>
                          <span className="text-xs text-ink3 tabular-nums">
                            {s?.answered}/{s?.total} answered
                          </span>
                        </div>
                        {domainBlurbs[domain.name] ? (
                          <p className="mt-1 text-sm leading-6 text-ink2">
                            {domainBlurbs[domain.name]}
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-5 flex flex-col gap-4">
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
                    </section>
                  );
                })}

                {/* Prev / next area navigation when reviewing one area */}
                {domainFilter !== "all" ? (
                  <div className="flex items-center justify-between border-t-2 border-line pt-5">
                    {prevDomain ? (
                      <button type="button" className="btn" onClick={() => selectDomain(prevDomain.name)}>
                        ← {prevDomain.name}
                      </button>
                    ) : (
                      <span />
                    )}
                    {nextDomain ? (
                      <button type="button" className="btn btn-primary" onClick={() => selectDomain(nextDomain.name)}>
                        Next domain: {nextDomain.name} →
                      </button>
                    ) : (
                      <Link href={`/assessments/${assessment.id}`} className="btn btn-primary">
                        Finish — open the dashboard
                      </Link>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
