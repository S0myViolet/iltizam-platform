"use client";

// The monitored-data register: a dense, filterable list of every source file
// the automated scan discovered in the demo data vault. Each row combines the
// file's parsed contents (type, record count, fingerprint) with the manifest
// context the rules evaluate (owner, sharing, retention, transfers). Clicking
// a row opens a detail drawer with the full record and a live sample of the
// actual rows from the vault preview endpoint — masked by default, with an
// explicit platform-admin toggle that reveals the synthetic values only.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EVIDENCE_TYPE_LABELS, isEvidenceType } from "@/lib/types";

// ─── Row shape handed over by the server page ───────────────────────────────

export interface MonitoredResourceRow {
  id: string;
  externalId: string;
  name: string;
  sourceSystem: string | null;
  fileType: string | null;
  rowCount: number;
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  dataCategories: string[];
  owner: string | null;
  storageCountry: string | null;
  destinationCountries: string[];
  sharingStatus: string | null;
  accessLevel: string | null;
  encryptionStatus: string | null;
  retentionPeriod: string | null;
  retentionDate: string | null;
  changeStatus: string;
  modifiedExternallyAt: string | null;
  lastSeenAt: string | null;
  findingsCount: number;
  isEvidenceCandidate: boolean;
  evidenceType: string | null;
  location: string | null;
  checksum: string | null;
}

// ─── Preview payload from GET /api/vault/preview ────────────────────────────

interface PreviewData {
  file: string;
  fileType: string;
  rowCount: number;
  columns: string[];
  rows: Record<string, unknown>[];
  textPreview: string | null;
  masked: boolean;
  note: string;
}

// ─── Presentation maps ──────────────────────────────────────────────────────

const CHANGE_TAG: Record<string, { label: string; chip: string; rail: string; dot: string }> = {
  new: {
    label: "New",
    chip: "border border-gold/40 bg-gold/[0.08] text-gold-text",
    rail: "border-l-gold",
    dot: "bg-gold",
  },
  changed: {
    label: "Changed",
    chip: "border border-warn/30 bg-warn/[0.07] text-warn-text",
    rail: "border-l-warn",
    dot: "bg-warn",
  },
  removed: {
    label: "Removed",
    chip: "border border-crit/25 bg-crit/[0.06] text-crit-text",
    rail: "border-l-crit",
    dot: "bg-crit",
  },
  unchanged: {
    label: "Unchanged",
    chip: "tag-outline opacity-80",
    rail: "border-l-line",
    dot: "bg-line2",
  },
};

function changeTag(status: string) {
  return CHANGE_TAG[status] ?? CHANGE_TAG.unchanged;
}

type Sensitivity = "all" | "sensitive" | "personal" | "none";
type SortKey = "name" | "records" | "findings" | "last_scanned";

