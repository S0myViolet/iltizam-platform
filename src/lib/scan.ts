// Demonstration scan orchestrator — the monitoring pipeline end to end:
//
//   connector → discover → normalize → persist resources → upsert inventory
//   → evaluate deterministic rules → persist findings (deduplicated) → map
//   findings to controls → snapshot the official position → audit every stage
//
// Everything persists to the database; the run row's `stage` advances so the
// UI can poll visible progress. The official score is snapshotted before and
// after — and does NOT change from the scan itself: new findings are created
// as `new` and require human review.

import { prisma } from "./db";
import { writeAudit } from "./audit";
import { getConnectorProvider } from "./connectors";
import { evaluateRulesForResource } from "./monitoring";
import { MONITORING_RULES } from "@/data/monitoring-rules";
import { snapshotOfficialPosition } from "./assessments";
import type { SyncStage } from "./types";

const STAGE_DELAY_MS = 650; // visible progress pacing for the demonstration

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function setStage(runId: string, stage: SyncStage, extra: Record<string, unknown> = {}) {
  await prisma.synchronizationRun.update({
    where: { id: runId },
    data: { stage, ...(extra as object) },
  });
}

export async function startDemoScan(input: {
  organizationId: string;
  connectorId: string;
  triggeredByUserId: string | null;
  triggeredByName: string | null;
}): Promise<{ runId: string }> {
  const run = await prisma.synchronizationRun.create({
    data: {
      organizationId: input.organizationId,
      connectorId: input.connectorId,
      status: "queued",
      stage: "queued",
      triggerType: "demonstration",
      triggeredByUserId: input.triggeredByUserId,
    },
  });
  await writeAudit({
    organizationId: input.organizationId,
    actorUserId: input.triggeredByUserId,
    actorName: input.triggeredByName,
    origin: "human",
    action: "demonstration_scan_triggered",
    entityType: "SynchronizationRun",
    entityId: run.id,
    summary: "Demonstration scan triggered.",
  });
  return { runId: run.id };
}

