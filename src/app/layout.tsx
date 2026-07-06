import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LEGAL_DISCLAIMER } from "@/lib/types";

export const metadata: Metadata = {
  title: "Iltzam — Compliance self-assessment",
  description:
    "Understand, assess and manage privacy compliance obligations across EG-PDPL and EU-GDPR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <header className="print-hidden sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-ink">
                إ
              </span>
              <span className="text-[15px] font-semibold tracking-tight">Iltzam</span>
              <span className="mt-0.5 hidden text-xs text-ink3 sm:inline">
                Compliance self-assessment
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 font-medium text-ink2 transition-colors hover:bg-surface2 hover:text-ink"
              >
                Assessments
              </Link>
              <Link href="/assessments/new" className="btn btn-primary ml-1 !py-1.5">
                New assessment
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="print-hidden border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
            <p className="max-w-3xl text-xs leading-5 text-ink3">{LEGAL_DISCLAIMER}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
