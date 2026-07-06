// The Iltzam mark: a certificate tile — a slab-serif "I" (a column: order,
// structure, record) inside a hairline-framed tile, gold on deep ink. Drawn
// as custom SVG paths; no icon library. The wordmark is tracked uppercase
// serif, with التزام carried in the descriptor line.

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {/* tile */}
      <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="8" fill="var(--brand-2)" stroke="var(--brand-line)" strokeWidth="1" />
      {/* certificate hairline frame */}
      <rect x="5.5" y="5.5" width="29" height="29" rx="4.5" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.55" />
      {/* slab-serif I — the column */}
      <g fill="var(--gold-bright)">
        <path d="M13 10.5 h14 v3.2 h-5.1 v12.6 H27 v3.2 H13 v-3.2 h5.1 V13.7 H13 Z" />
      </g>
    </svg>
  );
}

export function Wordmark({
  size = "md",
  subtitle = "التزام · Compliance readiness",
}: {
  size?: "md" | "lg";
  subtitle?: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark className={size === "lg" ? "h-11 w-11" : "h-9 w-9"} />
      <span className="flex flex-col justify-center leading-none">
        <span
          className={`display font-semibold tracking-[0.22em] ${
            size === "lg" ? "text-[22px]" : "text-[17px]"
          }`}
        >
          ILTZAM
        </span>
        {subtitle ? (
          <span className="mt-1.5 hidden text-[10px] font-medium tracking-[0.14em] text-brand-muted sm:inline-block">
            <span lang="ar" className="text-gold-bright">
              {subtitle.split(" · ")[0]}
            </span>
            {subtitle.includes(" · ") ? (
              <span className="uppercase"> · {subtitle.split(" · ")[1]}</span>
            ) : null}
          </span>
        ) : null}
      </span>
    </span>
  );
}