const SENSITIVITY_OPTIONS: { value: Sensitivity; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sensitive", label: "Sensitive" },
  { value: "personal", label: "Personal" },
  { value: "none", label: "No personal data" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name", label: "Sort: name (A–Z)" },
  { value: "records", label: "Sort: records (high → low)" },
  { value: "findings", label: "Sort: findings (high → low)" },
  { value: "last_scanned", label: "Sort: last scanned (newest)" },
];

const SHARING_ORDER = ["private", "internal", "broad", "public"] as const;

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

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function evidenceTypeLabel(value: string): string {
  return isEvidenceType(value) ? EVIDENCE_TYPE_LABELS[value] : humanize(value);
}

function matchesSensitivity(row: MonitoredResourceRow, sensitivity: Sensitivity): boolean {
  switch (sensitivity) {
    case "sensitive":
      return row.containsSensitiveData;
    case "personal":
      return row.containsPersonalData && !row.containsSensitiveData;
    case "none":
      return !row.containsPersonalData && !row.containsSensitiveData;
    default:
      return true;
  }
}

function cellText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// ─── Shared tag row (list rows + drawer header) ─────────────────────────────

function ResourceTags({ row }: { row: MonitoredResourceRow }) {
  const change = changeTag(row.changeStatus);
  return (
    <>
      <span className="tag tag-outline font-mono tracking-wide uppercase">
        {row.fileType ?? "file"}
      </span>
      {row.containsSensitiveData ? (
        <span className="tag border border-crit/25 bg-crit/[0.06] text-crit-text">
          <span aria-hidden className="h-3 w-[3px] rounded-full bg-crit" />
          Sensitive data
        </span>
      ) : null}
      {row.containsPersonalData ? (
        <span className="tag border border-accent/30 bg-accent/[0.07] text-accent-strong">
          Personal data
        </span>
      ) : null}
      <span className={`tag ${change.chip}`}>
        <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${change.dot}`} />
        {change.label}
      </span>
      {row.isEvidenceCandidate ? (
        <span className="tag border border-gold/40 bg-gold/[0.08] text-gold-text">
          Evidence candidate
        </span>
      ) : null}
      {row.findingsCount > 0 ? (
        <span className="tag border border-warn/30 bg-warn/[0.07] text-warn-text tabular-nums">
          {row.findingsCount} finding{row.findingsCount === 1 ? "" : "s"}
        </span>
      ) : null}
    </>
  );
}

function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active
          ? "border-brand bg-brand text-brand-ink"
          : "border-line2 bg-surface text-ink2 hover:bg-surface2"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold tracking-wide text-ink3 uppercase">{label}</dt>
      <dd
        className={`mt-0.5 text-[13px] leading-5 text-ink2 ${
          mono ? "font-mono text-[12px] tracking-wide break-all" : ""
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

// ─── The register ───────────────────────────────────────────────────────────

export function MonitoredDataClient({ rows }: { rows: MonitoredResourceRow[] }) {
  // Filters
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("all");
  const [category, setCategory] = useState("all");
  const [sensitivity, setSensitivity] = useState<Sensitivity>("all");
  const [sharing, setSharing] = useState("all");
  const [country, setCountry] = useState("all");
  const [hasFindingsOnly, setHasFindingsOnly] = useState(false);
  const [changedOnly, setChangedOnly] = useState(false);
  const [evidenceOnly, setEvidenceOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");

  // Drawer + preview
  const [openId, setOpenId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);

  // ── Filter options derived from the data (≤ 30 rows — client-side is fine) ─

  const systems = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.sourceSystem).filter((s): s is string => s !== null))
      ).sort(),
    [rows]
  );
  const categories = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => r.dataCategories))).sort(),
    [rows]
  );
  const countries = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.storageCountry).filter((c): c is string => c !== null))
      ).sort(),
    [rows]
  );
  const sharingOptions = useMemo(
    () => SHARING_ORDER.filter((s) => rows.some((r) => r.sharingStatus === s)),
    [rows]
  );
  const sensitivityCounts = useMemo(() => {
    const counts = {} as Record<Sensitivity, number>;
    for (const option of SENSITIVITY_OPTIONS) {
      counts[option.value] = rows.filter((r) => matchesSensitivity(r, option.value)).length;
    }
    return counts;
  }, [rows]);

  // ── Filtering + sorting ────────────────────────────────────────────────────

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (
        q &&
        !r.name.toLowerCase().includes(q) &&
        !(r.sourceSystem ?? "").toLowerCase().includes(q) &&
        !(r.owner ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (system !== "all" && r.sourceSystem !== system) return false;
      if (category !== "all" && !r.dataCategories.includes(category)) return false;
      if (!matchesSensitivity(r, sensitivity)) return false;
      if (sharing !== "all" && r.sharingStatus !== sharing) return false;
      if (country !== "all" && r.storageCountry !== country) return false;
      if (hasFindingsOnly && r.findingsCount === 0) return false;
      if (changedOnly && r.changeStatus === "unchanged") return false;
      if (evidenceOnly && !r.isEvidenceCandidate) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "records":
          return b.rowCount - a.rowCount || a.name.localeCompare(b.name);
        case "findings":
          return b.findingsCount - a.findingsCount || a.name.localeCompare(b.name);
        case "last_scanned": {
          const ta = a.lastSeenAt ? Date.parse(a.lastSeenAt) : 0;
          const tb = b.lastSeenAt ? Date.parse(b.lastSeenAt) : 0;
          return tb - ta || a.name.localeCompare(b.name);
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [
    rows,
    query,
    system,
    category,
    sensitivity,
    sharing,
    country,
    hasFindingsOnly,
    changedOnly,
    evidenceOnly,
    sortKey,
  ]);

  function clearFilters() {
    setQuery("");
    setSystem("all");
    setCategory("all");
    setSensitivity("all");
    setSharing("all");
    setCountry("all");
    setHasFindingsOnly(false);
    setChangedOnly(false);
    setEvidenceOnly(false);
  }

  // ── Preview plumbing — only the latest requested file/reveal may render ────

  const previewRequest = useRef<string | null>(null);

  const loadPreview = useCallback(async (file: string, revealRows: boolean) => {
    const key = `${file}::${revealRows}`;
    previewRequest.current = key;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch(
        `/api/vault/preview?file=${encodeURIComponent(file)}${revealRows ? "&reveal=true" : ""}`
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not load the data preview.");
      }
      const data = (await res.json()) as PreviewData;
      if (previewRequest.current !== key) return;
      setPreview(data);
    } catch (err) {
      if (previewRequest.current !== key) return;
      setPreview(null);
      setPreviewError(err instanceof Error ? err.message : "Could not load the data preview.");
    } finally {
      if (previewRequest.current === key) setPreviewLoading(false);
    }
  }, []);

  function openResource(row: MonitoredResourceRow) {
    setOpenId(row.id);
    setReveal(false);
    setPreview(null);
    setPreviewError(null);
    void loadPreview(row.name, false);
  }

  const closeDrawer = useCallback(() => {
    previewRequest.current = null;
    setOpenId(null);
    setPreview(null);
    setPreviewError(null);
    setReveal(false);
  }, []);

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

  const openRow = openId ? (rows.find((r) => r.id === openId) ?? null) : null;
  const previewShown = preview ? Math.min(preview.rows.length, preview.rowCount) : 0;

  return (
    <section aria-label="Monitored data register">
      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            className="input !w-64 !py-1.5 !text-[13px]"
            placeholder="Search files, systems, owners…"
            aria-label="Search by file name, source system, or owner"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="seg max-w-full overflow-x-auto" role="group" aria-label="Filter by sensitivity">
            {SENSITIVITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={sensitivity === o.value}
                onClick={() => setSensitivity(o.value)}
                className={`seg-item whitespace-nowrap ${sensitivity === o.value ? "seg-item-active" : ""}`}
              >
                {o.label} · {sensitivityCounts[o.value]}
              </button>
            ))}
          </div>
          <select
            className="input ml-auto !w-auto !py-1.5 !text-xs"
            aria-label="Sort resources"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input !w-auto !py-1.5 !text-xs"
            aria-label="Filter by source system"
            value={system}
            onChange={(e) => setSystem(e.target.value)}
          >
            <option value="all">All source systems</option>
            {systems.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="input !w-auto !py-1.5 !text-xs"
            aria-label="Filter by data category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All data categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {humanize(c)}
              </option>
            ))}
          </select>
          <select
            className="input !w-auto !py-1.5 !text-xs"
            aria-label="Filter by sharing status"
            value={sharing}
            onChange={(e) => setSharing(e.target.value)}
          >
            <option value="all">All sharing statuses</option>
            {sharingOptions.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            className="input !w-auto !py-1.5 !text-xs"
            aria-label="Filter by storage country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="all">All storage locations</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <TogglePill active={hasFindingsOnly} onClick={() => setHasFindingsOnly((v) => !v)}>
            Has findings
          </TogglePill>
          <TogglePill active={changedOnly} onClick={() => setChangedOnly((v) => !v)}>
            Changed since last scan
          </TogglePill>
          <TogglePill active={evidenceOnly} onClick={() => setEvidenceOnly((v) => !v)}>
            Evidence candidates
          </TogglePill>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink3 tabular-nums">
        Showing {visibleRows.length} of {rows.length} files
      </p>

      {/* ── Rows ────────────────────────────────────────────────────────────── */}
      {visibleRows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 border-y-2 border-line bg-surface2/40 px-6 py-12 text-center">
          <h3 className="display text-lg font-semibold">No files match this view</h3>
          <p className="max-w-md text-sm leading-6 text-ink2">
            Clear the filters to see every monitored file on record.
          </p>
          <button type="button" className="btn mt-3 !py-1.5 !text-[13px]" onClick={clearFilters}>
            Show all files
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {visibleRows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => openResource(r)}
              className={`record ${changeTag(r.changeStatus).rail} w-full px-4 py-3 text-left transition-colors hover:bg-surface2/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="mr-1 text-[14px] leading-5 font-semibold">{r.name}</h3>
                <ResourceTags row={r} />
                <span className="ml-auto text-[11px] whitespace-nowrap text-ink3">
                  Scanned {formatDateTime(r.lastSeenAt)}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink3">
                <span>
                  System: <span className="text-ink2">{r.sourceSystem ?? "—"}</span>
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold text-ink2">
                    {r.rowCount.toLocaleString("en-GB")}
                  </span>{" "}
                  records
                </span>
                <span>
                  Owner:{" "}
                  {r.owner ? (
                    <span className="text-ink2">{r.owner}</span>
                  ) : (
                    <span className="font-semibold text-warn-text">Not assigned</span>
                  )}
                </span>
                <span>
                  Storage:{" "}
                  <span className="text-ink2">
                    {r.storageCountry ?? "—"}
                    {r.destinationCountries.length > 0
                      ? ` → ${r.destinationCountries.join(", ")}`
                      : ""}
                  </span>
                </span>
                <span>
                  Sharing:{" "}
                  {r.sharingStatus === "public" ? (
                    <span className="font-semibold text-crit-text">Public</span>
                  ) : (
                    <span className="text-ink2 capitalize">{r.sharingStatus ?? "—"}</span>
                  )}
                </span>
                <span>
                  Encryption:{" "}
                  {r.encryptionStatus === "unencrypted" ? (
                    <span className="font-semibold text-warn-text">Unencrypted</span>
                  ) : (
                    <span className="text-ink2 capitalize">{r.encryptionStatus ?? "Unknown"}</span>
                  )}
                </span>
                <span>
                  Retention:{" "}
                  {r.retentionPeriod ? (
                    <span className="text-ink2">{r.retentionPeriod}</span>
                  ) : (
                    <span className="font-semibold text-warn-text">Not documented</span>
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Detail drawer ───────────────────────────────────────────────────── */}
      {openRow ? (
        <div className="fixed inset-0 z-50">
          <div aria-hidden className="absolute inset-0 bg-brand/50" onClick={closeDrawer} />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Monitored resource detail"
            className="sheet fixed inset-y-0 right-0 w-full max-w-xl overflow-y-auto !rounded-none"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-5 py-3.5 backdrop-blur sm:px-6">
              <p className="eyebrow text-gold-text">Monitored resource</p>
              <button type="button" className="btn !px-2.5 !py-1 !text-xs" onClick={closeDrawer}>
                Close
              </button>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <ResourceTags row={openRow} />
              </div>
              <h2 className="display mt-3 text-xl leading-7 font-semibold tracking-tight">
                {openRow.name}
              </h2>
              {openRow.location ? (
                <p className="mt-1 font-mono text-[12px] tracking-wide break-all text-ink3">
                  {openRow.location}
                </p>
              ) : null}

              {/* Source file — what the scan actually read */}
              <section className="panel mt-5" aria-label="Source file">
                <p className="eyebrow text-gold-text">Source file</p>
                <dl className="mt-2.5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  <Field label="External id" mono>
                    {openRow.externalId}
                  </Field>
                  <Field label="File type" mono>
                    {(openRow.fileType ?? "unknown").toUpperCase()}
                  </Field>
                  <Field label="Records">
                    <span className="tabular-nums">
                      {openRow.rowCount.toLocaleString("en-GB")}
                    </span>
                  </Field>
                  <Field label="Content fingerprint (checksum)" mono>
                    {openRow.checksum ?? "—"}
                  </Field>
                  <Field label="Change status">{changeTag(openRow.changeStatus).label}</Field>
                  <Field label="Modified externally">
                    {formatDateTime(openRow.modifiedExternallyAt)}
                  </Field>
                  <Field label="Last scanned">{formatDateTime(openRow.lastSeenAt)}</Field>
                  <Field label="Findings on record">
                    <span className={openRow.findingsCount > 0 ? "font-semibold text-warn-text" : ""}>
                      {openRow.findingsCount}
                    </span>
                  </Field>
                </dl>
              </section>

              {/* Manifest context — the file-level facts the rules evaluate */}
              <section className="panel mt-6" aria-label="Manifest context">
                <p className="eyebrow text-gold-text">Manifest context</p>
                <dl className="mt-2.5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  <Field label="Source system">{openRow.sourceSystem ?? "—"}</Field>
                  <Field label="Owner">
                    {openRow.owner ?? (
                      <span className="font-semibold text-warn-text">Not assigned</span>
                    )}
                  </Field>
                  <Field label="Storage country">{openRow.storageCountry ?? "—"}</Field>
                  <Field label="Destination countries">
                    {openRow.destinationCountries.length > 0
                      ? openRow.destinationCountries.join(", ")
                      : "None recorded"}
                  </Field>
                  <Field label="Sharing">
                    {openRow.sharingStatus === "public" ? (
                      <span className="font-semibold text-crit-text">Public</span>
                    ) : (
                      <span className="capitalize">{openRow.sharingStatus ?? "—"}</span>
                    )}
                  </Field>
                  <Field label="Access level">
                    <span className="capitalize">
                      {openRow.accessLevel ? humanize(openRow.accessLevel) : "—"}
                    </span>
                  </Field>
                  <Field label="Encryption">
                    {openRow.encryptionStatus === "unencrypted" ? (
                      <span className="font-semibold text-warn-text">Unencrypted</span>
                    ) : (
                      <span className="capitalize">{openRow.encryptionStatus ?? "Unknown"}</span>
                    )}
                  </Field>
                  <Field label="Retention period">
                    {openRow.retentionPeriod ?? (
                      <span className="font-semibold text-warn-text">Not documented</span>
                    )}
                  </Field>
                  <Field label="Retention date">{openRow.retentionDate ?? "—"}</Field>
                  <Field label="Personal data">
                    {openRow.containsPersonalData ? "Yes" : "No"}
                  </Field>
                  <Field label="Sensitive data">
                    {openRow.containsSensitiveData ? "Yes" : "No"}
                  </Field>
                  <Field label="Evidence type">
                    {openRow.evidenceType
                      ? evidenceTypeLabel(openRow.evidenceType)
                      : "Not an evidence candidate"}
                  </Field>
                </dl>
                {openRow.dataCategories.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold tracking-wide text-ink3 uppercase">
                      Data categories
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {openRow.dataCategories.map((c) => (
                        <span key={c} className="tag tag-outline capitalize">
                          {humanize(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              {/* Data preview — actual sample rows from the vault file */}
              <section className="panel mt-6 mb-2" aria-label="Data preview">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="eyebrow text-gold-text">Data preview</p>
                  <button
                    type="button"
                    className="btn !py-1 !text-xs"
                    aria-pressed={reveal}
                    disabled={previewLoading}
                    onClick={() => {
                      const next = !reveal;
                      setReveal(next);
                      void loadPreview(openRow.name, next);
                    }}
                  >
                    {reveal ? "Mask demo data" : "Reveal synthetic demo data"}
                  </button>
                </div>
                <p className="mt-2.5 rounded-md border border-gold/40 bg-gold/[0.08] px-3.5 py-2.5 text-[13px] font-medium text-gold-text">
                  {reveal
                    ? "Synthetic demonstration data — synthetic values revealed. No real personal data exists in this vault."
                    : "Synthetic demonstration data — personal fields masked."}
                </p>
                <p className="mt-1.5 text-[11px] leading-4 text-ink3">
                  Revealing shows unmasked synthetic values only. Platform administrators only;
                  every reveal is recorded in the audit trail.
                </p>

                {previewLoading && !preview ? (
                  <p className="mt-3 text-sm text-ink3">Reading sample rows from the vault…</p>
                ) : previewError ? (
                  <div className="mt-3">
                    <p className="text-sm text-crit-text">{previewError}</p>
                    <button
                      type="button"
                      className="btn mt-2 !py-1.5 !text-[13px]"
                      onClick={() => void loadPreview(openRow.name, reveal)}
                    >
                      Try again
                    </button>
                  </div>
                ) : preview ? (
                  <div className="mt-3">
                    {preview.fileType === "txt" && preview.textPreview ? (
                      <>
                        <pre className="overflow-x-auto rounded-md border border-line bg-surface2/50 p-3 font-mono text-[11px] leading-5 whitespace-pre-wrap text-ink2">
                          {preview.textPreview}
                        </pre>
                        <p className="mt-2 text-[11px] text-ink3">
                          Text file — showing the first 2,000 characters.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="overflow-x-auto rounded-md border border-line">
                          <table className="w-full text-left text-[12px]">
                            <thead className="bg-surface2/60">
                              <tr>
                                {preview.columns.map((c) => (
                                  <th
                                    key={c}
                                    scope="col"
                                    className="px-2.5 py-1.5 font-mono text-[10.5px] font-semibold tracking-wide whitespace-nowrap text-ink3"
                                  >
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {preview.rows.map((row, i) => (
                                <tr key={i}>
                                  {preview.columns.map((c) => (
                                    <td
                                      key={c}
                                      className="px-2.5 py-1.5 whitespace-nowrap text-ink2 tabular-nums"
                                    >
                                      {cellText(row[c])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-2 text-[11px] text-ink3 tabular-nums">
                          Preview shows the first {previewShown} of{" "}
                          {preview.rowCount.toLocaleString("en-GB")} records ·{" "}
                          {preview.masked ? "personal fields masked" : "synthetic values revealed"}.
                        </p>
                      </>
                    )}
                    <p className="mt-1 text-[11px] text-ink3">{preview.note}</p>
                  </div>
                ) : null}
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
