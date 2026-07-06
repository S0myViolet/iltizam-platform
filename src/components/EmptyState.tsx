import type { ReactNode } from "react";
import { SealMark } from "@/components/Wordmark";

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
      <SealMark className="mb-2 h-9 w-9 text-gold" />
      <h3 className="display text-lg font-semibold text-ink">{title}</h3>
      {body ? <p className="max-w-lg text-sm leading-6 text-ink2">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
