"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COMPANY_SIZES } from "@/lib/types";

interface RegulationOption {
  code: string;
  name: string;
  version: string;
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
    <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-5 p-5 sm:p-6">
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
        <legend className="field-label">Which regulations apply?</legend>
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
          Most controls apply to both regimes — Egypt&apos;s PDPL is closely based on the GDPR.
          Selecting both shows the full picture.
        </p>
      </fieldset>

      {error ? (
        <p role="alert" className="rounded-lg bg-crit/10 px-3 py-2 text-sm text-crit-text">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Setting up…" : "Create assessment"}
        </button>
      </div>
    </form>
  );
}
