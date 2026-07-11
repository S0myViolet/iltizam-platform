"use client";

// Sign-in form + optional demonstration-accounts panel. Email/password only —
// authentication is first-party (signed session cookie); there are no
// third-party identity providers. Selecting a demonstration account fills the
// fields and nothing more: the user always presses Sign in themselves.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export interface DemoAccount {
  email: string;
  label: string;
  name: string;
}

export function SignInForm({
  demoAccounts,
  prefillPassword,
}: {
  demoAccounts?: DemoAccount[];
  prefillPassword?: string;
}) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unrecognized, setUnrecognized] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setUnrecognized(false);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: { error?: string; isPlatformAdmin?: boolean } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        // 401 carries the deliberately non-revealing message — show it verbatim.
        setError(typeof data.error === "string" ? data.error : "Sign-in failed. Try again.");
        setUnrecognized(res.status === 401);
        setBusy(false);
        return;
      }
      router.push(data.isPlatformAdmin ? "/admin/backend-operations" : "/app");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  // Fills the fields only — never submits on the user's behalf.
  function prefill(account: DemoAccount) {
    setEmail(account.email);
    setPassword(prefillPassword ?? "");
    setError(null);
    setUnrecognized(false);
    emailRef.current?.focus();
  }

  return (
    <div>
      {/* The sign-in sheet: a light card on the ink band. */}
      <form onSubmit={handleSubmit} className="card p-6 text-ink sm:p-7">
        {error ? (
          <p
            role="alert"
            className="mb-5 rounded-md border border-crit/30 bg-crit/[0.06] px-3 py-2.5 text-[13px] leading-5 text-crit-text"
          >
            {error}
            {unrecognized ? (
              <>
                {" "}
                <Link
                  href="/sign-up"
                  className="font-semibold underline underline-offset-2 hover:text-crit"
                >
                  Create an account
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        <div>
          <label htmlFor="signin-email" className="field-label">
            Email
          </label>
          <input
            ref={emailRef}
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="signin-password" className="field-label">
            Password
          </label>
          <input
            id="signin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </div>

        <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-5 border-t border-line pt-4 text-[13px] text-ink2">
          New to Iltzam?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-accent-strong underline underline-offset-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Create an account
          </Link>
        </p>
      </form>

      {demoAccounts && demoAccounts.length > 0 ? (
        <section
          aria-labelledby="demo-accounts-heading"
          className="mt-8 rounded-lg border border-brand-line bg-brand2/50 p-5"
        >
          <p id="demo-accounts-heading" className="eyebrow text-gold-bright">
            Demonstration accounts
          </p>
          <p className="mt-2 text-[13px] leading-5 text-brand-muted">
            Select an account to fill the form. Nothing is submitted until you press Sign in.
          </p>
          <ul className="mt-4 divide-y divide-brand-line border-y border-brand-line">
            {demoAccounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => prefill(account)}
                  className="flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left transition-colors hover:bg-brand2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold-bright"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-brand-ink">
                      {account.name}
                    </span>
                    <span className="block truncate font-mono text-[12px] text-brand-muted">
                      {account.email}
                    </span>
                  </span>
                  <span className="tag shrink-0 border border-brand-line text-brand-muted">
                    {account.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-brand-ink">
            Shared demo password:{" "}
            <code className="rounded bg-brand px-1.5 py-0.5 font-mono text-[12.5px] text-gold-bright">
              {prefillPassword}
            </code>
          </p>
          <p className="mt-3 text-[12px] leading-5 text-brand-muted">
            These accounts belong to a fictional organization. All demonstration data is
            synthetic — no real people, companies, or records.
          </p>
        </section>
      ) : null}
    </div>
  );
}
