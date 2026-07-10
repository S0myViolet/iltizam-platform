// Audit logging — every material action, with its origin. Failures to write
// an audit row never break the primary operation (logged to console instead),
// but writes are awaited in normal flow so the trail stays ordered.

import { prisma } from "./db";
import type { AuditOrigin } from "./types";

export interface AuditEntry {
  organizationId?: string | null;
  actorUserId?: string | null;
  actorName?: string | null;
  origin?: AuditOrigin;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}

function toJson(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: entry.organizationId ?? null,
        actorUserId: entry.actorUserId ?? null,
        actorName: entry.actorName ?? null,
        origin: entry.origin ?? "human",
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        beforeData: toJson(entry.before),
        afterData: toJson(entry.after),
        metadata: toJson(entry.metadata),
      },
    });
  } catch (err) {
    console.error("audit write failed", entry.action, err);
  }
}
