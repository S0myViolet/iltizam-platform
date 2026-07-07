"use client";

// A control record — the questionnaire's unit of work. The record reads top
// to bottom like an audit entry: reference line (code · regimes · state),
// the question, why it matters, then the decision input and a status ledger
// (owner / evidence / review). Severity anchors the left rail; the record's
// state changes its treatment — a No earns the gap rail and wash, a
// complete Yes earns the settled rail.

import { useId } from "react";
import type { AnswerRow, EvidenceItem } from "@/lib/assessments";
import type { AnswerValue } from "@/lib/types";
import { REMEDIATION_STATUSES, REMEDIATION_STATUS_LABELS } from "@/lib/types";
import { AnswerBadge, SeverityBadge } from "@/components/badges";
import { formatDate, toDateInputValue } from "@/lib/format";
import type { AnswerPatch } from "./Questionnaire";
import { EvidencePanel } from "./EvidencePanel";

const DECISIONS: { value: AnswerValue; label: string; glyph: string; activeClass: string }[] = [
  { value: "yes", label: "Yes", glyph: "✓", activeClass: "border-good/60 bg-good/10 text-good-text" },
  { value: "no", label: "No", glyph: "✕", activeClass: "border-crit/60 bg-crit/10 text-crit-text" },
  { value: "not_applicable", label: "Not applicable", glyph: "—", activeClass: "border-brand bg-brand text-brand-ink" },
  { value: "not_answered", label: "Not answered", glyph: "○", activeClass: "border-dashed border-line2 bg-surface2 text-ink" },
];

