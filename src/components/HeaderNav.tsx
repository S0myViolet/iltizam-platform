"use client";

// Top-level product navigation. Workspace sections and work queues live in
// the assessment sidebar (see assessments/[id]/layout.tsx).

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="hidden items-center sm:flex">
      <Link
        href="/app"
        aria-current={pathname === "/app" ? "page" : undefined}
        className={`navtab ${pathname === "/app" ? "navtab-active" : ""}`}
      >
        Assessments
      </Link>
    </nav>
  );
}
