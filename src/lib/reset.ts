// Reset Demonstration — restores the demo organization to its seeded state.
// Guarded three ways before this module is ever called: platform-admin
// session, ENABLE_DEMO_TOOLS, and the demoOrganization flag re-checked here.
// Global regulations, control libraries and monitoring rules are never
// touched; a non-demo organization can never be reset.

import { prisma } from "./db";
import { writeAudit } from "./audit";
import { seedDemo, DEMO_ASSESSMENT_TITLE } from "./seeding";
import { generateVault } from "./vault";

export async function resetDemonstration(input: {
  organizationId: string;
  actorUserId: string;
  actorName: string;
}): Promise<{ ok: true }> {
  const org = await prisma.organization.findUnique({ where: { id: input.organizationId } });
  if (!org || !org.demoOrganization) {
    throw new Error("Reset is only permitted for the designated demonstration organization.");
  }

  // Remove scan-generated artefacts (order respects FKs; most cascade).
  await prisma.findingControlMapping.deleteMany({
    where: { finding: { organizationId: org.id } },
  });
  await prisma.monitoringFinding.deleteMany({ where: { organizationId: org.id } });
  await prisma.connectorResource.deleteMany({ where: { organizationId: org.id } });
  await prisma.synchronizationRun.deleteMany({ where: { organizationId: org.id } });
  await prisma.dataInventoryItem.deleteMany({
    where: { organizationId: org.id, sourceType: "connector" },
  });
  await prisma.report.deleteMany({ where: { organizationId: org.id } });
  // The runs are gone, so the connector's sync stamps must not survive them,
  // and active monitoring stops with them.
  await prisma.connector.updateMany({
    where: { organizationId: org.id },
    data: {
      lastSyncAt: null, lastSuccessfulSyncAt: null, lastError: null,
      monitoringEnabled: false, nextSyncAt: null, status: "connected",
    },
  });

  // Restore the synthetic vault byte-for-byte (removes injected changes/files).
  await generateVault({ force: true });

  // Restore the demonstration assessment to its seeded answer plan.
  await prisma.assessment.deleteMany({
    where: { organizationId: org.id, title: DEMO_ASSESSMENT_TITLE },
  });
  await seedDemo(prisma);

  await writeAudit({
    organizationId: org.id,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    origin: "human",
    action: "demonstration_reset",
    entityType: "Organization",
    entityId: org.id,
    summary: "Demonstration reset: scan artefacts removed, synthetic vault regenerated, demo assessment restored to its seeded state.",
  });
  return { ok: true };
}
