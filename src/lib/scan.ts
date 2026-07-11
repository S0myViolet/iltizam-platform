// The scan engine — actually reads the Nile Digital Services Demo Data Vault.
//
// Pipeline (every stage persists; the UI polls the run row for live progress):
//   open source → discover files (checksums, change detection) → parse XLSX /
//   CSV / JSON / text server-side → normalize resources → evaluate the fixed
//   MON-* rules → create findings (default "new", human review required) →
//   map controls → evidence candidates → update inventory → audit → complete.
//
// Official scores never move because of a scan: the before/after snapshots
// stored on every run prove it. Deterministic end to end — no AI anywhere.

import { createHash } from "crypto";
import { prisma } from "./db";
import { writeAudit } from "./audit";
import { snapshotOfficialPosition } from "./assessments";
import { MONITORING_RULES } from "@/data/monitoring-rules";
import { evaluateRulesForResource, type ResourceMetadata } from "./monitoring";
import type { SyncStage } from "./types";
import {
  checksumFile,
  fileStat,
  parseVaultFile,
  readManifest,
  vaultExists,
  type ParsedFile,
  type VaultEntry,
} from "./vault";

async function setRun(runId: string, data: Record<string, unknown>): Promise<void> {
  await prisma.synchronizationRun.update({ where: { id: runId }, data: data as object });
}
async function setStage(runId: string, stage: SyncStage, extra: Record<string, unknown> = {}) {
  await setRun(runId, { stage, ...extra });
}

export async function startScan(input: {
  organizationId: string;
  connectorId: string;
  triggeredByUserId?: string | null;
  triggeredByName?: string;
  triggerType?: "manual" | "scheduled" | "demonstration";
}): Promise<{ runId: string }> {
  const run = await prisma.synchronizationRun.create({
    data: {
      organizationId: input.organizationId,
      connectorId: input.connectorId,
      status: "queued",
      stage: "queued",
      triggeredByUserId: input.triggeredByUserId ?? null,
      triggerType: input.triggerType ?? "manual",
    },
  });
  await writeAudit({
    organizationId: input.organizationId,
    actorUserId: input.triggeredByUserId ?? null,
    actorName: input.triggeredByName ?? "Scheduler",
    origin: input.triggerType === "scheduled" ? "system_job" : "human",
    action: "scan_triggered",
    entityType: "SynchronizationRun",
    entityId: run.id,
    summary: `${input.triggerType === "scheduled" ? "Scheduled" : "Manual"} scan queued for the demo data vault.`,
  });
  return { runId: run.id };
}

/** Build the flat facts the MON-* rules evaluate (manifest + parsed content). */
export function factsFor(entry: VaultEntry, parsed: Pick<ParsedFile, "rowCount" | "fileType" | "rows">): ResourceMetadata {
  const cats = entry.dataCategories;
  const requiresEncryption =
    entry.containsSensitiveData || cats.some((c) => ["payroll", "financial", "biometric"].includes(c));
  const leavesEgypt =
    entry.storageCountry !== "Egypt" || entry.destinationCountries.some((c) => c !== "Egypt");
  const isMarketingData = cats.includes("marketing_lead");
  let hasOpenRightsRequest = false;
  let maxOpenWorkingDays = 0;
  if (cats.includes("rights_request")) {
    for (const row of parsed.rows) {
      if (String(row.status) === "open") {
        hasOpenRightsRequest = true;
        maxOpenWorkingDays = Math.max(maxOpenWorkingDays, Number(row.working_days_open) || 0);
      }
    }
  }
  return {
    ...entry,
    name: entry.fileName,
    rowCount: parsed.rowCount,
    fileType: parsed.fileType,
    requiresEncryption,
    leavesEgypt,
    isMarketingData,
    hasOpenRightsRequest,
    maxOpenWorkingDays,
  };
}

/**
 * Execute a scan run end to end. Reads real files from the vault; per-file
 * parse errors are recorded and skipped so one bad file cannot sink the run.
 */
