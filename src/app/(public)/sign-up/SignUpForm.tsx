"use client";

// Create-account form. Posts to /api/auth/signup, which creates the user,
// a fresh tenant workspace (client_admin), and a starter PDPL+GDPR
// assessment. Server-side validation messages are shown verbatim; a 409
// (email already registered) additionally offers the sign-in link.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setEmailTaken(false);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, organizationName, email, password }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Could not create the account. Try again."
        );
        setEmailTaken(res.status === 409);
        setBusy(false);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 text-ink sm:p-7">
      {error ? (
        <p
          role="alert"
          className="mb-5 rounded-md border border-crit/30 bg-crit/[0.06] px-3 py-2.5 text-[13px] leading-5 text-crit-text"
        >
          {error}
          {emailTaken ? (
            <>
              {" "}
              <Link
                href="/sign-in"
                className="font-semibold underline underline-offset-2 hover:text-crit"
              >
                Sign in
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div>
        <label htmlFor="signup-name" className="field-label">
          Your name
        </label>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="signup-organization" className="field-label">
          Organization name <span className="font-normal text-ink3">(optional)</span>
        </label>
        <input
          id="signup-organization"
          name="organizationName"
          type="text"
          autoComplete="organization"
          className="input"
          placeholder="A workspace is created with this name"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          disabled={busy}
          aria-describedby="signup-organization-hint"
        />
        <p id="signup-organization-hint" className="mt-1.5 text-[12px] leading-5 text-ink3">
          Your account becomes the administrator of a new workspace. Leave blank to name it after
          you.
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="signup-email" className="field-label">
          Email
        </label>
        <input
          id="signup-email"
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
        <label htmlFor="signup-password" className="field-label">
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          aria-describedby="signup-password-hint"
        />
        <p id="signup-password-hint" className="mt-1.5 text-[12px] leading-5 text-ink3">
          At least 8 characters.
        </p>
      </div>

      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p className="mt-5 border-t border-line pt-4 text-[13px] text-ink2">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-accent-strong underline underline-offset-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
