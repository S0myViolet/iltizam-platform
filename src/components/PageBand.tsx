import type { ReactNode } from "react";

// The full-bleed deep-ink band that opens every page. Content sheets overlap
// it (see .sheet + negative margin in pages), which gives the product its
// layered, composed structure instead of a centered card grid.

export function PageBand({
  eyebrow,
  title,
  lead,
  meta,
  actions,
  children,
  depth = "deep",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  /** Small line above the eyebrow — breadcrumb or context. */
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  /** deep = tall band for pages with an overlapping sheet; shallow = compact. */
  depth?: "deep" | "shallow";
}) {
  return (
    <header className="band">
      <div className={`shell pt-7 sm:pt-9 ${depth === "deep" ? "pb-20 sm:pb-24" : "pb-8 sm:pb-10"}`}>
        {meta ? <div className="mb-4 text-[13px] text-brand-muted">{meta}</div> : null}
        <p className="eyebrow text-gold-bright">{eyebrow}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <h1 className="display max-w-3xl text-[28px] leading-tight font-semibold sm:text-4xl">
            {title}
          </h1>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {lead ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-brand-muted">{lead}</p>
        ) : null}
        {children}
      </div>
    </header>
  );
}
