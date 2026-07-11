"use client";

// Session chip in the product header: who you are, your role, sign out.

import { useRouter } from "next/navigation";

export function HeaderSession({
  name,
  roleLabel,
  organizationName,
}: {
  name: string;
  roleLabel: string;
  organizationName: string | null;
}) {
  const router = useRouter();
  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right leading-tight sm:block">
        <p className="text-[12.5px] font-semibold text-brand-ink">{name}</p>
        <p className="text-[10.5px] text-brand-muted">
          {roleLabel}
          {organizationName ? ` · ${organizationName}` : ""}
        </p>
      </div>
      <button type="button" onClick={signOut} className="btn btn-on-band !px-3 !py-1.5 !text-[12px]">
        Sign out
      </button>
    </div>
  );
}
