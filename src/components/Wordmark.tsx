// The Iltzam mark: an eight-pointed seal (two overlapped squares — a nod to
// Islamic geometry and to the auditor's stamp) beside a serif wordmark and
// the Arabic التزام ("commitment"). Pure SVG/CSS — no image assets.

export function SealMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect
        x="10.5"
        y="10.5"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="10.5"
        y="10.5"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(45 20 20)"
      />
      <circle cx="20" cy="20" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({
  size = "md",
  subtitle,
}: {
  size?: "md" | "lg";
  subtitle?: string;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <SealMark className={size === "lg" ? "h-10 w-10 text-gold-bright" : "h-8 w-8 text-gold-bright"} />
      <span className="flex flex-col leading-none">
        <span className="flex items-baseline gap-2">
          <span
            className={`display font-semibold tracking-tight ${
              size === "lg" ? "text-2xl" : "text-[19px]"
            }`}
          >
            Iltzam
          </span>
          <span
            className={`display text-gold-bright ${size === "lg" ? "text-lg" : "text-[15px]"}`}
            lang="ar"
          >
            التزام
          </span>
        </span>
        {subtitle ? (
          <span className="mt-1.5 text-[10px] font-medium tracking-[0.18em] text-brand-muted uppercase">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
