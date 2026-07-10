"use client";

// Seeded-user picker. Clicking a card POSTs the user's email to
// /api/auth/signin (which sets the HTTP-only session cookie), then routes to
// the workspace. State is deliberately minimal: one pending card, one error
// line — authorization decisions all live server-side.

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface DemoUser {
  name: string;
  email: string;
  roleLabel: string;
  organizationName: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function SignInForm({ users }: { users: DemoUser[] }) {
  const router = useRouter();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInAs(email: string) {
    if (pendingEmail) return;
    setPendingEmail(email);
    setError(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Sign-in failed. Please try again.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setPendingEmail(null);
    }
  }

  if (users.length === 0) {
    return (
      <p className="text-sm leading-6 text-ink3">
        No seeded users found. Run the database seed, then reload this page.
      </p>
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-2.5">
        {users.map((user) => {
          const isPending = pendingEmail === user.email;
          return (
            <li key={user.email}>
              <button
                type="button"
                onClick={() => signInAs(user.email)}
                disabled={pendingEmail !== null}
                aria-busy={isPending}
                className={`card group flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isPending
                    ? "!border-accent/50 bg-accent/[0.04]"
                    : pendingEmail
                      ? "cursor-not-allowed opacity-45"
                      : "cursor-pointer hover:border-line2 hover:bg-surface2/40"
                }`}
              >
                <span
                  aria-hidden
                  className="display flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-brand-line bg-brand text-[13px] font-semibold tracking-wide text-gold-bright"
                >
                  {initials(user.name)}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-[15px] leading-5 font-semibold">{user.name}</span>
                    <span
                      className={`tag ${
                        user.roleLabel === "Platform administrator"
                          ? "border border-gold/40 bg-gold/[0.08] text-gold-text"
                          : "tag-outline"
                      }`}
                    >
                      {user.roleLabel}
                    </span>
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-ink3">
                    <span>{user.organizationName ?? "Platform-wide access"}</span>
                    <span className="font-mono text-[11px]">{user.email}</span>
                  </span>
                </span>

                <span
                  className={`shrink-0 text-[12px] font-semibold whitespace-nowrap ${
                    isPending
                      ? "animate-pulse text-accent-strong"
                      : "text-ink3 transition-colors group-hover:text-accent-strong"
                  }`}
                >
                  {isPending ? "Signing in…" : "Sign in →"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p role="alert" className="mt-3 text-[13px] font-medium text-crit-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
