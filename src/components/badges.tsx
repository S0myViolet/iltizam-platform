// Small labelled chips. Status colors always travel with a visible text label
// (never color alone), per the accessibility rules of the design method.

import type {
  AnswerValue,
  AssessmentStatus,
  RemediationStatus,
  Severity,
} from "@/lib/types";
import {
  ANSWER_LABELS,
  ASSESSMENT_STATUS_LABELS,
  REMEDIATION_STATUS_LABELS,
  SEVERITY_LABELS,
} from "@/lib/types";
import type { GapTier } from "@/lib/gaps";

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${className}`} />;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === "legally_mandatory") {
    return (
      <span className="badge bg-crit/10 text-crit-text">
        <Dot className="bg-crit" />
        {SEVERITY_LABELS.legally_mandatory}
      </span>
    );
  }
  return (
    <span className="badge bg-warn/15 text-warn-text">
      <Dot className="bg-warn" />
      {SEVERITY_LABELS.important}
    </span>
  );
}

export function RegimeBadge({ code, provisional }: { code: string; provisional?: boolean }) {
  return (
    <span
      className="badge border border-line bg-surface2 text-ink2"
      title={provisional ? `${code} mapping is provisional pending legal confirmation` : code}
    >
      {code}
      {provisional ? <span className="text-ink3">·&nbsp;provisional</span> : null}
    </span>
  );
}

const ANSWER_STYLES: Record<AnswerValue, { chip: string; dot: string }> = {
  yes: { chip: "bg-good/10 text-good-text", dot: "bg-good" },
  no: { chip: "bg-crit/10 text-crit-text", dot: "bg-crit" },
  not_answered: { chip: "bg-surface2 text-ink2 border border-line", dot: "bg-ink3" },
  not_applicable: { chip: "bg-surface2 text-ink3 border border-line", dot: "bg-line2" },
};

export function AnswerBadge({ answer }: { answer: AnswerValue }) {
  const s = ANSWER_STYLES[answer];
  return (
    <span className={`badge ${s.chip}`}>
      <Dot className={s.dot} />
      {ANSWER_LABELS[answer]}
    </span>
  );
}

const REMEDIATION_STYLES: Record<RemediationStatus, string> = {
  not_started: "bg-surface2 text-ink2 border border-line",
  in_progress: "bg-accent/10 text-accent-strong",
  evidence_needed: "bg-warn/15 text-warn-text",
  ready_for_review: "bg-accent/10 text-accent-strong",
  closed: "bg-good/10 text-good-text",
};

export function RemediationBadge({ status }: { status: RemediationStatus }) {
  return (
    <span className={`badge ${REMEDIATION_STYLES[status]}`}>
      {REMEDIATION_STATUS_LABELS[status]}
    </span>
  );
}

const ASSESSMENT_STATUS_STYLES: Record<AssessmentStatus, string> = {
  not_started: "bg-surface2 text-ink2 border border-line",
  in_progress: "bg-accent/10 text-accent-strong",
  completed: "bg-good/10 text-good-text",
  needs_review: "bg-warn/15 text-warn-text",
};

export function AssessmentStatusBadge({ status }: { status: AssessmentStatus }) {
  return (
    <span className={`badge ${ASSESSMENT_STATUS_STYLES[status]}`}>
      {ASSESSMENT_STATUS_LABELS[status]}
    </span>
  );
}

const TIER_STYLES: Record<GapTier, { label: string; chip: string }> = {
  1: { label: "Priority 1", chip: "bg-crit text-white" },
  2: { label: "Priority 2", chip: "bg-crit/10 text-crit-text" },
  3: { label: "Priority 3", chip: "bg-warn/20 text-warn-text" },
  4: { label: "Priority 4", chip: "bg-warn/10 text-warn-text" },
  5: { label: "Priority 5", chip: "bg-surface2 text-ink2 border border-line" },
};

export function TierBadge({ tier }: { tier: GapTier }) {
  const s = TIER_STYLES[tier];
  return <span className={`badge ${s.chip}`}>{s.label}</span>;
}
