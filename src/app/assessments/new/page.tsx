import { prisma } from "@/lib/db";
import { PageBand } from "@/components/PageBand";
import { NewAssessmentForm } from "./NewAssessmentForm";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  const regulations = await prisma.regulation.findMany({ orderBy: { code: "asc" } });
  const counts = await prisma.control.groupBy({
    by: ["sourceRegulationCode"],
    _count: { _all: true },
  });
  const countByCode = new Map(counts.map((c) => [c.sourceRegulationCode, c._count._all]));

  return (
    <main className="pb-16">
      <PageBand
        eyebrow="New compliance review"
        title="Open an assessment"
        lead="Tell us who this review is for and which regulations apply. Iltzam prepares your copy of every applicable control per regulation — answer in any order, progress saves as you go."
      />
      <div className="shell relative -mt-14 max-w-3xl">
        <div className="sheet px-5 py-6 sm:px-8 sm:py-8">
          <NewAssessmentForm
            regulations={regulations.map((r) => ({
              code: r.code,
              name: r.name,
              jurisdiction: r.jurisdiction,
              version: r.version,
              legalInstrument: r.legalInstrument,
              regulator: r.regulator,
              complianceDeadline: r.complianceDeadline
                ? formatDate(r.complianceDeadline)
                : null,
              status: r.status,
              controlCount: countByCode.get(r.code) ?? 0,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
