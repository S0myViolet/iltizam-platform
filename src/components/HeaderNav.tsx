"use client";

// Workspace navigation. Inside an assessment the header carries the four
// section tabs of that review; everywhere else it shows the top-level nav.

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { slug: "", label: "Dashboard" },
  { slug: "questionnaire", label: "Control review" },
  { slug: "gaps", label: "Gap analysis" },
  { slug: "report", label: "Audit report" },
];

export function HeaderNav() {
  const pathname = usePathname();
  const match = pathname.match(/^\/assessments\/([^/]+)(?:\/([^/?]+))?/);
  const assessmentId = match && match[1] !== "new" ? match[1] : null;
  const section = match?.[2] ?? "";

  if (assessmentId) {
    return (
      <nav aria-label="Assessment sections" className="hidden items-center md:flex">
        {SECTIONS.map((s) => {
          const href = s.slug
            ? `/assessments/${assessmentId}/${s.slug}`
            : `/assessments/${assessmentId}`;
          const active = section === s.slug;
          return (
            <Link
              key={s.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`navtab ${active ? "navtab-active" : ""}`}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="hidden items-center sm:flex">
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={`navtab ${pathname === "/" ? "navtab-active" : ""}`}
      >
        Assessments
      </Link>
    </nav>
  );
}
