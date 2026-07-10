"use client";

// Interactive half of the data inventory register: client-side search over
// the rows the server fetched, a collapsible manual-entry form (POST
// /api/inventory), and per-row archive for manual entries (PATCH
// /api/inventory/[id]). Connector-discovered rows are read-only here — they
// are maintained by automated scans, never edited by hand.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";

export interface InventoryRow {
  id: string;
  name: string;
  systemName: string | null;
  sourceType: "manual" | "connector";
  connectorName: string | null;
  businessOwner: string | null;
  dataCategories: string[];
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  crossBorderTransfer: boolean;
  retentionPeriod: string | null;
  sharingStatus: string | null;
  encryptionStatus: string | null;
  /** ISO strings — serialized on the server. */
  lastScannedAt: string | null;
  lastReviewedAt: string | null;
}

const SHARING_LABELS: Record<string, string> = {
  private: "Private",
  internal: "Internal",
  broad: "Broadly shared",
  public: "Public",
};

const ENCRYPTION_LABELS: Record<string, string> = {
  encrypted: "Encrypted",
  unencrypted: "Unencrypted",
  unknown: "Unknown",
};

const MAX_CATEGORY_TAGS = 4;

const EMPTY_FORM = {
  name: "",
  systemName: "",
  businessOwner: "",
  technicalOwner: "",
  lawfulBasis: "",
  retentionPeriod: "",
  sharingStatus: "",
  encryptionStatus: "",
  containsPersonalData: false,
  containsSensitiveData: false,
  crossBorderTransfer: false,
  dataCategories: "",
};

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${className}`} />;
}

/** Data-classification flags. Escalating tones: teal → gold → crimson. */
function ClassificationTags({ row }: { row: InventoryRow }) {
  return (
    <>
      {row.containsPersonalData ? (
        <span className="tag border border-accent/30 bg-accent/[0.07] text-accent-strong">
          <Dot className="bg-accent" />
          Personal data
        </span>
      ) : null}
      {row.containsSensitiveData ? (
        <span className="tag border border-crit/25 bg-crit/[0.06] text-crit-text">
          <Dot className="bg-crit" />
          Sensitive data
        </span>
      ) : null}
      {row.crossBorderTransfer ? (
        <span className="tag border border-gold/40 bg-gold/[0.08] text-gold-text">
          <Dot className="bg-gold" />
          Cross-border
        </span>
      ) : null}
    </>
  );
}

function SourceTag({ row }: { row: InventoryRow }) {
  if (row.sourceType === "connector") {
    return (
      <span
        className="tag border border-accent/30 bg-accent/[0.07] text-accent-strong"
        title="Discovered and kept current by an automated connector scan"
      >
        Automated scan{row.connectorName ? ` · ${row.connectorName}` : ""}
      </span>
    );
  }
  return (
    <span className="tag tag-outline" title="Entered and maintained manually">
      Manual entry
    </span>
  );
}

function InventoryRecord({
  row,
  canManage,
  busy,
  onArchive,
}: {
  row: InventoryRow;
  canManage: boolean;
  busy: boolean;
  onArchive: (id: string) => void;
}) {
  const shownCategories = row.dataCategories.slice(0, MAX_CATEGORY_TAGS);
  const overflow = row.dataCategories.length - shownCategories.length;
  const sharing = row.sharingStatus ? (SHARING_LABELS[row.sharingStatus] ?? row.sharingStatus) : null;
  const encryption = row.encryptionStatus
    ? (ENCRYPTION_LABELS[row.encryptionStatus] ?? row.encryptionStatus)
    : null;

  return (
    <article
      className={`record px-4 py-3.5 sm:px-5 ${
        row.sourceType === "connector" ? "border-l-accent/60" : "border-l-line2"
      }`}
    >
      {/* Identity line */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <h3 className="display text-[15px] leading-6 font-semibold">{row.name}</h3>
        {row.systemName ? (
          <span className="font-mono text-[11px] tracking-wide text-ink3">{row.systemName}</span>
        ) : null}
        <SourceTag row={row} />
        {canManage && row.sourceType === "manual" ? (
          <button
            type="button"
            onClick={() => onArchive(row.id)}
            disabled={busy}
            className="ml-auto text-xs font-semibold text-ink3 underline-offset-4 transition-colors hover:text-crit-text hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Archiving…" : "Archive"}
          </button>
        ) : null}
      </div>

      {/* Classification & categories */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <ClassificationTags row={row} />
        {shownCategories.map((c) => (
          <span key={c} className="tag tag-outline">
            {c}
          </span>
        ))}
        {overflow > 0 ? (
          <span
            className="tag tag-outline text-ink3"
            title={row.dataCategories.slice(MAX_CATEGORY_TAGS).join(", ")}
          >
            +{overflow} more
          </span>
        ) : null}
        {row.dataCategories.length === 0 ? (
          <span className="text-xs text-ink3">No data categories recorded</span>
        ) : null}
      </div>

      {/* Register facts */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line pt-2.5 text-xs text-ink3">
        <span>
          Owner:{" "}
          {row.businessOwner ? (
            <span className="text-ink2">{row.businessOwner}</span>
          ) : (
            <span className="font-semibold text-warn-text">Owner unassigned</span>
          )}
        </span>
        <span>
          Retention:{" "}
          {row.retentionPeriod ? (
            <span className="text-ink2">{row.retentionPeriod}</span>
          ) : (
            <span className="font-semibold text-warn-text">Not documented</span>
          )}
        </span>
        <span>
          Sharing:{" "}
          <span
            className={
              row.sharingStatus === "public" || row.sharingStatus === "broad"
                ? "font-semibold text-warn-text"
                : "text-ink2"
            }
          >
            {sharing ?? "Not recorded"}
          </span>
        </span>
        <span>
          Encryption:{" "}
          <span
            className={
              row.encryptionStatus === "unencrypted"
                ? "font-semibold text-crit-text"
                : "text-ink2"
            }
          >
            {encryption ?? "Not recorded"}
          </span>
        </span>
        <span className="ml-auto tabular-nums">
          {row.sourceType === "connector"
            ? `Last scanned ${formatDate(row.lastScannedAt)}`
            : `Last reviewed ${formatDate(row.lastReviewedAt)}`}
        </span>
      </div>
    </article>
  );
}

export function InventoryClient({
  items,
  canManage,
}: {
  items: InventoryRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.name, i.systemName ?? "", i.businessOwner ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [items, query]);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          systemName: form.systemName,
          businessOwner: form.businessOwner,
          technicalOwner: form.technicalOwner,
          lawfulBasis: form.lawfulBasis,
          retentionPeriod: form.retentionPeriod,
          sharingStatus: form.sharingStatus,
          encryptionStatus: form.encryptionStatus,
          containsPersonalData: form.containsPersonalData,
          containsSensitiveData: form.containsSensitiveData,
          crossBorderTransfer: form.crossBorderTransfer,
          dataCategories: form.dataCategories
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "The system could not be added.");
      }
      setForm(EMPTY_FORM);
      setFormOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The system could not be added.");
    } finally {
      setSubmitting(false);
    }
  }

  async function archive(id: string) {
    if (archivingId) return;
    if (!window.confirm("Archive this system? It will be removed from the active register.")) {
      return;
    }
    setArchivingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "The system could not be archived.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The system could not be archived.");
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <section aria-label="Data inventory register" className="mt-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, system or owner"
          aria-label="Search the data inventory"
          className="input max-w-xs"
        />
        {query.trim() ? (
          <span className="text-xs text-ink3 tabular-nums">
            {filtered.length} of {items.length} shown
          </span>
        ) : null}
        {canManage ? (
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className={`btn ml-auto !py-1.5 !text-[13px] ${formOpen ? "" : "btn-primary"}`}
            aria-expanded={formOpen}
          >
            {formOpen ? "Close form" : "Add system"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-md border border-crit/25 bg-crit/[0.06] px-3.5 py-2.5 text-[13px] font-medium text-crit-text">
          {error}
        </p>
      ) : null}

      {/* Manual entry form */}
      {canManage && formOpen ? (
        <form onSubmit={submit} className="card mt-4 p-5 sm:p-6">
          <p className="eyebrow text-gold-text">Add a system manually</p>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink2">
            Record where personal data lives when no connector covers the system. Manual
            entries sit alongside scan-discovered systems in the same register.
          </p>

          <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inv-name" className="field-label">
                Name <span aria-hidden className="text-crit-text">*</span>
              </label>
              <input
                id="inv-name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Customer support desk"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="inv-system" className="field-label">
                System identifier
              </label>
              <input
                id="inv-system"
                value={form.systemName}
                onChange={(e) => set("systemName", e.target.value)}
                placeholder="e.g. zendesk-prod"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="inv-bowner" className="field-label">
                Business owner
              </label>
              <input
                id="inv-bowner"
                value={form.businessOwner}
                onChange={(e) => set("businessOwner", e.target.value)}
                placeholder="Accountable person or team"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="inv-towner" className="field-label">
                Technical owner
              </label>
              <input
                id="inv-towner"
                value={form.technicalOwner}
                onChange={(e) => set("technicalOwner", e.target.value)}
                placeholder="Administers the system"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="inv-basis" className="field-label">
                Lawful basis
              </label>
              <input
                id="inv-basis"
                value={form.lawfulBasis}
                onChange={(e) => set("lawfulBasis", e.target.value)}
                placeholder="e.g. Contract performance"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="inv-retention" className="field-label">
                Retention period
              </label>
              <input
                id="inv-retention"
                value={form.retentionPeriod}
                onChange={(e) => set("retentionPeriod", e.target.value)}
                placeholder="e.g. 5 years after contract end"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="inv-sharing" className="field-label">
                Sharing status
              </label>
              <select
                id="inv-sharing"
                value={form.sharingStatus}
                onChange={(e) => set("sharingStatus", e.target.value)}
                className="input"
              >
                <option value="">Not recorded</option>
                <option value="private">Private</option>
                <option value="internal">Internal</option>
                <option value="broad">Broadly shared</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div>
              <label htmlFor="inv-encryption" className="field-label">
                Encryption status
              </label>
              <select
                id="inv-encryption"
                value={form.encryptionStatus}
                onChange={(e) => set("encryptionStatus", e.target.value)}
                className="input"
              >
                <option value="">Not recorded</option>
                <option value="encrypted">Encrypted</option>
                <option value="unencrypted">Unencrypted</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="inv-categories" className="field-label">
                Data categories <span className="font-normal text-ink3">— comma-separated</span>
              </label>
              <input
                id="inv-categories"
                value={form.dataCategories}
                onChange={(e) => set("dataCategories", e.target.value)}
                placeholder="e.g. Contact details, Payment data, Support tickets"
                className="input"
              />
            </div>
          </div>

          <fieldset className="mt-4 border-t border-line pt-4">
            <legend className="sr-only">Data classification</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(
                [
                  ["containsPersonalData", "Contains personal data"],
                  ["containsSensitiveData", "Contains sensitive data"],
                  ["crossBorderTransfer", "Cross-border transfer"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-[13px] font-medium text-ink2">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setForm(EMPTY_FORM);
              }}
              className="btn !py-1.5 !text-[13px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="btn btn-primary !py-1.5 !text-[13px]"
            >
              {submitting ? "Adding…" : "Add to register"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Register */}
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No systems recorded yet"
            body="Add where personal data lives, or run a scan to discover it."
            action={
              canManage && !formOpen ? (
                <button type="button" onClick={() => setFormOpen(true)} className="btn btn-primary">
                  Add system
                </button>
              ) : undefined
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 border-y-2 border-line bg-surface2/40 px-6 py-10 text-center text-sm text-ink2">
          No systems match &ldquo;{query.trim()}&rdquo;. Try a different name, system or owner.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2.5">
            {filtered.map((row) => (
              <InventoryRecord
                key={row.id}
                row={row}
                canManage={canManage}
                busy={archivingId === row.id}
                onArchive={archive}
              />
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-xs leading-5 text-ink3">
            Systems marked &ldquo;Automated scan&rdquo; are discovered by rules-based connector
            scans and refresh on every sync; they cannot be archived here. Manual entries should
            be reviewed whenever your processing changes.
          </p>
        </>
      )}
    </section>
  );
}
