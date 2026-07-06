"use client";

// One control as a review item, not a survey row. Severity anchors the left
// rail, the question is the title, a one-line "why this matters" gives every
// control its meaning at a glance, and "Open control review" expands the
// full workspace: requirement on the left, your response on the right.

import { useId } from "react";
import type { AnswerRow, EvidenceItem } from "@/lib/assessments";
import type { AnswerValue } from "@/lib/types";
import { REMEDIATION_STATUSES, REMEDIATION_STATUS_LABELS } from "@/lib/types";
import { AnswerBadge, EvidenceBadge, RegimeBadge, SeverityBadge } from "@/components/badges";
import { formatDate, toDateInputValue } from "@/lib/format";
import type { AnswerPatch } from "./Questionnaire";
import { EvidencePanel } from "./EvidencePanel";

const ANSWER_OPTIONS: { value: AnswerValue; label: string; activeClass: string }[] = [
  { value: "yes", label: "Yes", activeClass: "!bg-good/10 !text-good-text" },
  { value: "no", label: "No", activeClass: "!bg-crit/10 !text-crit-text" },
  { value: "not_applicable", label: "Not applicable", activeClass: "!bg-brand !text-brand-ink" },
  { value: "not_answered", label: "Not answered", activeClass: "!bg-brand !text-brand-ink" },
];

export function ControlCard({
  row,
  expanded,
  onToggleExpand,
  onPatch,
  onEvidenceChange,
}: {
  row: AnswerRow;
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (answerId: string, patch: AnswerPatch, options?: { debounce?: number }) => void;
  onEvidenceChange: (answerId: string, updater: (prev: EvidenceItem[]) => EvidenceItem[]) => void;
}) {
  const detailId = useId();
  const mandatory = row.severity === "legally_mandatory";
  const isGap = row.answer === "no";

  return (
    <article
      className={`card overflow-hidden border-l-4 transition-shadow ${
        isGap ? "border-l-crit" : mandatory ? "border-l-crit/45" : "border-l-warn/55"
      } ${expanded ? "shadow-[var(--shadow-sheet)]" : ""}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] font-semibold tracking-wide text-ink3">
            {row.controlCode}
          </span>
          <SeverityBadge severity={row.severity} />
          {row.regimes.map((m) => (
            <RegimeBadge key={m.code} code={m.code} provisional={m.provisional} />
          ))}
          <span className="ml-auto flex items-center gap-1.5">
            <AnswerBadge answer={row.answer} />
          </span>
        </div>

        <h3 className="mt-3 max-w-3xl text-[16px] font-semibold leading-6 text-ink">
          {row.question}
        </h3>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-ink2">{row.whyItMatters}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div
            role="group"
            aria-label={`Answer for ${row.controlCode}`}
            className="seg"
          >
            {ANSWER_OPTIONS.map((opt) => {
              const active = row.answer === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (!active) onPatch(row.answerId, { answer: opt.value });
                  }}
                  className={`seg-item !py-2 ${active ? `seg-item-active ${opt.activeClass}` : ""}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <EvidenceBadge
              count={row.evidence.length}
              required={row.answer === "yes" && row.requiresEvidence}
            />
            <span className="text-xs text-ink3">
              {row.ownerName ? `Owner: ${row.ownerName}` : "No owner"}
              {row.dueDate ? ` · Due ${formatDate(row.dueDate)}` : ""}
            </span>
            <button
              type="button"
              className="text-[13px] font-semibold text-accent-strong hover:underline"
              aria-expanded={expanded}
              aria-controls={detailId}
              onClick={onToggleExpand}
            >
              {expanded ? "Close review" : "Open control review"}
              <span aria-hidden className="ml-1">
                {expanded ? "↑" : "↓"}
              </span>
            </button>
          </div>
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
                  {row.regimes.some((m) => m.provisional)
                    ? " · PDPL mapping provisional — requires legal review"
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
