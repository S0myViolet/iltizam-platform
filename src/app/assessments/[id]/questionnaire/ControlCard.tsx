"use client";

// One control inside the questionnaire. The collapsed card carries the
// question + answer selector; expanding it opens the control detail drawer
// (guidance, notes, owner, due date, remediation status, evidence).

import { useId } from "react";
import type { AnswerRow, EvidenceItem } from "@/lib/assessments";
import type { AnswerValue } from "@/lib/types";
import { ANSWER_LABELS, REMEDIATION_STATUSES, REMEDIATION_STATUS_LABELS } from "@/lib/types";
import { RegimeBadge, SeverityBadge } from "@/components/badges";
import { formatDate, toDateInputValue } from "@/lib/format";
import type { AnswerPatch } from "./Questionnaire";
import { EvidencePanel } from "./EvidencePanel";

const ANSWER_OPTIONS: { value: AnswerValue; activeClass: string }[] = [
  { value: "yes", activeClass: "bg-good/10 text-good-text border-good/40" },
  { value: "no", activeClass: "bg-crit/10 text-crit-text border-crit/40" },
  { value: "not_applicable", activeClass: "bg-surface2 text-ink border-line2" },
  { value: "not_answered", activeClass: "bg-surface2 text-ink border-line2" },
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
  const missingEvidence =
    row.answer === "yes" && row.requiresEvidence && row.evidence.length === 0;

  return (
    <article
      className={`card overflow-hidden border-l-4 ${
        mandatory ? "border-l-crit/60" : "border-l-warn/60"
      }`}
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
          {missingEvidence ? (
            <span className="badge bg-warn/15 text-warn-text">Evidence needed</span>
          ) : null}
        </div>

        <p className="mt-2.5 text-[15px] font-medium leading-6 text-ink">{row.question}</p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={`Answer for ${row.controlCode}`} className="flex flex-wrap gap-1.5">
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
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? opt.activeClass
                      : "border-line bg-surface text-ink2 hover:bg-surface2"
                  }`}
                >
                  {ANSWER_LABELS[opt.value]}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-ink3">
            {row.ownerName ? <span>Owner: {row.ownerName}</span> : null}
            {row.dueDate ? <span>Due {formatDate(row.dueDate)}</span> : null}
            {row.evidence.length > 0 ? (
              <span>
                {row.evidence.length} evidence item{row.evidence.length === 1 ? "" : "s"}
              </span>
            ) : null}
            <button
              type="button"
              className="btn !px-3 !py-1 !text-xs"
              aria-expanded={expanded}
              aria-controls={detailId}
              onClick={onToggleExpand}
            >
              {expanded ? "Close details" : "Details"}
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div id={detailId} className="border-t border-line bg-surface2/50 p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Guidance */}
            <div className="flex flex-col gap-4">
              <section>
                <h4 className="text-xs font-semibold tracking-wide text-ink2">Why this matters</h4>
                <p className="mt-1 text-sm leading-6 text-ink">{row.whyItMatters}</p>
              </section>
              <section>
                <h4 className="text-xs font-semibold tracking-wide text-ink2">
                  Recommended next step
                </h4>
                <p className="mt-1 text-sm leading-6 text-ink">{row.recommendedAction}</p>
              </section>
              <section>
                <h4 className="text-xs font-semibold tracking-wide text-ink2">Evidence needed</h4>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {row.evidenceExamples.map((ex) => (
                    <li key={ex} className="badge border border-line bg-surface text-ink2">
                      {ex}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h4 className="text-xs font-semibold tracking-wide text-ink2">
                  What the law expects
                </h4>
                <p className="mt-1 text-sm leading-6 text-ink2">{row.description}</p>
                <p className="mt-1.5 text-xs text-ink3">
                  Source: {row.sourceReference}
                  {row.regimes.some((m) => m.provisional)
                    ? " · PDPL mapping provisional pending legal confirmation"
                    : ""}
                </p>
              </section>
            </div>

            {/* Workflow fields */}
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${detailId}-owner`} className="field-label">
                    Owner
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
                  Notes
                </label>
                <textarea
                  id={`${detailId}-notes`}
                  className="input min-h-20 resize-y"
                  placeholder="Context, decisions, links to internal docs…"
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
