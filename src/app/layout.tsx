import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LEGAL_DISCLAIMER } from "@/lib/types";
import { LogoMark, Wordmark } from "@/components/Wordmark";
import { HeaderNav } from "@/components/HeaderNav";

export const metadata: Metadata = {
  title: "Iltzam — Compliance readiness platform",
  description:
    "Turn privacy obligations into accountable control work across EG-PDPL and EU-GDPR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning on the roots only: browser extensions (ad
    // blockers, download managers) inject attributes into <html>/<body>
    // before React hydrates, which otherwise trips a spurious mismatch
    // warning. Real hydration bugs inside the page are still reported.
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        <header className="band print-hidden sticky top-0 z-40 border-b border-brand-line">
          <div className="shell flex h-16 items-center gap-6">
            <Link
              href="/"
              className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
            >
              <Wordmark />
            </Link>
            <div className="ml-auto flex items-center gap-4">
              <HeaderNav />
              <Link
                href="/assessments/new"
                className="btn btn-gold-on-band !py-1.5 !text-[13px] whitespace-nowrap"
              >
                Start review
              </Link>
            </div>
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
      </body>
    </html>
  );
}
