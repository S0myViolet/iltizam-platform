"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RegulationOption {
  code: string;
  name: string;
  version: string;
  status: string;
  controlCount: number;
}

export function NewAssessmentForm({ regulations }: { regulations: RegulationOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedRegimes, setSelectedRegimes] = useState<string[]>(
    regulations.map((r) => r.code)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRegime(code: string) {
    setSelectedRegimes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Please give the review a title.");
      return;
    }
    if (selectedRegimes.length === 0) {
      setError("Select at least one regulation.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          selectedRegimes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create the assessment.");
      }
      router.push(`/assessments/${data.assessment.id}/questionnaire`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="panel">
        <p className="eyebrow text-gold-text">The review</p>
      </div>
      <div>
        <label htmlFor="title" className="field-label">
          Review title <span className="text-crit-text">*</span>
        </label>
        <input
          id="title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. PDPL readiness review Q4 2026"
          maxLength={140}
          required
        />
        <p className="mt-1.5 text-xs leading-5 text-ink3">
          The review is created inside your organization&apos;s workspace with one control
          instance per applicable control.
        </p>
      </div>

      <fieldset>
        <div className="panel mb-4">
          <p className="eyebrow text-gold-text">Regulatory scope</p>
        </div>
        <legend className="sr-only">Which regulations apply?</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {regulations.map((r) => {
            const checked = selectedRegimes.includes(r.code);
            return (
              <label
                key={r.code}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked ? "border-accent bg-accent/5" : "border-line hover:bg-surface2"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                  checked={checked}
                  onChange={() => toggleRegime(r.code)}
                />
                <span>
                  <span className="block text-sm font-medium">{r.code}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-ink2">{r.name}</span>
                  <span className="mt-0.5 block text-[11px] text-ink3">
                    {r.controlCount} controls · version {r.version}
                    {r.status === "provisional" ? " · provisional mapping" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-5 text-ink3">
          Egypt PDPL and GDPR are distinct control libraries with their own legal bases.
          Selecting both scores each regulation separately and combined.
        </p>
      </fieldset>

      {error ? (
        <p role="alert" className="rounded-lg bg-crit/10 px-3 py-2 text-sm text-crit-text">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t-2 border-line pt-5">
        <p className="text-xs leading-5 text-ink3">
          You can refine company details later. The control set follows the regulations you
          select.
        </p>
        <button type="submit" className="btn btn-primary shrink-0" disabled={submitting}>
          {submitting ? "Preparing your controls…" : "Open the review"}
        </button>
      </div>
    </form>
  );
}
