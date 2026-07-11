// Backend data explorer — single-dataset record view. Platform-admin-only,
// read-only: rows arrive already sanitized from src/lib/explorer.ts and every
// value is rendered as plain text (no raw HTML ever reaches the page).

import Link from "next/link";
import { notFound } from "next/navigation";
import { demoToolsEnabled } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/page-auth";
import { EmptyState } from "@/components/EmptyState";
import { exploreRows } from "@/lib/explorer";

export const dynamic = "force-dynamic";

/** Column order preference; anything else fills the remaining slots. */
const PREFERRED_COLUMNS = [
  "id",
  "name",
  "displayName",
  "title",
  "code",
  "controlCode",
  "ruleCode",
  "question",
  "email",
  "summary",
  "action",
  "fileName",
  "type",
  "status",
  "severity",
  "createdAt",
];

const MAX_COLUMNS = 8;
const MAX_CELL_CHARS = 80;
const MAX_DETAIL_CHARS = 4000;

function pickColumns(row: Record<string, unknown>): string[] {
  const keys = Object.keys(row);
  const preferred = PREFERRED_COLUMNS.filter((k) => keys.includes(k));
  const rest = keys.filter((k) => !preferred.includes(k));
  return [...preferred, ...rest].slice(0, MAX_COLUMNS);
}

function prettyJson(value: string): string | null {
  const trimmed = value.trim();
  const looksStructured =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));
  if (!looksStructured) return null;
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return null;
  }
}

function ExpandableValue({ text }: { text: string }) {
  const clipped =
    text.length > MAX_DETAIL_CHARS ? `${text.slice(0, MAX_DETAIL_CHARS)}\n… (truncated)` : text;
  return (
    <details>
      <summary className="cursor-pointer text-[11.5px] font-semibold text-accent-strong select-none hover:underline">
        view
      </summary>
      <pre className="mt-1.5 max-w-md rounded-md border border-line bg-surface2/50 p-2.5 font-mono text-[10.5px] leading-4 whitespace-pre-wrap text-ink2">
        {clipped}
      </pre>
    </details>
  );
}