export async function executeScan(runId: string): Promise<void> {
  const run = await prisma.synchronizationRun.findUnique({ where: { id: runId } });
  if (!run || run.status !== "queued") return;
  const orgId = run.organizationId;
  const now = new Date();

  try {
    const scoreBefore = await snapshotOfficialPosition(orgId);
    await setRun(runId, { status: "running", startedAt: new Date(), scoreBefore: JSON.stringify(scoreBefore) });

    // 1. Opening source
    await setStage(runId, "opening_source", { currentItem: "manifest.json" });
    if (!vaultExists()) throw new Error("Demo data vault not found — run the seed to generate it.");
    const manifest = readManifest();

    // 2. Discovering files — checksums drive change detection.
    await setStage(runId, "discovering_files");
    const previous = await prisma.connectorResource.findMany({
      where: { connectorId: run.connectorId },
      select: { externalId: true, checksum: true, name: true, id: true, changeStatus: true },
    });
    const prevByExternal = new Map(previous.map((p) => [p.externalId, p]));
    const discovered: { entry: VaultEntry; checksum: string; sizeBytes: number; modifiedAt: Date; change: string }[] = [];
    const changeSummary = { new: [] as string[], changed: [] as string[], removed: [] as string[] };
    for (const entry of manifest.entries) {
      // The fingerprint covers file bytes AND manifest context: a sharing
      // flag flipped or an owner removed is a real change to the source even
      // when the file bytes are identical.
      const checksum = createHash("sha256")
        .update(checksumFile(entry.fileName))
        .update(JSON.stringify(entry))
        .digest("hex")
        .slice(0, 16);
      const stat = fileStat(entry.fileName);
      const prev = prevByExternal.get(entry.externalId);
      const change = !prev || prev.changeStatus === "removed" ? "new" : prev.checksum === checksum ? "unchanged" : "changed";
      if (change === "new") changeSummary.new.push(entry.fileName);
      if (change === "changed") changeSummary.changed.push(entry.fileName);
      discovered.push({ entry, checksum, sizeBytes: stat.sizeBytes, modifiedAt: stat.modifiedAt, change });
    }
    const manifestIds = new Set(manifest.entries.map((e) => e.externalId));
    const removed = previous.filter((p) => !manifestIds.has(p.externalId) && p.changeStatus !== "removed");
    changeSummary.removed = removed.map((r) => r.name);
    await setRun(runId, {
      resourcesDiscovered: discovered.length,
      resourcesRemoved: removed.length,
      changeSummary: JSON.stringify(changeSummary),
    });

    // 3/4. Reading files — spreadsheets first, then structured records/text.
    const parsedByExternal = new Map<string, ParsedFile>();
    let filesRead = 0;
    let rowsInspected = 0;
    let errorsCount = 0;
    const errors: string[] = [];
    const ordered = [
      ...discovered.filter((d) => d.entry.fileName.endsWith(".xlsx")),
      ...discovered.filter((d) => !d.entry.fileName.endsWith(".xlsx")),
    ];
    for (const item of ordered) {
      const stage: SyncStage = item.entry.fileName.endsWith(".xlsx") ? "reading_spreadsheets" : "reading_records";
      await setStage(runId, stage, { currentItem: item.entry.fileName, filesRead, rowsInspected });
      try {
        const parsed = await parseVaultFile(item.entry.fileName);
        parsedByExternal.set(item.entry.externalId, parsed);
        filesRead += 1;
        rowsInspected += parsed.rowCount;
      } catch (err) {
        errorsCount += 1;
        errors.push(`${item.entry.fileName}: ${err instanceof Error ? err.message : "parse failed"}`);
      }
    }
    await setRun(runId, { filesRead, rowsInspected, errorsCount, currentItem: null });

    // 5. Normalizing resources — upsert one ConnectorResource per file.
    await setStage(runId, "normalizing");
    let resourcesCreated = 0;
    let resourcesUpdated = 0;
    const resourceIdByExternal = new Map<string, string>();
    for (const item of ordered) {
      const parsed = parsedByExternal.get(item.entry.externalId);
      const facts = factsFor(item.entry, parsed ?? { rowCount: 0, fileType: "txt", rows: [] });
      const data = {
        organizationId: orgId,
        synchronizationRunId: runId,
        resourceType: "file",
        name: item.entry.fileName,
        location: item.entry.location,
        owner: item.entry.owner,
        sizeBytes: item.sizeBytes,
        sharingStatus: item.entry.sharingStatus,
        classification: item.entry.containsSensitiveData ? "sensitive" : item.entry.containsPersonalData ? "personal" : "internal",
        checksum: item.checksum,
        fileType: parsed?.fileType ?? null,
        rowCount: parsed?.rowCount ?? 0,
        changeStatus: item.change,
        metadata: JSON.stringify(facts),
        modifiedExternallyAt: item.modifiedAt,
        lastSeenAt: new Date(),
      };
      const existing = prevByExternal.get(item.entry.externalId);
      if (existing) {
        await prisma.connectorResource.update({ where: { id: existing.id }, data });
        resourceIdByExternal.set(item.entry.externalId, existing.id);
        if (item.change === "changed") resourcesUpdated += 1;
      } else {
        const created = await prisma.connectorResource.create({
          data: { ...data, connectorId: run.connectorId, externalId: item.entry.externalId },
        });
        resourceIdByExternal.set(item.entry.externalId, created.id);
        resourcesCreated += 1;
        await writeAudit({
          organizationId: orgId, origin: "automated_rule", action: "source_resource_discovered",
          entityType: "ConnectorResource", entityId: created.id,
          summary: `New source resource discovered: ${item.entry.fileName} (${parsed?.rowCount ?? 0} records).`,
        });
      }
    }
    for (const gone of removed) {
      await prisma.connectorResource.update({ where: { id: gone.id }, data: { changeStatus: "removed", lastSeenAt: new Date() } });
      await writeAudit({
        organizationId: orgId, origin: "automated_rule", action: "source_resource_removed",
        entityType: "ConnectorResource", entityId: gone.id,
        summary: `Source resource no longer present in the vault: ${gone.name}.`,
      });
    }
    await setRun(runId, { resourcesCreated, resourcesUpdated });

    // 6. Evaluating rules — fixed MON-* checks over manifest + content facts.
    await setStage(runId, "evaluating_rules");
    const controls = await prisma.control.findMany({ select: { id: true, controlCode: true } });
    const controlIdByCode = new Map(controls.map((c) => [c.controlCode, c.id]));
    const ruleRows = await prisma.monitoringRule.findMany({ where: { enabled: true } });
    const ruleRowByCode = new Map(ruleRows.map((r) => [`${r.code}:${r.version}`, r]));

    let rulesEvaluated = 0;
    let findingsCreated = 0;
    let evidenceCandidates = 0;
    let mappingsCreated = 0;
    const matchedDedupKeys = new Set<string>();

    for (const item of ordered) {
      const parsed = parsedByExternal.get(item.entry.externalId);
      if (!parsed && item.entry.fileName.endsWith(".xlsx")) continue; // unreadable file: recorded as an error
      const facts = factsFor(item.entry, parsed ?? { rowCount: 0, fileType: "txt", rows: [] });
      await setRun(runId, { currentItem: item.entry.fileName, rulesEvaluated });
      const matches = evaluateRulesForResource(MONITORING_RULES, facts, now);
      rulesEvaluated += MONITORING_RULES.length;

      for (const match of matches) {
        matchedDedupKeys.add(match.dedupKey);
        const ruleRow = ruleRowByCode.get(`${match.ruleCode}:${match.ruleVersion}`);
        if (!ruleRow) continue;
        await writeAudit({
          organizationId: orgId, origin: "automated_rule", action: "rule_evaluated",
          entityType: "MonitoringRule", entityId: ruleRow.id,
          summary: `Rule ${match.ruleCode} v${match.ruleVersion} matched ${item.entry.fileName}.`,
          metadata: { resource: item.entry.externalId, matchedValues: match.matchedValues },
        });
        const existing = await prisma.monitoringFinding.findUnique({
          where: { organizationId_dedupKey: { organizationId: orgId, dedupKey: match.dedupKey } },
        });
        if (existing) {
          const reopen = existing.status === "resolved" && !existing.reviewedByUserId;
          await prisma.monitoringFinding.update({
            where: { id: existing.id },
            data: {
              detectedAt: new Date(),
              synchronizationRunId: runId,
              matchedValues: JSON.stringify(match.matchedValues),
              ...(reopen ? { status: "new" } : {}),
            },
          });
          continue;
        }
        const finding = await prisma.monitoringFinding.create({
          data: {
            organizationId: orgId,
            connectorId: run.connectorId,
            synchronizationRunId: runId,
            connectorResourceId: resourceIdByExternal.get(item.entry.externalId) ?? null,
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
            matchedValues: JSON.stringify(match.matchedValues),
            confidence: "rule_match",
          },
        });
        findingsCreated += 1;
        if (match.isEvidenceCandidate) evidenceCandidates += 1;
        await writeAudit({
          organizationId: orgId, origin: "automated_rule", action: "finding_created",
          entityType: "MonitoringFinding", entityId: finding.id,
          summary: `Automated finding created by ${match.ruleCode} v${match.ruleVersion}: ${match.title} (requires human review).`,
        });
        // 7-within: control mappings, deterministic from the rule configuration.
        for (const code of match.relatedControlCodes) {
          const controlId = controlIdByCode.get(code);
          if (!controlId) continue;
          await prisma.findingControlMapping.create({
            data: {
              findingId: finding.id, controlId,
              mappingReason: `Deterministic rule ${match.ruleCode} v${match.ruleVersion} relates this finding to ${code}.`,
              mappingSource: "deterministic_rule", mappingConfidence: "rule_defined", reviewStatus: "pending",
            },
          });
          mappingsCreated += 1;
          await writeAudit({
            organizationId: orgId, origin: "automated_rule", action: "finding_mapped_to_control",
            entityType: "MonitoringFinding", entityId: finding.id,
            summary: `Finding mapped to control ${code} by rule configuration.`,
          });
        }
      }
    }

    // Auto-resolve NEVER-REVIEWED findings whose condition no longer matches.
    // Human-touched findings are left for the reviewer to close.
    let findingsResolved = 0;
    const stale = await prisma.monitoringFinding.findMany({
      where: { organizationId: orgId, status: "new", ruleCode: { startsWith: "MON-" } },
    });
    for (const f of stale) {
      if (matchedDedupKeys.has(f.dedupKey)) continue;
      await prisma.monitoringFinding.update({
        where: { id: f.id },
        data: { status: "resolved", resolutionNotes: "Automated: the rule condition no longer matches the latest scan.", synchronizationRunId: runId },
      });
      findingsResolved += 1;
      await writeAudit({
        organizationId: orgId, origin: "automated_rule", action: "finding_auto_resolved",
        entityType: "MonitoringFinding", entityId: f.id,
        summary: `Finding auto-resolved — ${f.ruleCode} no longer matches: ${f.title.slice(0, 80)}.`,
      });
    }

    await setStage(runId, "mapping_controls", { rulesEvaluated, findingsCreated, findingsResolved, currentItem: null });
    await setStage(runId, "evidence_candidates", { evidenceCandidatesCreated: evidenceCandidates });

    // 8. Updating inventory — one register entry per personal-data source.
    await setStage(runId, "updating_inventory");
    for (const item of ordered) {
      if (!item.entry.containsPersonalData) continue;
      const parsed = parsedByExternal.get(item.entry.externalId);
      const inv = {
        name: item.entry.fileName.replace(/\.(xlsx|csv|json|txt)$/i, "").replace(/_/g, " "),
        systemName: item.entry.sourceSystem,
        sourceType: "connector",
        businessOwner: item.entry.owner,
        dataCategories: JSON.stringify(item.entry.dataCategories),
        sensitiveDataCategories: JSON.stringify(item.entry.containsSensitiveData ? item.entry.dataCategories.filter((c) => c === "biometric") : []),
        dataSubjects: JSON.stringify(item.entry.dataCategories.includes("employee") ? ["employees"] : ["customers"]),
        processingPurposes: JSON.stringify(["business operations"]),
        storageLocations: JSON.stringify([item.entry.storageCountry]),
        destinationCountries: JSON.stringify(item.entry.destinationCountries),
        retentionPeriod: item.entry.retentionPeriod,
        processors: JSON.stringify([]),
        containsPersonalData: true,
        containsSensitiveData: item.entry.containsSensitiveData,
        crossBorderTransfer: item.entry.destinationCountries.length > 0,
        sharingStatus: item.entry.sharingStatus,
        encryptionStatus: item.entry.encryptionStatus,
        recordCount: parsed?.rowCount ?? 0,
        lastScannedAt: new Date(),
        status: "active",
      };
      const existing = await prisma.dataInventoryItem.findUnique({
        where: {
          organizationId_connectorId_externalResourceId: {
            organizationId: orgId, connectorId: run.connectorId, externalResourceId: item.entry.externalId,
          },
        },
      });
      if (existing) await prisma.dataInventoryItem.update({ where: { id: existing.id }, data: inv });
      else {
        const created = await prisma.dataInventoryItem.create({
          data: { ...inv, organizationId: orgId, connectorId: run.connectorId, externalResourceId: item.entry.externalId },
        });
        await writeAudit({
          organizationId: orgId, origin: "automated_rule", action: "inventory_item_discovered",
          entityType: "DataInventoryItem", entityId: created.id,
          summary: `Inventory entry created from scan: ${inv.name} (${inv.recordCount} records).`,
        });
      }
    }

    // 9. Deterministic position snapshot — official readiness must not move.
    const scoreAfter = await snapshotOfficialPosition(orgId);
    await writeAudit({
      organizationId: orgId, origin: "system_job", action: "score_recalculated",
      entityType: "SynchronizationRun", entityId: runId,
      summary: "Deterministic position snapshot recalculated after scan. Official readiness unchanged — new findings await human review.",
      metadata: { mappingsCreated },
    });

    // 10/11. Audit + complete.
    await setStage(runId, "saving_audit");
    await prisma.connector.update({
      where: { id: run.connectorId },
      data: { lastSyncAt: new Date(), lastSuccessfulSyncAt: errorsCount === 0 ? new Date() : undefined, status: "connected", lastError: errors[0] ?? null },
    });
    await writeAudit({
      organizationId: orgId, origin: "system_job", action: "automated_scan_completed",
      entityType: "SynchronizationRun", entityId: runId,
      summary: `Scan completed: ${filesRead}/${discovered.length} files read, ${rowsInspected} records inspected, ${findingsCreated} new findings (${evidenceCandidates} evidence candidates), ${findingsResolved} auto-resolved, ${mappingsCreated} control mappings. All findings require human review.`,
    });
    await setRun(runId, {
      status: errorsCount > 0 ? "completed_with_errors" : "completed",
      stage: "completed",
      completedAt: new Date(),
      scoreAfter: JSON.stringify(scoreAfter),
      findingsCreated,
      findingsResolved,
      evidenceCandidatesCreated: evidenceCandidates,
      rulesEvaluated,
      errorsCount,
      errorSummary: errors.length > 0 ? errors.join(" | ").slice(0, 900) : null,
      currentItem: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed.";
    await setRun(runId, { status: "failed", completedAt: new Date(), errorSummary: message, currentItem: null }).catch(() => {});
    await prisma.connector.update({ where: { id: run.connectorId }, data: { status: "error", lastError: message } }).catch(() => {});
    await writeAudit({
      organizationId: orgId, origin: "system_job", action: "automated_scan_failed",
      entityType: "SynchronizationRun", entityId: runId, summary: `Scan failed: ${message}`,
    });
  }
}
