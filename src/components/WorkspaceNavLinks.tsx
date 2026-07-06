"use client";

// Section navigation inside the assessment workspace sidebar.

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { slug: "", label: "Dashboard" },
  { slug: "questionnaire", label: "Control review" },
  { slug: "gaps", label: "Gap analysis" },
  { slug: "report", label: "Audit report" },
];

export function WorkspaceNavLinks({ assessmentId }: { assessmentId: string }) {
  const pathname = usePathname();
  const section = pathname.match(/^\/assessments\/[^/]+\/?([^/?]*)/)?.[1] ?? "";

  return (
    <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
      {SECTIONS.map((s) => {
        const href = s.slug ? `/assessments/${assessmentId}/${s.slug}` : `/assessments/${assessmentId}`;
        const active = section === s.slug;
        return (
          <li key={s.label} className="shrink-0 lg:shrink">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md border-l-2 px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
                active
                  ? "border-l-gold bg-surface text-ink shadow-[var(--shadow-card)]"
                  : "border-l-transparent text-ink2 hover:bg-surface hover:text-ink"
              }`}
            >
              {s.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
