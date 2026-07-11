"use client";

// Public-site navigation. Parchment header — deliberately not the ink band,
// which is reserved for the authenticated product chrome. The mobile menu is
// the only interactivity on the landing page, which is why this is its lone
// client component.

import Link from "next/link";
import { useState } from "react";
import { Wordmark } from "@/components/Wordmark";

const SECTION_LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#monitoring", label: "Monitoring" },
  { href: "#regulations", label: "Regulations" },
] as const;

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/95 backdrop-blur">
      <div className="shell flex h-16 items-center gap-3">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {/* Subtitle omitted: its band-muted tones are tuned for ink, not parchment. */}
          <Wordmark subtitle={null} />
        </Link>

        <nav aria-label="Sections" className="ml-4 hidden items-center lg:flex">
          {SECTION_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-[13px] font-medium text-ink2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 sm:flex">
          <Link href="/sign-in" className="btn !py-1.5 !text-[13px]">
            Sign in
          </Link>
          <Link href="/platform" className="btn btn-primary !py-1.5 !text-[13px]">
            Begin your readiness review
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="landing-menu"
          onClick={() => setOpen((v) => !v)}
          className="btn ml-auto !px-2.5 !py-1.5 sm:ml-0 lg:hidden"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-5 w-5"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            {open ? (
              <>
                <path d="M5 5l10 10" />
                <path d="M15 5L5 15" />
              </>
            ) : (
              <>
                <path d="M3.5 6h13" />
                <path d="M3.5 10h13" />
                <path d="M3.5 14h13" />
              </>
            )}
          </svg>
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      {open ? (
        <nav id="landing-menu" aria-label="Menu" className="border-t border-line bg-page lg:hidden">
          <div className="shell flex flex-col gap-1 py-4">
            {SECTION_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-ink2 hover:bg-surface2 hover:text-ink"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-line pt-4 sm:hidden">
              <Link href="/sign-in" onClick={() => setOpen(false)} className="btn">
                Sign in
              </Link>
              <Link href="/platform" onClick={() => setOpen(false)} className="btn btn-primary">
                Begin your readiness review
              </Link>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
