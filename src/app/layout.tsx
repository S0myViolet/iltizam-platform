import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
