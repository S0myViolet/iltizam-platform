"use client";

// Evidence list + add-evidence controls for one answer. Supports both file
// uploads (stored locally by the API) and links to existing documents.

import { useRef, useState } from "react";
import type { EvidenceItem } from "@/lib/assessments";
import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS, type EvidenceType } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function EvidencePanel({
  answerId,
  evidence,
  onEvidenceChange,
}: {
  answerId: string;
  evidence: EvidenceItem[];
  onEvidenceChange: (answerId: string, updater: (prev: EvidenceItem[]) => EvidenceItem[]) => void;
}) {
  const [mode, setMode] = useState<"link" | "file">("link");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("policy_document");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function addLink() {
    if (!/^https?:\/\/\S+$/i.test(url.trim())) {
      setError("Enter a valid link starting with http:// or https://");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/answers/${answerId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), title: title.trim() || undefined, evidenceType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add the link.");
      onEvidenceChange(answerId, (prev) => [data.evidence, ...prev]);
      setUrl("");
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the link.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("evidenceType", evidenceType);
      const res = await fetch(`/api/answers/${answerId}/evidence`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      onEvidenceChange(answerId, (prev) => [data.evidence, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEvidence(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/evidence/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not remove evidence.");
      }
      onEvidenceChange(answerId, (prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove evidence.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h4 className="text-xs font-semibold tracking-wide text-ink2">Evidence</h4>

      {evidence.length === 0 ? (
        <p className="mt-1.5 text-sm leading-6 text-ink3">
          No evidence uploaded yet. Add a policy, register, screenshot, or signed agreement to
          support this control — link to where it lives, or upload the file.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {evidence.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <a
                  href={e.fileUrl}
                  target={e.kind === "link" ? "_blank" : undefined}
                  rel={e.kind === "link" ? "noopener noreferrer" : undefined}
                  className="block truncate text-sm font-medium text-accent-strong hover:underline"
                >
                  {e.fileName}
                </a>
                <p className="text-[11px] text-ink3">
                  {EVIDENCE_TYPE_LABELS[e.evidenceType] ?? e.evidenceType} ·{" "}
                  {e.kind === "file" ? "uploaded file" : "link"} · {formatDate(e.uploadedAt)}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs text-ink3 hover:text-crit-text"
                onClick={() => removeEvidence(e.id)}
                disabled={busy}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 rounded-lg border border-line bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Evidence input mode" className="seg">
            {(["link", "file"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`seg-item ${mode === m ? "seg-item-active" : ""}`}
              >
                {m === "link" ? "Link a document" : "Upload a file"}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor={`evtype-${answerId}`}>
            Evidence type
          </label>
          <select
            id={`evtype-${answerId}`}
            className="input !w-auto !py-1 !text-xs"
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
          >
            {EVIDENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVIDENCE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {mode === "link" ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              className="input flex-1 !text-sm"
              placeholder="https://… link to the document"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <input
              className="input flex-1 !text-sm"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button type="button" className="btn btn-primary !py-2 !text-xs" onClick={addLink} disabled={busy}>
              {busy ? "Adding…" : "Add link"}
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <input
              ref={fileInputRef}
              type="file"
              className="block w-full text-sm text-ink2 file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent-ink hover:file:bg-accent-strong"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
              }}
              disabled={busy}
            />
            <p className="mt-1 text-[11px] text-ink3">Up to 10 MB. Stored with this assessment.</p>
          </div>
        )}

        {error ? (
          <p role="alert" className="mt-2 text-xs text-crit-text">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