/** Executes the full pipeline. Called after startDemoScan; safe to re-run. */
export async function executeDemoScan(runId: string): Promise<void> {
  const run = await prisma.synchronizationRun.findUnique({
    where: { id: runId },
    include: { connector: true },
  });
  if (!run) throw new Error("Run not found");
  const orgId = run.organizationId;
  const provider = getConnectorProvider(run.connector.provider);
  if (!provider) throw new Error(`No provider registered for ${run.connector.provider}`);

  const now = new Date();
  try {
    const scoreBefore = await snapshotOfficialPosition(orgId);
    await prisma.synchronizationRun.update({
      where: { id: runId },
      data: { status: "running", startedAt: new Date(), scoreBefore: JSON.stringify(scoreBefore) },
    });
    await writeAudit({
      organizationId: orgId,
      origin: "system_job",
      action: "automated_scan_started",
      entityType: "SynchronizationRun",
      entityId: runId,
      summary: `Automated scan started via ${run.connector.displayName}.`,
    });

    // 1. Connecting
    await setStage(runId, "connecting");
    await prisma.connector.update({ where: { id: run.connectorId }, data: { status: "syncing" } });
    await sleep(STAGE_DELAY_MS);
    const health = await provider.validateConnection(run.connector.configuration);
    if (!health.ok) throw new Error(health.detail);

    // 2. Discovering
    await setStage(runId, "discovering");
    await sleep(STAGE_DELAY_MS);
    const rawResources = await provider.listResources(run.connector.configuration);
    await setStage(runId, "discovering", { resourcesDiscovered: rawResources.length });

    // 3. Normalizing → persist connector resources + inventory
    await setStage(runId, "normalizing");
    await sleep(STAGE_DELAY_MS);
    let created = 0;
    let updated = 0;
    const resourceIdByExternal = new Map<string, string>();
    for (const raw of rawResources) {
      const meta = provider.normalizeResource(raw);
      const existing = await prisma.connectorResource.findUnique({
        where: { connectorId_externalId: { connectorId: run.connectorId, externalId: meta.externalId } },
      });
      const data = {
        organizationId: orgId,
        connectorId: run.connectorId,
        synchronizationRunId: runId,
        resourceType: "file",
        name: meta.name,
        location: meta.location,
        owner: meta.businessOwner,
        mimeType: meta.mimeType,
        sizeBytes: meta.sizeBytes,
        sharingStatus: meta.sharingStatus,
        classification: meta.containsSensitiveData
          ? "sensitive"
          : meta.containsPersonalData
            ? "personal"
            : "internal",
        metadata: JSON.stringify(meta),
        createdExternallyAt: new Date(meta.createdExternallyAt),
        modifiedExternallyAt: new Date(meta.modifiedExternallyAt),
        lastSeenAt: new Date(),
      };
      const row = existing
        ? await prisma.connectorResource.update({ where: { id: existing.id }, data })
        : await prisma.connectorResource.create({ data: { ...data, externalId: meta.externalId } });
      resourceIdByExternal.set(meta.externalId, row.id);
      if (existing) updated += 1;
      else {
        created += 1;
        await writeAudit({
          organizationId: orgId,
          origin: "system_job",
          action: "source_resource_discovered",
          entityType: "ConnectorResource",
          entityId: row.id,
          summary: `Source resource discovered: ${meta.name}`,
        });
      }

      // Inventory upsert (deterministic key: connector + external id)
      const inventoryData = {
        name: meta.name,
        systemName: run.connector.displayName,
        sourceType: "connector",
        businessOwner: meta.businessOwner,
        technicalOwner: meta.technicalOwner,
        dataCategories: JSON.stringify(meta.dataCategories),
        sensitiveDataCategories: JSON.stringify(meta.sensitiveDataCategories),
        dataSubjects: JSON.stringify(meta.dataSubjects),
        processingPurposes: JSON.stringify(meta.processingPurposes),
        storageLocations: JSON.stringify([meta.location]),
        destinationCountries: JSON.stringify(meta.destinationCountry ? [meta.destinationCountry] : []),
        retentionPeriod: meta.retentionPeriod,
        retentionDate: meta.retentionDate ? new Date(meta.retentionDate) : null,
        processors: JSON.stringify([]),
        containsPersonalData: meta.containsPersonalData,
        containsSensitiveData: meta.containsSensitiveData,
        crossBorderTransfer: !!meta.destinationCountry && meta.destinationCountry !== "Egypt",
        sharingStatus: meta.sharingStatus,
        encryptionStatus:
          meta.encryptionStatus === true ? "encrypted" : meta.encryptionStatus === false ? "unencrypted" : "unknown",
        lastScannedAt: new Date(),
      };
      const invExisting = await prisma.dataInventoryItem.findUnique({
        where: {
          organizationId_connectorId_externalResourceId: {
            organizationId: orgId,
            connectorId: run.connectorId,
            externalResourceId: meta.externalId,
          },
        },
      });
      if (invExisting) {
        await prisma.dataInventoryItem.update({ where: { id: invExisting.id }, data: inventoryData });
      } else {
        const inv = await prisma.dataInventoryItem.create({
          data: {
            ...inventoryData,
            organizationId: orgId,
            connectorId: run.connectorId,
            externalResourceId: meta.externalId,
          },
        });
        await writeAudit({
          organizationId: orgId,
          origin: "system_job",
          action: "inventory_record_created",
          entityType: "DataInventoryItem",
          entityId: inv.id,
          summary: `Inventory record created from scan: ${meta.name}`,
        });
      }
    }
    await setStage(runId, "normalizing", { resourcesCreated: created, resourcesUpdated: updated });

    // 4. Evaluating rules
    await setStage(runId, "evaluating_rules");
    await sleep(STAGE_DELAY_MS);
    const controls = await prisma.control.findMany({
      where: { controlCode: { in: MONITORING_RULES.flatMap((r) => r.relatedControlCodes) } },
      select: { id: true, controlCode: true },
    });
    const controlIdByCode = new Map(controls.map((c) => [c.controlCode, c.id]));
    const rules = await prisma.monitoringRule.findMany({ where: { enabled: true } });
    const ruleRowByCode = new Map(rules.map((r) => [`${r.code}:${r.version}`, r]));

    let findingsCreated = 0;
    let evidenceCandidates = 0;
    let mappingsCreated = 0;

    for (const raw of rawResources) {
      const meta = provider.normalizeResource(raw);
      const matches = evaluateRulesForResource(MONITORING_RULES, meta, now);
      for (const match of matches) {
        const ruleRow = ruleRowByCode.get(`${match.ruleCode}:${match.ruleVersion}`);
        if (!ruleRow) continue;
        await writeAudit({
          organizationId: orgId,
          origin: "automated_rule",
          action: "rule_evaluated",
          entityType: "MonitoringRule",
          entityId: ruleRow.id,
          summary: `Rule ${match.ruleCode} v${match.ruleVersion} matched ${meta.name}.`,
          metadata: { resource: meta.externalId },
        });
        const existing = await prisma.monitoringFinding.findUnique({
          where: { organizationId_dedupKey: { organizationId: orgId, dedupKey: match.dedupKey } },
        });
        if (existing) {
          await prisma.monitoringFinding.update({
            where: { id: existing.id },
            data: { detectedAt: new Date(), synchronizationRunId: runId },
          });
          continue;
        }
        const finding = await prisma.monitoringFinding.create({
          data: {
            organizationId: orgId,
            connectorId: run.connectorId,
            synchronizationRunId: runId,
            connectorResourceId: resourceIdByExternal.get(meta.externalId) ?? null,
            monitoringRuleId: ruleRow.id,
            ruleCode: match.ruleCode,
            ruleVersion: match.ruleVersion,
            dedupKey: match.dedupKey,
            title: match.title,
            description: match.description,
            severity: match.severity,
            status: "new",
            isEvidenceCandidate: match.isEvidenceCandidate,
            suggestedEvidenceType: match.suggestedEvidenceType,
            confidence: "rule_match",
          },
        });
        findingsCreated += 1;
        if (match.isEvidenceCandidate) evidenceCandidates += 1;
        await writeAudit({
          organizationId: orgId,
          origin: "automated_rule",
          action: "finding_created",
          entityType: "MonitoringFinding",
          entityId: finding.id,
          summary: `Automated finding created by ${match.ruleCode} v${match.ruleVersion}: ${match.title} (requires human review).`,
        });

        // 5-within: mapping to controls (deterministic, from rule config)
        for (const code of match.relatedControlCodes) {
          const controlId = controlIdByCode.get(code);
          if (!controlId) continue;
          await prisma.findingControlMapping.create({
            data: {
              findingId: finding.id,
              controlId,
              mappingReason: `Deterministic rule ${match.ruleCode} v${match.ruleVersion} relates this finding to ${code}.`,
              mappingSource: "deterministic_rule",
              mappingConfidence: "rule_defined",
              reviewStatus: "pending",
            },
          });
          mappingsCreated += 1;
          await writeAudit({
            organizationId: orgId,
            origin: "automated_rule",
            action: "finding_mapped_to_control",
            entityType: "MonitoringFinding",
            entityId: finding.id,
            summary: `Finding mapped to control ${code} by rule configuration.`,
          });
        }
      }
    }

    // 5. Mapping controls (stage marker — mappings created above)
    await setStage(runId, "mapping_controls", {
      findingsCreated,
      evidenceCandidatesCreated: evidenceCandidates,
    });
    await sleep(STAGE_DELAY_MS);

    // 6. Updating readiness — snapshot AFTER. The official score does not
    // move because of unreviewed findings; the snapshot proves it.
    await setStage(runId, "updating_readiness");
    await sleep(STAGE_DELAY_MS);
    const scoreAfter = await snapshotOfficialPosition(orgId);
    await writeAudit({
      organizationId: orgId,
      origin: "system_job",
      action: "score_recalculated",
      entityType: "SynchronizationRun",
      entityId: runId,
      summary:
        "Deterministic position snapshot recalculated after scan. Official readiness unchanged — new findings await human review.",
      metadata: { mappingsCreated },
    });

    // 7. Completed
    await prisma.synchronizationRun.update({
      where: { id: runId },
      data: {
        status: "completed",
        stage: "completed",
        completedAt: new Date(),
        scoreAfter: JSON.stringify(scoreAfter),
      },
    });
    await prisma.connector.update({
      where: { id: run.connectorId },
      data: { status: "connected", lastSyncAt: new Date(), lastSuccessfulSyncAt: new Date(), lastError: null },
    });
    await writeAudit({
      organizationId: orgId,
      origin: "system_job",
      action: "automated_scan_completed",
      entityType: "SynchronizationRun",
      entityId: runId,
      summary: `Automated scan completed: ${rawResources.length} resources, ${findingsCreated} new findings (${evidenceCandidates} evidence candidates), ${mappingsCreated} control mappings. All findings require human review.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    await prisma.synchronizationRun.update({
      where: { id: runId },
      data: { status: "failed", errorSummary: message, errorsCount: { increment: 1 }, completedAt: new Date() },
    });
    await prisma.connector.update({
      where: { id: run.connectorId },
      data: { status: "error", lastError: message },
    });
    await writeAudit({
      organizationId: orgId,
      origin: "system_job",
      action: "automated_scan_failed",
      entityType: "SynchronizationRun",
      entityId: runId,
      summary: `Automated scan failed: ${message}`,
    });
  }
}
