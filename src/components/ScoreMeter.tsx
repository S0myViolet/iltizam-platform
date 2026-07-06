// Thin single-hue progress meter (magnitude → one hue, per the dataviz method).
// The value is always shown as text next to the track — never color alone.

export function ScoreMeter({
  value,
  className = "",
  trackClassName = "h-1.5",
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
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