function LedgerItem({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warn" | "good" }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">{label}</dt>
      <dd
        className={`mt-0.5 truncate text-[13px] font-medium ${
          tone === "warn" ? "text-warn-text" : tone === "good" ? "text-good-text" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function ControlCard({
  row,
  expanded,
  onToggleExpand,
  onPatch,
  onEvidenceChange,
  variant = "card",
}: {
  row: AnswerRow;
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (answerId: string, patch: AnswerPatch, options?: { debounce?: number }) => void;
  onEvidenceChange: (answerId: string, updater: (prev: EvidenceItem[]) => EvidenceItem[]) => void;
  /** "card" = full decision card; "row" = compact register row until expanded. */
  variant?: "card" | "row";
}) {
  const detailId = useId();
  const mandatory = row.severity === "legally_mandatory";
  const isGap = row.answer === "no";
  const evidenceRequired = row.answer === "yes" && row.requiresEvidence && row.evidence.length === 0;
  const settled = row.answer === "yes" && !evidenceRequired;

  const railClass = isGap
    ? "border-l-crit"
    : settled
      ? "border-l-good/60"
      : mandatory
        ? "border-l-crit/45"
        : "border-l-warn/55";

  const evidenceValue =
    row.evidence.length > 0
      ? `${row.evidence.length} item${row.evidence.length === 1 ? "" : "s"} attached`
      : evidenceRequired
        ? "Evidence required"
        : row.answer === "yes"
          ? "Not required"
          : "None attached";

  // Register density: a scannable ledger row until opened.
  if (variant === "row" && !expanded) {
    return (
      <article className={`record ${railClass} ${isGap ? "bg-crit/[0.025]" : ""}`}>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={false}
          aria-controls={detailId}
          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 px-3.5 py-2.5 text-left transition-colors hover:bg-surface2/50 sm:grid-cols-[64px_minmax(0,1fr)_130px_minmax(90px,150px)_120px_16px]"
        >
          <span className="font-mono text-[11px] font-bold tracking-wide text-ink max-sm:order-1">
            {row.controlCode}
          </span>
          <span className="col-span-2 truncate text-[13.5px] font-medium text-ink sm:col-span-1">
            {row.question}
          </span>
          <span className="max-sm:order-2 max-sm:justify-self-end">
            <AnswerBadge answer={row.answer} />
          </span>
          <span className={`hidden truncate text-[12px] sm:block ${row.ownerName ? "text-ink2" : "text-warn-text"}`}>
            {row.ownerName ?? "Owner unassigned"}
          </span>
          <span
            className={`hidden truncate text-[12px] sm:block ${
              evidenceRequired ? "text-warn-text" : row.evidence.length > 0 ? "text-good-text" : "text-ink3"
            }`}
          >
            {evidenceValue}
          </span>
          <span aria-hidden className="hidden text-ink3 sm:block">
            ↓
          </span>
        </button>
      </article>
    );
  }

  return (
    <article
      className={`record overflow-hidden ${railClass} ${isGap ? "bg-crit/[0.025]" : ""} ${
        expanded ? "shadow-[var(--shadow-sheet)]" : ""
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Reference line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-mono text-[11.5px] font-bold tracking-wide text-ink">
            {row.controlCode}
          </span>
          <SeverityBadge severity={row.severity} />
          <span className="font-mono text-[10.5px] tracking-wide text-ink3">
            {row.sourceRegulationCode} · {row.legalBasis}
          </span>
          {row.provisional ? (
            <span className="tag border border-gold/40 bg-gold/[0.08] text-gold-text">
              Provisional control
            </span>
          ) : null}
          <span className="ml-auto">
            <AnswerBadge answer={row.answer} />
          </span>
        </div>

        <h3 className="mt-3 max-w-3xl text-[16px] leading-6 font-semibold text-ink">
          {row.question}
        </h3>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-ink2">{row.whyItMatters}</p>

        {/* Decision input */}
        <div
          role="group"
          aria-label={`Decision for ${row.controlCode}`}
          className="mt-4 flex flex-wrap gap-1.5"
        >
          {DECISIONS.map((d) => {
            const active = row.answer === d.value;
            return (
              <button
                key={d.value}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (!active) onPatch(row.answerId, { answer: d.value });
                }}
                className={`decision ${active ? d.activeClass : "decision-idle"}`}
              >
                <span aria-hidden className={active ? "" : "text-ink3"}>
                  {d.glyph}
                </span>
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Status ledger */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-t border-line pt-3.5">
          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 sm:gap-x-10 lg:max-w-lg">
            <LedgerItem
              label="Owner"
              value={row.ownerName ?? "Owner unassigned"}
              tone={row.ownerName ? "default" : "warn"}
            />
            <LedgerItem
              label="Evidence"
              value={evidenceValue}
              tone={evidenceRequired ? "warn" : row.evidence.length > 0 ? "good" : "default"}
            />
            <LedgerItem
              label="Review"
              value={
                row.dueDate
                  ? `${REMEDIATION_STATUS_LABELS[row.remediationStatus]} · due ${formatDate(row.dueDate)}`
                  : REMEDIATION_STATUS_LABELS[row.remediationStatus]
              }
            />
          </dl>
          <button
            type="button"
            className="text-[13px] font-semibold whitespace-nowrap text-accent-strong hover:underline"
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={onToggleExpand}
          >
            {expanded ? "Close record ↑" : "Review control record ↓"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div id={detailId} className="border-t border-line bg-surface2/50 p-4 sm:p-6">
          <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
            {/* The requirement */}
            <div className="flex flex-col gap-5">
              <div className="panel !border-t-gold/40">
                <p className="eyebrow text-gold-text">The requirement</p>
                <p className="mt-3 text-sm leading-6 text-ink">{row.description}</p>
                <p className="mt-2 text-xs text-ink3">
                  {row.sourceReference}
                  {row.provisional
                    ? " · Provisional control — client-facing wording requires legal sign-off"
                    : ""}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-wide text-ink2">
                  Recommended next action
                </h4>
                <p className="mt-1 text-sm leading-6">{row.recommendedAction}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold tracking-wide text-ink2">
                  Evidence that supports this control
                </h4>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {row.evidenceExamples.map((ex) => (
                    <li key={ex} className="tag tag-outline">
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Your response */}
            <div className="flex flex-col gap-4">
              <div className="panel !border-t-gold/40">
                <p className="eyebrow text-gold-text">Your response</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${detailId}-owner`} className="field-label">
                    Remediation owner
                  </label>
                  <input
                    id={`${detailId}-owner`}
                    className="input"
                    placeholder="Who owns this control?"
                    defaultValue={row.ownerName ?? ""}
                    onChange={(e) =>
                      onPatch(row.answerId, { ownerName: e.target.value }, { debounce: 600 })
                    }
                  />
                </div>
                <div>
                  <label htmlFor={`${detailId}-owner-email`} className="field-label">
                    Owner email
                  </label>
                  <input
                    id={`${detailId}-owner-email`}
                    type="email"
                    className="input"
                    placeholder="name@company.com"
                    defaultValue={row.ownerEmail ?? ""}
                    onChange={(e) =>
                      onPatch(row.answerId, { ownerEmail: e.target.value }, { debounce: 600 })
                    }
                  />
                </div>
                <div>
                  <label htmlFor={`${detailId}-due`} className="field-label">
                    Due date
                  </label>
                  <input
                    id={`${detailId}-due`}
                    type="date"
                    className="input"
                    defaultValue={toDateInputValue(row.dueDate)}
                    onChange={(e) => onPatch(row.answerId, { dueDate: e.target.value || null })}
                  />
                </div>
                <div>
                  <label htmlFor={`${detailId}-remediation`} className="field-label">
                    Remediation status
                  </label>
                  <select
                    id={`${detailId}-remediation`}
                    className="input"
                    value={row.remediationStatus}
                    onChange={(e) => onPatch(row.answerId, { remediationStatus: e.target.value })}
                  >
                    {REMEDIATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {REMEDIATION_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={`${detailId}-notes`} className="field-label">
                  Notes for the audit trail
                </label>
                <textarea
                  id={`${detailId}-notes`}
                  className="input min-h-20 resize-y"
                  placeholder="Context, decisions, links to internal documents…"
                  defaultValue={row.notes ?? ""}
                  onChange={(e) =>
                    onPatch(row.answerId, { notes: e.target.value }, { debounce: 600 })
                  }
                />
              </div>

              <EvidencePanel
                answerId={row.answerId}
                evidence={row.evidence}
                onEvidenceChange={onEvidenceChange}
              />

              {row.lastReviewedAt ? (
                <p className="text-xs text-ink3">Last reviewed {formatDate(row.lastReviewedAt)}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
