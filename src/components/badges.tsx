// The Iltzam tag system. Rectangular, quiet, systematic: severity anchors on
// a vertical risk bar, regimes read as statute references, statuses pair a
// dot with an explicit label (state is never conveyed by colour alone).

import type {
  AnswerValue,
  AssessmentStatus,
  RemediationStatus,
  Severity,
} from "@/lib/types";
import {
  ASSESSMENT_STATUS_LABELS,
  REMEDIATION_STATUS_LABELS,
} from "@/lib/types";
import type { GapTier } from "@/lib/gaps";

function RiskBar({ className }: { className: string }) {
  return <span aria-hidden className={`h-3 w-[3px] rounded-full ${className}`} />;
}

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${className}`} />;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === "legally_mandatory") {
    return (
      <span className="tag border border-crit/25 bg-crit/[0.06] text-crit-text">
        <RiskBar className="bg-crit" />
        Legally mandatory
      </span>
    );
  }
  return (
    <span className="tag border border-warn/30 bg-warn/[0.07] text-warn-text">
      <RiskBar className="bg-warn" />
      Important
    </span>
  );
}

export function RegimeBadge({ code, provisional }: { code: string; provisional?: boolean }) {
  return (
    <span
      className="tag tag-outline font-mono text-[10.5px] tracking-wide"
      title={
        provisional
          ? `${code} mapping is provisional pending legal confirmation`
          : `Mapped to ${code}`
      }
    >
      {code}
      {provisional ? <span className="text-gold-text">*</span> : null}
    </span>
  );
}

/** Client-facing answer state (distinct from the Yes/No selector labels). */
export const ANSWER_STATE_LABELS: Record<AnswerValue, string> = {
  yes: "Answered Yes",
  no: "Marked as gap",
  not_answered: "Decision pending",
  not_applicable: "Not applicable",
};

const ANSWER_STYLES: Record<AnswerValue, { chip: string; dot: string }> = {
  yes: { chip: "border border-good/25 bg-good/[0.07] text-good-text", dot: "bg-good" },
  no: { chip: "border border-crit/25 bg-crit/[0.06] text-crit-text", dot: "bg-crit" },
  not_answered: { chip: "tag-outline", dot: "bg-ink3" },
  not_applicable: { chip: "tag-outline opacity-80", dot: "bg-line2" },
};

export function AnswerBadge({ answer }: { answer: AnswerValue }) {
  const s = ANSWER_STYLES[answer];
  return (
    <span className={`tag ${s.chip}`}>
      <Dot className={s.dot} />
      {ANSWER_STATE_LABELS[answer]}
    </span>
  );
}

export function EvidenceBadge({
  count,
  required,
}: {
  count: number;
  /** Whether this control still expects evidence for a Yes to stand in audit. */
  required: boolean;
}) {
  if (count > 0) {
    return (
      <span className="tag border border-good/25 bg-good/[0.07] text-good-text">
        <Dot className="bg-good" />
        Evidence collected · {count}
      </span>
    );
  }
  if (required) {
    return (
      <span className="tag border border-warn/30 bg-warn/[0.07] text-warn-text">
        <Dot className="bg-warn" />
        Evidence required
      </span>
    );
  }
  return (
    <span className="tag tag-outline">
      <Dot className="bg-line2" />
      No evidence expected
    </span>
  );
}

const REMEDIATION_STYLES: Record<RemediationStatus, string> = {
  not_started: "tag-outline",
  in_progress: "border border-accent/30 bg-accent/[0.07] text-accent-strong",
  evidence_needed: "border border-warn/30 bg-warn/[0.07] text-warn-text",
  ready_for_review: "border border-accent/30 bg-accent/[0.07] text-accent-strong",
  closed: "border border-good/25 bg-good/[0.07] text-good-text",
};

export function RemediationBadge({ status }: { status: RemediationStatus }) {
  return (
    <span className={`tag ${REMEDIATION_STYLES[status]}`}>
      {REMEDIATION_STATUS_LABELS[status]}
    </span>
  );
}

const ASSESSMENT_STATUS_STYLES: Record<AssessmentStatus, { chip: string; dot: string }> = {
  not_started: { chip: "tag-outline", dot: "bg-ink3" },
  in_progress: { chip: "border border-accent/30 bg-accent/[0.07] text-accent-strong", dot: "bg-accent" },
  completed: { chip: "border border-good/25 bg-good/[0.07] text-good-text", dot: "bg-good" },
  needs_review: { chip: "border border-warn/30 bg-warn/[0.07] text-warn-text", dot: "bg-warn" },
};

export function AssessmentStatusBadge({ status }: { status: AssessmentStatus }) {
  const s = ASSESSMENT_STATUS_STYLES[status];
  return (
    <span className={`tag ${s.chip}`}>
      <Dot className={s.dot} />
      {ASSESSMENT_STATUS_LABELS[status]}
    </span>
  );
}

/** Gap priority, in management language. Tier 1 is the only solid chip. */
const TIER_STYLES: Record<GapTier, { label: string; chip: string }> = {
  1: { label: "Critical", chip: "bg-crit text-white" },
  2: { label: "High", chip: "border border-crit/30 bg-crit/[0.06] text-crit-text" },
  3: { label: "Medium", chip: "border border-warn/35 bg-warn/[0.08] text-warn-text" },
  4: { label: "Low", chip: "tag-outline" },
  5: { label: "Evidence required", chip: "border border-gold/40 bg-gold/[0.08] text-gold-text" },
};

export function TierBadge({ tier }: { tier: GapTier }) {
  const s = TIER_STYLES[tier];
  return <span className={`tag ${s.chip}`}>{s.label}</span>;
}
