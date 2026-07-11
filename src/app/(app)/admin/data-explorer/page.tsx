// Backend data explorer — platform-admin-only index of every inspectable
// dataset in the persistence layer, grouped by schema layer. Strictly
// read-only: rows are sanitized in src/lib/explorer.ts before rendering.

import Link from "next/link";
import { notFound } from "next/navigation";
import { demoToolsEnabled } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requirePageSession } from "@/lib/page-auth";
import { EXPLORER_DATASETS, EXPLORER_GROUPS, exploreCounts } from "@/lib/explorer";

export const dynamic = "force-dynamic";

export default async function DataExplorerPage() {
  const session = await requirePageSession();
  if (!session.isPlatformAdmin || !demoToolsEnabled()) notFound();

  const counts = await exploreCounts(prisma);
  const totalRecords = counts.reduce((sum, c) => sum + c.count, 0);
  const groups = EXPLORER_GROUPS.map((group) => ({
    group,
    datasets: counts.filter((c) => EXPLORER_DATASETS[c.key].group === group),
  })).filter((g) => g.datasets.length > 0);

  return (
    <main className="shell py-8 pb-16">
      {/* Section header */}
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b-2 border-line pb-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-gold-text">Platform administration</p>
          <h1 className="display mt-1.5 text-2xl font-semibold tracking-tight">
            Backend data explorer
          </h1>
          <p className="mt-0.5 text-[13px] leading-5 text-ink3">
            Authorized inspection of persisted backend records. Read-only.
          </p>
        </div>
        <dl className="flex items-start gap-6 text-right">
          <div>
            <dd className="text-2xl font-semibold tabular-nums">{counts.length}</dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Datasets
            </dt>
          </div>
          <div>
            <dd className="text-2xl font-semibold tabular-nums">
              {totalRecords.toLocaleString("en-GB")}
            </dd>
            <dt className="text-[10px] font-semibold tracking-[0.08em] text-ink3 uppercase">
              Records on file
            </dt>
          </div>
        </dl>
      </header>

      <div className="mt-8 flex flex-col gap-9">
        {groups.map(({ group, datasets }) => (
          <section key={group} aria-label={group} className="panel">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="eyebrow text-gold-text">{group}</p>
              <span className="text-xs text-ink3 tabular-nums">
                {datasets.reduce((sum, d) => sum + d.count, 0).toLocaleString("en-GB")} records
              </span>
            </div>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {datasets.map((d) => (
                <Link
                  key={d.key}
                  href={`/admin/data-explorer/${d.key}`}
                  className="card group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:border-line2 hover:bg-surface2/40"
                >
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold group-hover:text-accent-strong">
                      {d.label}
                    </h2>
                    <p className="mt-0.5 truncate font-mono text-[10.5px] tracking-wide text-ink3">
                      {d.key}
                    </p>
                  </div>
                  <span className="display shrink-0 text-xl font-semibold tabular-nums">
                    {d.count.toLocaleString("en-GB")}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 max-w-3xl border-t-2 border-line pt-4 text-xs leading-5 text-ink3">
        Rows are sanitized before rendering — credential references, storage keys and
        identity-provider identifiers are removed, and user records expose directory fields only.
        Monitoring datasets contain output of automated scans and rules-based checks; a potential
        finding recorded there remains a finding awaiting review until a human confirms it.
      </p>
    </main>
  );
}