/** Every value renders as text nodes — never as markup. */
function CellValue({ column, value }: { column: string; value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-ink3">—</span>;
  }
  if (value instanceof Date) {
    return (
      <time
        dateTime={value.toISOString()}
        title={value.toISOString()}
        className="whitespace-nowrap tabular-nums"
      >
        {value.toISOString().slice(0, 10)}
      </time>
    );
  }
  if (typeof value === "boolean") {
    return (
      <span className={`font-mono text-[11px] font-semibold ${value ? "text-ink" : "text-ink3"}`}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className="tabular-nums">{String(value)}</span>;
  }
  if (typeof value === "object") {
    return <ExpandableValue text={JSON.stringify(value, null, 2)} />;
  }

  const text = String(value);
  const structured = prettyJson(text);
  if (structured !== null) {
    return <ExpandableValue text={structured} />;
  }
  if (text.length > MAX_CELL_CHARS) {
    return <span title={text}>{text.slice(0, MAX_CELL_CHARS)}…</span>;
  }
  if (column === "id" || column.endsWith("Id") || column.endsWith("Key")) {
    return <span className="font-mono text-[11px] whitespace-nowrap text-ink3">{text}</span>;
  }
  return <span>{text}</span>;
}

function pageHref(table: string, page: number, q: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  const query = params.toString();
  return `/admin/data-explorer/${table}${query ? `?${query}` : ""}`;
}

export default async function DataExplorerTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await requirePageSession();
  if (!session.isPlatformAdmin || !demoToolsEnabled()) notFound();

  const { table } = await params;
  const { page: pageParam, q: qParam } = await searchParams;
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const q = (qParam ?? "").trim();

  const result = await exploreRows(prisma, table, {
    page: Number.isNaN(requestedPage) ? 1 : requestedPage,
    search: q,
  });
  if (!result) notFound();

  const { label, total, rows, page, pageSize } = result;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const columns = rows.length > 0 ? pickColumns(rows[0]) : [];
  const firstRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = (page - 1) * pageSize + rows.length;

  return (
    <main className="shell py-8 pb-16">
      {/* Section header */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 border-line pb-4">
        <div className="max-w-2xl">
          <Link
            href="/admin/data-explorer"
            className="text-xs font-semibold text-accent-strong hover:underline"
          >
            ← All datasets
          </Link>
          <h1 className="display mt-1.5 text-2xl font-semibold tracking-tight">{label}</h1>
          <p className="mt-0.5 text-[13px] leading-5 text-ink3">
            <span className="font-semibold text-ink2 tabular-nums">
              {total.toLocaleString("en-GB")}
            </span>{" "}
            record{total === 1 ? "" : "s"} on file
            {q ? (
              <>
                {" "}
                matching <span className="font-semibold text-ink2">“{q}”</span>
              </>
            ) : null}
            {" · "}sanitized, read-only view
          </p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <label htmlFor="explorer-q" className="sr-only">
            Search {label}
          </label>
          <input
            id="explorer-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder={`Search ${label.toLowerCase()}…`}
            className="input !w-60 !py-1.5 !text-[13px]"
          />
          <button type="submit" className="btn !py-1.5 !text-[13px]">
            Search
          </button>
          {q ? (
            <Link
              href={pageHref(table, 1, "")}
              className="text-xs font-medium text-ink3 hover:text-ink hover:underline"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </header>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={q ? "No matching records" : "No records persisted yet"}
            body={
              q
                ? `Nothing in ${label.toLowerCase()} matches “${q}”. Search checks one text column per dataset.`
                : `The ${label.toLowerCase()} dataset has no rows on file. Records appear here as soon as the backend persists them.`
            }
            action={
              q ? (
                <Link href={pageHref(table, 1, "")} className="btn">
                  Clear search
                </Link>
              ) : (
                <Link href="/admin/data-explorer" className="btn">
                  Back to all datasets
                </Link>
              )
            }
          />
        </div>
      ) : (
        <section aria-label={`${label} records`} className="card mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b-2 border-line bg-surface2/50">
                  {columns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-3.5 py-2.5 font-mono text-[10px] font-semibold tracking-wider whitespace-nowrap text-ink3"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row, index) => (
                  <tr
                    key={typeof row.id === "string" ? row.id : index}
                    className="align-top transition-colors hover:bg-surface2/30"
                  >
                    {columns.map((column) => (
                      <td key={column} className="max-w-xs px-3.5 py-2.5 leading-5 text-ink2">
                        <CellValue column={column} value={row[column]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-line bg-surface2/30 px-3.5 py-2.5">
            <p className="text-xs text-ink3 tabular-nums">
              Showing {firstRecord.toLocaleString("en-GB")}–{lastRecord.toLocaleString("en-GB")} of{" "}
              {total.toLocaleString("en-GB")} · page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link href={pageHref(table, page - 1, q)} className="btn !px-3 !py-1 !text-xs">
                  ← Prev
                </Link>
              ) : (
                <span className="btn cursor-not-allowed !px-3 !py-1 !text-xs opacity-50">
                  ← Prev
                </span>
              )}
              {page < totalPages ? (
                <Link href={pageHref(table, page + 1, q)} className="btn !px-3 !py-1 !text-xs">
                  Next →
                </Link>
              ) : (
                <span className="btn cursor-not-allowed !px-3 !py-1 !text-xs opacity-50">
                  Next →
                </span>
              )}
            </div>
          </footer>
        </section>
      )}

      <p className="mt-8 max-w-3xl text-xs leading-5 text-ink3">
        Credential references, storage keys and secret-like fields are removed before rendering.
        Where this dataset holds output of automated scans or rules-based checks, each row is a
        potential finding awaiting review — not a confirmed compliance position.
      </p>
    </main>
  );
}
