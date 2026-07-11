// Active monitoring — a local scheduler that re-scans enabled connectors on
// their configured interval. State lives in the database (Connector.
// monitoringEnabled / monitoringIntervalSeconds / nextSyncAt); this module is
// just the ticking loop, started once per server process from
// instrumentation.ts and safe to call repeatedly.

import { prisma } from "./db";
import { writeAudit } from "./audit";
import { executeScan, startScan } from "./scan";

const TICK_MS = 5_000;

type MonitorGlobal = typeof globalThis & {
  __iltzamMonitorTimer?: ReturnType<typeof setInterval>;
  __iltzamMonitorBusy?: Set<string>;
};

async function tick(): Promise<void> {
  const g = globalThis as MonitorGlobal;
  const busy = (g.__iltzamMonitorBusy ??= new Set<string>());
  const due = await prisma.connector.findMany({
    where: { monitoringEnabled: true, OR: [{ nextSyncAt: null }, { nextSyncAt: { lte: new Date() } }] },
    select: { id: true, organizationId: true, monitoringIntervalSeconds: true },
  });
  for (const connector of due) {
    if (busy.has(connector.id)) continue; // one scan per connector at a time
    // A queued/running run also blocks a scheduled start.
    const active = await prisma.synchronizationRun.count({
      where: { connectorId: connector.id, status: { in: ["queued", "running"] } },
    });
    if (active > 0) continue;
    busy.add(connector.id);
    const nextSyncAt = new Date(Date.now() + connector.monitoringIntervalSeconds * 1000);
    await prisma.connector.update({ where: { id: connector.id }, data: { nextSyncAt } });
    try {
      const { runId } = await startScan({
        organizationId: connector.organizationId,
        connectorId: connector.id,
        triggerType: "scheduled",
        triggeredByName: "Active monitoring",
      });
      await executeScan(runId);
    } finally {
      busy.delete(connector.id);
    }
  }
}

/** Idempotent: starts the loop once per process. */
export function ensureMonitorLoop(): void {
  const g = globalThis as MonitorGlobal;
  if (g.__iltzamMonitorTimer) return;
  g.__iltzamMonitorTimer = setInterval(() => {
    void tick().catch(() => {});
  }, TICK_MS);
  // Never keep the process alive just for monitoring.
  g.__iltzamMonitorTimer.unref?.();
}

export async function setMonitoring(input: {
  connectorId: string;
  organizationId: string;
  enabled: boolean;
  intervalSeconds?: number;
  actorUserId: string;
  actorName: string;
}): Promise<{ enabled: boolean; intervalSeconds: number; nextSyncAt: Date | null }> {
  const intervalSeconds = Math.min(3600, Math.max(30, input.intervalSeconds ?? 60));
  const nextSyncAt = input.enabled ? new Date(Date.now() + 2_000) : null;
  await prisma.connector.update({
    where: { id: input.connectorId },
    data: {
      monitoringEnabled: input.enabled,
      monitoringIntervalSeconds: intervalSeconds,
      nextSyncAt,
      status: input.enabled ? "syncing" : "connected",
    },
  });
  ensureMonitorLoop();
  await writeAudit({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorName: input.actorName,
    origin: "human",
    action: input.enabled ? "monitoring_started" : "monitoring_stopped",
    entityType: "Connector",
    entityId: input.connectorId,
    summary: input.enabled
      ? `Active monitoring started (every ${intervalSeconds}s).`
      : "Active monitoring stopped.",
  });
  return { enabled: input.enabled, intervalSeconds, nextSyncAt };
}
