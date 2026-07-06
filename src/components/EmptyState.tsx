import type { ReactNode } from "react";
import { LogoMark } from "@/components/Wordmark";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 border-y-2 border-line bg-surface2/40 px-6 py-14 text-center">
      <LogoMark className="mb-2 h-10 w-10" />
      <h3 className="display text-lg font-semibold text-ink">{title}</h3>
      {body ? <p className="max-w-lg text-sm leading-6 text-ink2">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
