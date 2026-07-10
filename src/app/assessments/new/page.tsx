import { prisma } from "@/lib/db";
import { PageBand } from "@/components/PageBand";
import { NewAssessmentForm } from "./NewAssessmentForm";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  const regulations = await prisma.regulation.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { controlMappings: true } } },
  });

  return (
    <main className="pb-16">
      <PageBand
        eyebrow="New compliance review"
        title="Open an assessment"
        lead="Tell us who this review is for and which regulations apply. Iltzam prepares your copy of every applicable control — answer in any order, progress saves as you go."
      />
      <div className="shell relative -mt-14 max-w-3xl">
        <div className="sheet px-5 py-6 sm:px-8 sm:py-8">
          <NewAssessmentForm
            regulations={regulations.map((r) => ({
              code: r.code,
              name: r.name,
              version: r.version,
              status: r.status,
              controlCount: r._count.controlMappings,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
