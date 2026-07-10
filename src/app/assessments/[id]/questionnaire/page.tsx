import { notFound } from "next/navigation";
import { getAssessmentBundle } from "@/lib/assessments";
import { requirePageSession, requireAssessmentPage } from "@/lib/page-auth";
import { roleHasPermission } from "@/lib/types";
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
  const session = await requirePageSession();
  const record = await requireAssessmentPage(session, id);
  const bundle = await getAssessmentBundle(id);
  if (!bundle) notFound();

  const membership = session.memberships.find((m) => m.organizationId === record.organizationId);
  const canReviewEvidence =
    session.isPlatformAdmin ||
    (membership ? roleHasPermission(membership.role, "evidence.review") : false);
  const canAddEvidence =
    session.isPlatformAdmin ||
    (membership ? roleHasPermission(membership.role, "evidence.add") : false);

  const domainBlurbs = Object.fromEntries(DOMAINS.map((d) => [d.name, d.blurb]));

  return (
    <Questionnaire
      // Re-key on queue/domain navigation so clicking a sidebar work queue
      // re-initialises the working state (rows re-read from the server).
      key={`${filters.domain ?? "all"}|${filters.severity ?? "all"}|${filters.show ?? "all"}`}
      assessment={bundle.assessment}
      initialRows={bundle.rows}
      domainBlurbs={domainBlurbs}
      initialDomain={filters.domain ?? "all"}
      initialSeverity={filters.severity ?? "all"}
      initialShow={filters.show ?? "all"}
      canReviewEvidence={canReviewEvidence}
      canAddEvidence={canAddEvidence}
    />
  );
}
