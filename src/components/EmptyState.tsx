import type { ReactNode } from "react";

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
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div
        aria-hidden
        className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface2 text-lg text-ink3"
      >
        ◎
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {body ? <p className="max-w-md text-sm leading-6 text-ink2">{body}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
