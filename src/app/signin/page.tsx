// Sign-in cover page. Demo-grade authentication: seeded users only, no
// self-signup and no password ceremony — the page lists who you can
// demonstrate as. Authorization stays entirely server-side per membership
// role; the cookie set by /api/auth/signin only identifies the user.

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLE_LABELS, type MembershipRole } from "@/lib/types";
import { Wordmark } from "@/components/Wordmark";
import { SignInForm, type DemoUser } from "./SignInForm";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await getSession();
  if (session) redirect("/");

  const users = await prisma.user.findMany({
    include: {
      memberships: {
        where: { status: "active" },
        include: { organization: { select: { name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const demoUsers: DemoUser[] = users.map((user) => {
    const membership = user.memberships[0];
    const role = membership?.role;
    return {
      name: user.name,
      email: user.email,
      roleLabel: user.isPlatformAdmin
        ? "Platform administrator"
        : role && role in ROLE_LABELS
          ? ROLE_LABELS[role as MembershipRole]
          : "No active membership",
      organizationName: membership?.organization.name ?? null,
    };
  });

  return (
    <main className="band">
      <section
        aria-label="Sign in"
        className="shell flex min-h-[70vh] flex-col items-center justify-center py-14 sm:py-16"
      >
        <Wordmark size="lg" />

        <p className="eyebrow mt-10 text-gold-bright">Demonstration workspace</p>
        <h1 className="display mt-3 max-w-2xl text-center text-[34px] leading-[1.15] font-semibold sm:text-4xl">
          Sign in to the demonstration
        </h1>
        <p className="mt-4 max-w-xl text-center text-[15px] leading-7 text-brand-muted">
          This workspace is seeded with sample organizations, assessments and evidence. Choose a
          seeded user to demonstrate as — there is no password ceremony, and every permission is
          still enforced server-side by membership role.
        </p>

        <div className="sheet mt-10 w-full max-w-2xl !rounded-2xl p-5 text-left text-ink sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-line pb-3">
            <p className="eyebrow text-gold-text">Seeded users</p>
            <span className="text-xs text-ink3 tabular-nums">
              {demoUsers.length} account{demoUsers.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-4">
            <SignInForm users={demoUsers} />
          </div>
        </div>

        <p className="mt-6 max-w-xl text-center text-xs leading-5 text-brand-muted/80">
          Demonstration sessions expire after 12 hours. Sign-ins are recorded in the audit trail.
        </p>
      </section>
    </main>
  );
}
