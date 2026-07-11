// Create an account — public page in the same formal-sheet style as sign-in.
// Each new account gets its own tenant workspace and a starter PDPL+GDPR
// assessment (see /api/auth/signup). Authenticated visitors go to /app.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Wordmark } from "@/components/Wordmark";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create an account — Iltzam",
  description: "Create an Iltzam account and a compliance workspace for your organization.",
};

export default async function SignUpPage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <div className="band flex min-h-screen flex-col">
      <main className="shell flex flex-1 justify-center py-10 sm:py-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
          >
            <Wordmark />
          </Link>

          <p className="eyebrow mt-10 text-gold-bright">New workspace</p>
          <h1 className="display mt-3 text-3xl font-semibold text-brand-ink">Create an account</h1>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            You become the administrator of a new organization workspace, with a starter Egypt
            PDPL and EU GDPR readiness review ready to work through.
          </p>

          <div className="mt-7">
            <SignUpForm />
          </div>

          <p className="mt-8">
            <Link
              href="/"
              className="rounded-md text-[13px] font-medium text-brand-muted transition-colors hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-bright"
            >
              ← Back to the website
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
