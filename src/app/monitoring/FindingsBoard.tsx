"use client";

// The findings board: a filterable register of automated findings, each row
// opening a right-side review drawer. The drawer shows the full record —
// rule block, source resource, control mappings with legal bases, and a
// lineage trace from connector to audit trail — plus the human review
// actions that are the only way a finding can affect the official position.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUDIT_ORIGIN_LABELS,
  FINDING_STATUSES,
  FINDING_STATUS_LABELS,
  FINDING_REVIEW_NOTICE,
  EVIDENCE_TYPE_LABELS,
  isEvidenceType,
  type FindingSeverity,
  type FindingStatus,
} from "@/lib/types";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

// ─── Row shape handed over by the server page ───────────────────────────────

export interface FindingRow {
  id: string;
  title: string;
  severity: FindingSeverity;
  status: FindingStatus;
  ruleCode: string;
  ruleVersion: number;
  isEvidenceCandidate: boolean;
  connectorName: string | null;
  resourceName: string | null;
  detectedAt: string;
  controlCodes: string[];
}

// ─── Detail payload from GET /api/findings/{id} ─────────────────────────────

interface DetailControlMapping {
  id: string;
  mappingReason: string;
  control: {
    controlCode: string;
    question: string;
    domain: { name: string };
    regulationMappings: {
      id: string;
      legalBasis: string | null;
      regulation: { code: string };
    }[];
  };
}

interface FindingDetail {
  finding: {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: FindingStatus;
    ruleCode: string;
    ruleVersion: number;
    isEvidenceCandidate: boolean;
    suggestedEvidenceType: string | null;
    detectedAt: string;
    reviewedAt: string | null;
    reviewedByName: string | null;
    assignedOwnerName: string | null;
    resolutionNotes: string | null;
    rule: {
      code: string;
      version: number;
      name: string;
      description: string;
      category: string;
      conditionConfiguration: string;
      recommendedAction: string;
    };
    connector: { displayName: string; provider: string } | null;
    resource: {
      name: string;
      location: string | null;
      sharingStatus: string | null;
      externalId: string;
    } | null;
    controlMappings: DetailControlMapping[];
  };
  inventoryItem: { id: string; name: string; createdAt: string } | null;
  auditTrail: { id: string; createdAt: string; origin: string; summary: string }[];
}

// ─── Presentation maps ──────────────────────────────────────────────────────

const SEVERITY_RAIL: Record<FindingSeverity, string> = {
  high: "border-l-crit",
  medium: "border-l-warn",
  low: "border-l-line2",
  info: "border-l-line",
};

const SEVERITY_TAG: Record<FindingSeverity, { label: string; chip: string; bar: string }> = {
  high: {
    label: "High",
    chip: "border border-crit/25 bg-crit/[0.06] text-crit-text",
    bar: "bg-crit",
  },
  medium: {
    label: "Medium",
    chip: "border border-warn/30 bg-warn/[0.07] text-warn-text",
    bar: "bg-warn",
  },
  low: { label: "Low", chip: "tag-outline", bar: "bg-line2" },
  info: { label: "Info", chip: "tag-outline opacity-80", bar: "bg-line2" },
};

const STATUS_TAG: Record<FindingStatus, { chip: string; dot: string }> = {
  new: { chip: "border border-gold/40 bg-gold/[0.08] text-gold-text", dot: "bg-gold" },
  under_review: {
    chip: "border border-accent/30 bg-accent/[0.07] text-accent-strong",
    dot: "bg-accent",
  },
  confirmed: { chip: "border border-crit/25 bg-crit/[0.06] text-crit-text", dot: "bg-crit" },
  dismissed: { chip: "tag-outline opacity-80", dot: "bg-line2" },
  resolved: { chip: "border border-good/25 bg-good/[0.07] text-good-text", dot: "bg-good" },
};

/** Short tab labels — the tags carry the full official status wording. */
const STATUS_TAB_LABELS: Record<FindingStatus, string> = {
  new: "New",
  under_review: "Under review",
  confirmed: "Confirmed",
  dismissed: "Dismissed",
  resolved: "Resolved",
};

const ORIGIN_LABELS: Record<string, string> = AUDIT_ORIGIN_LABELS;

const SEVERITY_OPTIONS: { value: "all" | FindingSeverity; label: string }[] = [
  { value: "all", label: "All severities" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "info", label: "Info" },
];

