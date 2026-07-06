import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  /** Tones tint the value text; the label always states the meaning. */
  tone?: "default" | "good" | "warn" | "crit" | "accent";
  children?: ReactNode;
}) {
  const toneClass = {
    default: "text-ink",
    good: "text-good-text",
    warn: "text-warn-text",
    crit: "text-crit-text",
    accent: "text-accent-strong",
  }[tone];
  return (
    <div className="card px-4 py-3.5">
      <div className="text-xs font-medium text-ink2">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-ink3">{sub}</div> : null}
      {children}
    </div>
  );
}
