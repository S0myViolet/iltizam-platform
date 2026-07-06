// Score visuals. Magnitude wears a single hue (dark teal); state colours are
// reserved for the labelled tags. Values are always printed as text beside
// the mark — never colour alone.

export function ScoreMeter({
  value,
  className = "",
  trackClassName = "h-2",
}: {
  /** 0–100, or null when not scorable. */
  value: number | null;
  className?: string;
  trackClassName?: string;
}) {
  const width = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? "Not scorable" : `${value}%`}
      className={`w-full overflow-hidden rounded-full bg-surface2 ${trackClassName} ${className}`}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-500"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/** Radial readiness gauge — the dashboard's visual anchor. */
export function RadialScore({
  value,
  label,
  sublabel,
  size = 168,
}: {
  value: number | null;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = c * (1 - pct / 100);
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value === null ? "Not scorable" : `${value}% — ${label}`}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[var(--surface-2)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-[var(--accent)] transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-ink">
        <span
          className={`leading-none font-semibold tracking-tight tabular-nums ${
            size < 150 ? "text-[26px]" : "text-[40px]"
          }`}
        >
          {value === null ? "—" : `${Math.round(value)}%`}
        </span>
        <span className="mt-1.5 max-w-[70%] text-[11px] leading-4 font-medium text-ink2">
          {label}
        </span>
        {sublabel ? <span className="mt-0.5 text-[10px] text-ink3">{sublabel}</span> : null}
      </div>
    </div>
  );
}

/**
 * Composition bar: how a domain's applicable controls split between
 * answered-Yes, marked-as-gap and awaiting answer. 2px surface gaps between
 * segments; a legend/labels must accompany it (the domain rows do this).
 */
export function CompositionBar({
  compliant,
  gaps,
  unanswered,
  className = "",
}: {
  compliant: number;
  gaps: number;
  unanswered: number;
  className?: string;
}) {
  const total = compliant + gaps + unanswered;
  const seg = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  return (
    <div
      aria-hidden
      className={`flex h-2 w-full gap-[2px] overflow-hidden rounded-full bg-surface2 ${className}`}
    >
      {compliant > 0 ? (
        <div className="h-full rounded-full bg-accent" style={{ width: `${seg(compliant)}%` }} />
      ) : null}
      {gaps > 0 ? (
        <div className="h-full rounded-full bg-crit" style={{ width: `${seg(gaps)}%` }} />
      ) : null}
      {unanswered > 0 ? (
        <div className="h-full rounded-full bg-line2" style={{ width: `${seg(unanswered)}%` }} />
      ) : null}
    </div>
  );
}
