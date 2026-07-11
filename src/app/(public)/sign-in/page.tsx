// Sign in — a public page styled as a formal sign-in sheet on the deep-ink
// band. Already-authenticated visitors are sent straight to the workspace.
// When demo tools are enabled, the seeded demonstration accounts are listed
// below the form so a reviewer can enter the product in any role.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { demoToolsEnabled, getSession } from "@/lib/auth";
import { demoAdminCredentials, demoUserPassword } from "@/lib/passwords";
import { DEMO_USERS, PLATFORM_ADMIN } from "@/data/demo";
import { ROLE_LABELS } from "@/lib/types";
import { Wordmark } from "@/components/Wordmark";
import { SignInForm, type DemoAccount } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in — Iltzam",
  description: "Sign in to the Iltzam compliance readiness workspace.",
};

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect("/app");

  // demoToolsEnabled(): ENABLE_DEMO_TOOLS === "true" or any non-production build.
  const showDemo = demoToolsEnabled();
  const demoAccounts: DemoAccount[] | undefined = showDemo
    ? [
        {
          email: demoAdminCredentials().email,
          label: "Platform administrator",
          name: PLATFORM_ADMIN.name,
        },
        ...DEMO_USERS.map((u) => ({ email: u.email, label: ROLE_LABELS[u.role], name: u.name })),
      ]
    : undefined;

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

          <p className="eyebrow mt-10 text-gold-bright">Account access</p>
          <h1 className="display mt-3 text-3xl font-semibold text-brand-ink">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Enter the email and password for your workspace account.
          </p>

          <div className="mt-7">
            <SignInForm
              demoAccounts={demoAccounts}
              prefillPassword={showDemo ? demoUserPassword() : undefined}
            />
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
