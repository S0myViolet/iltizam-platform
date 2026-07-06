import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { DOMAINS } from "@/data/controls";
import { Questionnaire } from "./Questionnaire";

export const dynamic = "force-dynamic";

export default async function QuestionnairePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ domain?: string; severity?: string; show?: string }>;
}) {
  const { id } = await params;
  const filters = await searchParams;
  const bundle = await getAssessmentBundle(id);
  if (!bundle) notFound();

  const domainBlurbs = Object.fromEntries(DOMAINS.map((d) => [d.name, d.blurb]));

  return (
    <Questionnaire
      assessment={bundle.assessment}
      initialRows={bundle.rows}
      domainBlurbs={domainBlurbs}
      initialDomain={filters.domain ?? "all"}
      initialSeverity={filters.severity ?? "all"}
      initialShow={filters.show ?? "all"}
    />
  );
}
