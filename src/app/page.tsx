import Link from "next/link";
import { listAssessments } from "@/lib/assessments";
import { AssessmentStatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/EmptyState";
import { ScoreMeter } from "@/components/ScoreMeter";
import { formatDate, formatScore } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const assessments = await listAssessments();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assessments</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink2">
            Answer plain-language questions about how your company handles personal data, see
            where the potential gaps are, and track the work to close them — across EG-PDPL and
            EU-GDPR.
          </p>
        </div>
        <Link href="/assessments/new" className="btn btn-primary">
          Start a new assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          body="Start your first compliance self-assessment. You'll answer simple yes/no questions grouped by area — no legal jargon — and get a readiness score and a gap report at the end."
          action={
            <Link href="/assessments/new" className="btn btn-primary">
              Start a new assessment
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((a) => (
            <li key={a.id}>
              <Link
                href={`/assessments/${a.id}`}
                className="card block h-full px-4 py-4 transition-colors hover:border-line2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[15px] font-semibold leading-5">{a.companyName}</h2>
                  <AssessmentStatusBadge status={a.status} />
                </div>
                <p className="mt-1 text-xs text-ink3">
                  {[a.industry, a.country].filter(Boolean).join(" · ") || "—"}
                </p>
                <div className="mt-4 flex items-baseline justify-between text-sm">
                  <span className="text-ink2">Readiness</span>
                  <span className="font-semibold">{formatScore(a.readinessScore)}</span>
                </div>
                <ScoreMeter value={a.readinessScore} className="mt-1.5" />
                <div className="mt-3 flex items-center justify-between text-xs text-ink3">
                  <span>
                    {a.answeredControls}/{a.totalControls} controls answered
                  </span>
                  <span>{a.selectedRegimes.join(" · ")}</span>
                </div>
                <p className="mt-2 text-xs text-ink3">Started {formatDate(a.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
