// Authenticated application chrome: the band header (product navigation,
// session chip) and footer wrap every in-app page. Public pages — the
// landing, /platform, sign-in and sign-up — live in the (public) group and
// carry their own look.

import Link from "next/link";
import { LEGAL_DISCLAIMER, ROLE_LABELS } from "@/lib/types";
import { LogoMark, Wordmark } from "@/components/Wordmark";
import { HeaderNav } from "@/components/HeaderNav";
import { HeaderSession } from "@/components/HeaderSession";
import { getSession } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="band print-hidden sticky top-0 z-40 border-b border-brand-line">
        <div className="shell flex h-16 items-center gap-5">
          {/* Signed in → the application home; signed out → the public site. */}
          <Link
            href={session ? "/app" : "/"}
            className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
          >
            <Wordmark />
          </Link>
          {session ? (
            <>
              <nav aria-label="Product" className="hidden items-center md:flex">
                <HeaderNav />
                <Link href="/inventory" className="navtab">
                  Inventory
                </Link>
                <Link href="/monitoring" className="navtab">
                  Monitoring
                </Link>
                {session.isPlatformAdmin ? (
                  <>
                    <Link href="/admin/backend-operations" className="navtab !text-gold-bright">
                      Backend operations
                    </Link>
                    <Link href="/admin/data-explorer" className="navtab !text-gold-bright">
                      Data explorer
                    </Link>
                  </>
                ) : null}
              </nav>
              <div className="ml-auto">
                <HeaderSession
                  name={session.name}
                  roleLabel={
                    session.isPlatformAdmin
                      ? "Platform administrator"
                      : session.activeOrg
                        ? ROLE_LABELS[session.activeOrg.role]
                        : "No organization"
                  }
                  organizationName={session.activeOrg?.organizationName ?? null}
                />
              </div>
            </>
          ) : (
            <div className="ml-auto flex items-center gap-4">
              <Link href="/" className="text-[13px] font-semibold text-gold-bright hover:underline">
                Main website
              </Link>
              <Link href="/sign-in" className="btn btn-gold-on-band !py-1.5 !text-[13px]">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="band print-hidden mt-auto border-t border-brand-line">
        <div className="shell flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-[13px] leading-6 text-brand-muted">
              A compliance operating platform for EG-PDPL, EU-GDPR and the regulations that
              come next.
            </p>
            <Link
              href="/"
              className="mt-3 inline-block text-[13px] font-semibold text-gold-bright hover:underline"
            >
              Visit the main website ↗
            </Link>
          </div>
          <div className="max-w-md">
            <p className="eyebrow text-gold-bright">A note on scope</p>
            <p className="mt-3 text-[13px] leading-6 text-brand-muted">{LEGAL_DISCLAIMER}</p>
            <p className="mt-4 flex items-center gap-2 text-[12px] text-brand-muted/80">
              <LogoMark className="h-5 w-5" />
              Readiness scores describe self-assessed posture — never legal certification.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
