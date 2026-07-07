"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMPANY_SIZES } from "@/lib/types";

interface RegulationOption {
  code: string;
  name: string;
  jurisdiction: string | null;
  version: string;
  legalInstrument: string | null;
  regulator: string | null;
  complianceDeadline: string | null;
  status: string;
  controlCount: number;
}

export function NewAssessmentForm({ regulations }: { regulations: RegulationOption[] }) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [selectedRegimes, setSelectedRegimes] = useState<string[]>(
    regulations.filter((r) => r.controlCount > 0).map((r) => r.code)
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
    if (!companyName.trim()) {
      setError("Please enter the company name.");
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
          companyName: companyName.trim(),
          companySize: companySize || null,
          industry: industry.trim() || null,
          country: country.trim() || null,
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
        <p className="eyebrow text-gold-text">The company</p>
      </div>
      <div>
        <label htmlFor="companyName" className="field-label">
          Company name <span className="text-crit-text">*</span>
        </label>
        <input
          id="companyName"
          className="input"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Nile Digital Services"
          maxLength={120}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="companySize" className="field-label">
            Company size
          </label>
          <select
            id="companySize"
            className="input"
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
          >
            <option value="">Select…</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} people
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="industry" className="field-label">
            Industry
          </label>
          <input
            id="industry"
            className="input"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Fintech"
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor="country" className="field-label">
            Country
          </label>
          <input
            id="country"
            className="input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Egypt"
            maxLength={80}
          />
        </div>
      </div>

      <fieldset>
        <div className="panel mb-4">
          <p className="eyebrow text-gold-text">Regulatory scope</p>
        </div>
        <legend className="sr-only">Which regulations apply?</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {regulations.map((r) => {
            const pending = r.controlCount === 0;
            const checked = selectedRegimes.includes(r.code);
            return (
              <label
                key={r.code}
                className={`flex items-start gap-3 rounded-lg border p-3.5 transition-colors ${
                  pending
                    ? "cursor-not-allowed border-line opacity-60"
                    : checked
                      ? "cursor-pointer border-accent bg-accent/5"
                      : "cursor-pointer border-line hover:bg-surface2"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                  checked={checked}
                  disabled={pending}
                  onChange={() => toggleRegime(r.code)}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-[13px] font-bold tracking-wide">{r.code}</span>
                    <span className="text-sm font-medium">{r.name}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-ink2">
                    {[r.legalInstrument, r.jurisdiction].filter(Boolean).join(" · ")}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-5 text-ink3">
                    {r.regulator ? `${r.regulator} · ` : ""}
                    {pending ? "Control library pending extraction" : `${r.controlCount} controls`}
                  </span>
                  {r.complianceDeadline ? (
                    <span className="mt-1.5 inline-block rounded-[4px] border border-warn/35 bg-warn/[0.08] px-1.5 py-0.5 text-[10.5px] font-semibold text-warn-text">
                      Compliance deadline · {r.complianceDeadline}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-5 text-ink3">
          Each selected regulation adds its own control set to the review. Selecting both shows
          combined and per-regulation readiness.
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
