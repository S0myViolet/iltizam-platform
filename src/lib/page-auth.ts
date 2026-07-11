// Server-page session guards: redirect to /sign-in when unauthenticated,
// 404 on cross-tenant access (never confirm existence to another tenant).

import { notFound, redirect } from "next/navigation";
import { getSession, type Session } from "./auth";
import { prisma } from "./db";

export async function requirePageSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireAssessmentPage(session: Session, assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, organizationId: true },
  });
  if (!assessment) notFound();
  const member = session.memberships.find((m) => m.organizationId === assessment.organizationId);
  if (!member && !session.isPlatformAdmin) notFound();
  return assessment;
}
