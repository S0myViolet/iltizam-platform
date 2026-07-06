import { prisma } from "@/lib/db";
import { NewAssessmentForm } from "./NewAssessmentForm";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage() {
  const regulations = await prisma.regulation.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { controlMappings: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Start a new assessment</h1>
      <p className="mt-1 text-sm leading-6 text-ink2">
        Tell us who this assessment is for and which regulations apply. We&apos;ll set up your
        copy of every applicable control — you can answer them in any order and save as you go.
      </p>
      <NewAssessmentForm
        regulations={regulations.map((r) => ({
          code: r.code,
          name: r.name,
          version: r.version,
          status: r.status,
          controlCount: r._count.controlMappings,
        }))}
      />
    </main>
  );
}
