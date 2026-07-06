import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LEGAL_DISCLAIMER } from "@/lib/types";
import { SealMark, Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = {
  title: "Iltzam — Compliance readiness platform",
  description:
    "Assess, evidence and manage privacy-compliance obligations across EG-PDPL and EU-GDPR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        {/* Gold seal-line: the brand ribbon across the whole product */}
        <div aria-hidden className="print-hidden h-[3px] bg-gold" />

        <header className="band print-hidden sticky top-0 z-40 border-b border-brand-line">
          <div className="shell flex h-16 items-center justify-between">
            <Link
              href="/"
              className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
            >
              <Wordmark subtitle="Compliance readiness" />
            </Link>
            <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-medium text-brand-muted transition-colors hover:bg-brand2 hover:text-brand-ink"
              >
                Assessments
              </Link>
              <Link href="/assessments/new" className="btn btn-gold-on-band !py-1.5 !text-[13px]">
                New assessment
              </Link>
            </nav>
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
                <SealMark className="h-4 w-4 text-gold-bright/70" />
                Readiness scores describe self-assessed posture — never legal certification.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