// ─── Local helpers ──────────────────────────────────────────────────────────

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

// ─── Shared tag row (list rows + drawer header) ─────────────────────────────

function FindingTags({
  severity,
  status,
  ruleCode,
  ruleVersion,
  isEvidenceCandidate,
}: {
  severity: FindingSeverity;
  status: FindingStatus;
  ruleCode: string;
  ruleVersion: number;
  isEvidenceCandidate: boolean;
}) {
  const sev = SEVERITY_TAG[severity];
  const st = STATUS_TAG[status];
  return (
    <>
      <span className={`tag ${sev.chip}`}>
        <span aria-hidden className={`h-3 w-[3px] rounded-full ${sev.bar}`} />
        {sev.label}
      </span>
      <span className={`tag ${st.chip}`}>
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
        {FINDING_STATUS_LABELS[status]}
      </span>
      <span className="tag tag-outline font-mono tracking-wide">
        {ruleCode} v{ruleVersion}
      </span>
      {isEvidenceCandidate ? (
        <span className="tag border border-gold/40 bg-gold/[0.08] text-gold-text">
          Evidence candidate
        </span>
      ) : null}
    </>
  );
}

// ─── The board ──────────────────────────────────────────────────────────────

export function FindingsBoard({ rows, canReview }: { rows: FindingRow[]; canReview: boolean }) {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<"all" | FindingStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | FindingSeverity>("all");

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FindingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [owner, setOwner] = useState("");
  const initializedFor = useRef<string | null>(null);

  const statusCounts = useMemo(() => {
    const counts = new Map<FindingStatus, number>();
    for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    return counts;
  }, [rows]);

  const visibleRows = rows.filter(
    (r) =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (severityFilter === "all" || r.severity === severityFilter)
  );

  // ── Drawer plumbing ────────────────────────────────────────────────────────

  // Only the latest requested finding may update drawer state — a slow
  // response for a previously opened finding must never render (or be
  // acted on) after the reviewer has moved to another record.
  const detailRequest = useRef<string | null>(null);

  const loadDetail = useCallback(async (id: string) => {
    detailRequest.current = id;
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`/api/findings/${id}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not load the finding record.");
      }
      const data = (await res.json()) as FindingDetail;
      if (detailRequest.current !== id) return;
      setDetail(data);
    } catch (err) {
      if (detailRequest.current !== id) return;
      setDetailError(err instanceof Error ? err.message : "Could not load the finding record.");
    } finally {
      if (detailRequest.current === id) setDetailLoading(false);
    }
  }, []);

  function openFinding(id: string) {
    setOpenId(id);
    setDetail(null);
    setActionError(null);
    initializedFor.current = null;
    void loadDetail(id);
  }

  const closeDrawer = useCallback(() => {
    detailRequest.current = null;
    setOpenId(null);
    setDetail(null);
    setDetailError(null);
    setActionError(null);
  }, []);

  // Initialize the review form once per opened finding.
  useEffect(() => {
    if (detail && initializedFor.current !== detail.finding.id) {
      initializedFor.current = detail.finding.id;
      setNotes(detail.finding.resolutionNotes ?? "");
      setOwner(detail.finding.assignedOwnerName ?? "");
    }
  }, [detail]);

  // Escape closes; the page behind the drawer stops scrolling.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [openId, closeDrawer]);

  async function patchFinding(id: string, body: Record<string, unknown>) {
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/findings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "The review action could not be saved.");
      }
      await loadDetail(id);
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "The review action could not be saved.");
    } finally {
      setActionBusy(false);
    }
  }

  // ── Empty register ─────────────────────────────────────────────────────────

  if (rows.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          title="No findings on record"
          body="Run an automated scan from Backend operations to generate potential findings for review."
        />
      </div>
    );
  }

  const f = detail?.finding ?? null;
  const controlCodes = f ? f.controlMappings.map((m) => m.control.controlCode) : [];

  const lineageSteps: { label: string; value: string | null; mono?: boolean; held?: boolean }[] =
    f
      ? [
          { label: "Connector", value: `"${f.connector?.displayName ?? "Not recorded"}"` },
          { label: "Source resource discovered", value: f.resource?.name ?? "Not recorded" },
          {
            label: "Inventory item created",
            value: detail?.inventoryItem?.name ?? "Not recorded",
          },
          { label: "Rule triggered", value: `${f.ruleCode} v${f.ruleVersion}`, mono: true },
          { label: "Finding created", value: formatDateTime(f.detectedAt) },
          {
            label: "Control mapped",
            value: controlCodes.length > 0 ? controlCodes.join(", ") : "No control mappings",
            mono: controlCodes.length > 0,
          },
          { label: "Official score held pending human review", value: null, held: true },
          { label: "Audit events", value: `${detail?.auditTrail.length ?? 0} recorded` },
        ]
      : [];

  return (
    <section aria-label="Automated findings">
      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="seg max-w-full overflow-x-auto" role="group" aria-label="Filter by review status">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            aria-pressed={statusFilter === "all"}
            className={`seg-item whitespace-nowrap ${statusFilter === "all" ? "seg-item-active" : ""}`}
          >
            All · {rows.length}
          </button>
          {FINDING_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={`seg-item whitespace-nowrap ${statusFilter === s ? "seg-item-active" : ""}`}
            >
              {STATUS_TAB_LABELS[s]} · {statusCounts.get(s) ?? 0}
            </button>
          ))}
        </div>

        <label htmlFor="finding-severity-filter" className="sr-only">
          Filter by severity
        </label>
        <select
          id="finding-severity-filter"
          className="input ml-auto !w-auto !py-1.5 !text-xs"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as "all" | FindingSeverity)}
        >
          {SEVERITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Finding rows */}
      {visibleRows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 border-y-2 border-line bg-surface2/40 px-6 py-12 text-center">
          <h3 className="display text-lg font-semibold">No findings match this view</h3>
          <p className="max-w-md text-sm leading-6 text-ink2">
            Clear the filters to see every finding on record.
          </p>
          <button
            type="button"
            className="btn mt-3 !py-1.5 !text-[13px]"
            onClick={() => {
              setStatusFilter("all");
              setSeverityFilter("all");
            }}
          >
            Show all findings
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {visibleRows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openFinding(r.id)}
              className={`record ${SEVERITY_RAIL[r.severity]} w-full px-4 py-3.5 text-left transition-colors hover:bg-surface2/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <FindingTags
                  severity={r.severity}
                  status={r.status}
                  ruleCode={r.ruleCode}
                  ruleVersion={r.ruleVersion}
                  isEvidenceCandidate={r.isEvidenceCandidate}
                />
                <span className="ml-auto text-[11px] whitespace-nowrap text-ink3">
                  Detected {formatDate(r.detectedAt)}
                </span>
              </div>
              <h3 className="mt-2 text-[15px] leading-6 font-semibold">{r.title}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink3">
                <span>
                  Source: <span className="text-ink2">{r.resourceName ?? "Not recorded"}</span>
                </span>
                {r.connectorName ? (
                  <span>
                    Connector: <span className="text-ink2">{r.connectorName}</span>
                  </span>
                ) : null}
                {r.controlCodes.length > 0 ? (
                  <span className="font-mono text-[11px] tracking-wide text-ink2">
                    {r.controlCodes.join(" · ")}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Review drawer ─────────────────────────────────────────────────── */}
      {openId ? (
        <div className="fixed inset-0 z-50">
          <div
            aria-hidden
            className="absolute inset-0 bg-brand/50"
            onClick={closeDrawer}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Finding review"
            className="sheet fixed inset-y-0 right-0 w-full max-w-xl overflow-y-auto !rounded-none"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-5 py-3.5 backdrop-blur sm:px-6">
              <p className="eyebrow text-gold-text">Automated finding</p>
              <button type="button" className="btn !px-2.5 !py-1 !text-xs" onClick={closeDrawer}>
                Close
              </button>
            </div>

            {detailLoading && !detail ? (
              <p className="px-5 py-10 text-sm text-ink3 sm:px-6">Loading the finding record…</p>
            ) : detailError && !detail ? (
              <div className="px-5 py-10 sm:px-6">
                <p className="text-sm text-crit-text">{detailError}</p>
                <button
                  type="button"
                  className="btn mt-3 !py-1.5 !text-[13px]"
                  onClick={() => void loadDetail(openId)}
                >
                  Try again
                </button>
              </div>
            ) : f ? (
              <div className="px-5 py-5 sm:px-6">
                {/* Guardrail banner */}
                {f.status === "new" ? (
                  <p className="mb-4 rounded-md border border-gold/40 bg-gold/[0.08] px-3.5 py-2.5 text-[13px] font-medium text-gold-text">
                    {FINDING_REVIEW_NOTICE}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-1.5">
                  <FindingTags
                    severity={
                      (["high", "medium", "low", "info"].includes(f.severity)
                        ? f.severity
                        : "info") as FindingSeverity
                    }
                    status={f.status}
                    ruleCode={f.ruleCode}
                    ruleVersion={f.ruleVersion}
                    isEvidenceCandidate={f.isEvidenceCandidate}
                  />
                </div>

                <h2 className="display mt-3 text-xl leading-7 font-semibold tracking-tight">
                  {f.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink2">{f.description}</p>
                {f.isEvidenceCandidate && f.suggestedEvidenceType ? (
                  <p className="mt-1.5 text-xs text-ink3">
                    Suggested evidence type:{" "}
                    <span className="text-ink2">
                      {isEvidenceType(f.suggestedEvidenceType)
                        ? EVIDENCE_TYPE_LABELS[f.suggestedEvidenceType]
                        : humanize(f.suggestedEvidenceType)}
                    </span>
                  </p>
                ) : null}
                {f.reviewedByName && f.reviewedAt ? (
                  <p className="mt-2 text-xs text-ink3">
                    {f.status === "confirmed" ? "Confirmed" : "Last reviewed"} by{" "}
                    <span className="font-medium text-ink2">{f.reviewedByName}</span> on{" "}
                    {formatDateTime(f.reviewedAt)}
                  </p>
                ) : null}
                {f.assignedOwnerName ? (
                  <p className="mt-1 text-xs text-ink3">
                    Assigned owner: <span className="font-medium text-ink2">{f.assignedOwnerName}</span>
                  </p>
                ) : null}

                {/* Human review actions */}
                {canReview ? (
                  <section className="panel mt-5" aria-label="Human review">
                    <p className="eyebrow text-gold-text">Human review</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn !py-1.5 !text-[13px]"
                        disabled={actionBusy || f.status === "under_review"}
                        onClick={() => void patchFinding(f.id, { status: "under_review" })}
                      >
                        Mark under review
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary !py-1.5 !text-[13px]"
                        disabled={actionBusy || f.status === "confirmed"}
                        onClick={() => void patchFinding(f.id, { status: "confirmed" })}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="btn !py-1.5 !text-[13px]"
                        disabled={actionBusy || f.status === "dismissed"}
                        onClick={() => void patchFinding(f.id, { status: "dismissed" })}
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        className="btn !py-1.5 !text-[13px]"
                        disabled={actionBusy || f.status === "resolved"}
                        onClick={() => void patchFinding(f.id, { status: "resolved" })}
                      >
                        Resolve
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div>
                        <label htmlFor="finding-owner" className="field-label">
                          Assigned owner
                        </label>
                        <input
                          id="finding-owner"
                          type="text"
                          className="input"
                          placeholder="Who is accountable for this finding?"
                          value={owner}
                          onChange={(e) => setOwner(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="finding-notes" className="field-label">
                          Resolution notes
                        </label>
                        <textarea
                          id="finding-notes"
                          className="input min-h-20"
                          placeholder="What was checked, decided, or remediated — and why."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="btn !py-1.5 !text-[13px]"
                          disabled={actionBusy}
                          onClick={() =>
                            void patchFinding(f.id, {
                              resolutionNotes: notes,
                              assignedOwnerName: owner,
                            })
                          }
                        >
                          Save review details
                        </button>
                        {actionBusy ? <span className="text-xs text-ink3">Saving…</span> : null}
                      </div>
                      {actionError ? (
                        <p className="text-xs text-crit-text">{actionError}</p>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                {/* Rules-based check */}
                <section className="panel mt-6" aria-label="Rules-based check">
                  <p className="eyebrow text-gold-text">Rules-based check</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold tracking-wide">
                      {f.rule.code} v{f.rule.version}
                    </span>
                    <span className="tag tag-outline capitalize">{humanize(f.rule.category)}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold">{f.rule.name}</p>
                  <p className="mt-1 text-[13px] leading-6 text-ink2">{f.rule.description}</p>
                  <pre className="mt-2.5 overflow-x-auto rounded-md border border-line bg-surface2/50 p-3 font-mono text-[11px] leading-5 text-ink2">
                    {prettyJson(f.rule.conditionConfiguration)}
                  </pre>
                  <h4 className="mt-3 text-[11px] font-semibold tracking-wide text-ink3 uppercase">
                    Recommended action
                  </h4>
                  <p className="mt-0.5 text-[13px] leading-6 text-ink2">
                    {f.rule.recommendedAction}
                  </p>
                </section>

                {/* Source resource */}
                <section className="panel mt-6" aria-label="Source resource">
                  <p className="eyebrow text-gold-text">Source resource</p>
                  {f.resource ? (
                    <dl className="mt-2.5 grid gap-x-8 gap-y-2.5 text-[13px] sm:grid-cols-2">
                      <div>
                        <dt className="text-[11px] font-semibold tracking-wide text-ink3 uppercase">
                          Name
                        </dt>
                        <dd className="mt-0.5 text-ink">{f.resource.name}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold tracking-wide text-ink3 uppercase">
                          Location
                        </dt>
                        <dd className="mt-0.5 text-ink2">{f.resource.location ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold tracking-wide text-ink3 uppercase">
                          Sharing
                        </dt>
                        <dd className="mt-0.5 text-ink2 capitalize">
                          {f.resource.sharingStatus ? humanize(f.resource.sharingStatus) : "—"}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-2 text-[13px] text-ink3">
                      The source resource is no longer on record.
                    </p>
                  )}
                </section>

                {/* Mapped controls */}
                <section className="panel mt-6" aria-label="Mapped controls">
                  <p className="eyebrow text-gold-text">Mapped controls</p>
                  {f.controlMappings.length === 0 ? (
                    <p className="mt-2 text-[13px] text-ink3">
                      This finding is not mapped to any control.
                    </p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col divide-y divide-line">
                      {f.controlMappings.map((m) => (
                        <li key={m.id} className="py-3">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="font-mono text-[11px] font-semibold tracking-wide text-ink3">
                              {m.control.controlCode}
                            </span>
                            <span className="text-[11px] text-ink3">{m.control.domain.name}</span>
                          </div>
                          <p className="mt-1 text-[13px] leading-6 font-medium">
                            {m.control.question}
                          </p>
                          {m.control.regulationMappings.length > 0 ? (
                            <p className="mt-1 text-xs text-ink3">
                              Legal basis:{" "}
                              <span className="text-ink2">
                                {m.control.regulationMappings
                                  .map(
                                    (rm) =>
                                      `${rm.regulation.code}${rm.legalBasis ? ` ${rm.legalBasis}` : ""}`
                                  )
                                  .join(" · ")}
                              </span>
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Lineage trace */}
                <section className="panel mt-6" aria-label="Lineage trace">
                  <p className="eyebrow text-gold-text">Lineage trace</p>
                  <ol className="mt-4 flex flex-col">
                    {lineageSteps.map((step, i) => (
                      <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
                        <span className="relative flex w-4 shrink-0 justify-center">
                          {i < lineageSteps.length - 1 ? (
                            <span
                              aria-hidden
                              className="absolute top-2.5 -bottom-1 w-px bg-line2"
                            />
                          ) : null}
                          <span
                            aria-hidden
                            className={`relative mt-1 h-2.5 w-2.5 rounded-full border-2 ${
                              step.held ? "border-gold bg-gold/25" : "border-gold bg-surface"
                            }`}
                          />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`text-[12.5px] leading-5 font-semibold ${
                              step.held ? "text-gold-text" : "text-ink"
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.value ? (
                            <p
                              className={`mt-0.5 text-[12px] leading-5 text-ink2 ${
                                step.mono ? "font-mono tracking-wide" : ""
                              }`}
                            >
                              {step.value}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Audit trail */}
                <section className="panel mt-6 mb-2" aria-label="Audit trail">
                  <p className="eyebrow text-gold-text">Audit trail</p>
                  {detail && detail.auditTrail.length > 0 ? (
                    <ul className="mt-1.5 flex flex-col divide-y divide-line">
                      {detail.auditTrail.map((entry) => (
                        <li key={entry.id} className="py-2.5">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink3">
                            <span className="tabular-nums">{formatDateTime(entry.createdAt)}</span>
                            <span className="tag tag-outline">
                              {ORIGIN_LABELS[entry.origin] ?? humanize(entry.origin)}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] leading-5 text-ink2">{entry.summary}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[13px] text-ink3">
                      No audit events recorded for this finding yet.
                    </p>
                  )}
                </section>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
