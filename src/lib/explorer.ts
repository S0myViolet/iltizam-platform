// Backend data explorer — a read-only, sanitized window onto the persistence
// layer for platform administrators. Every dataset that may be inspected is
// declared here; anything not in the registry is not reachable. Rows pass
// through sanitizeRow() before leaving this module, so credential references,
// storage keys and secret-like fields never reach the renderer.

import type { PrismaClient } from "@prisma/client";

export const EXPLORER_PAGE_SIZE = 25;

/** Prisma delegate names the explorer is allowed to touch. */
type ExplorerModel =
  | "organization"
  | "user"
  | "organizationMembership"
  | "regulation"
  | "controlDomain"
  | "control"
  | "regulationControlMapping"
  | "assessment"
  | "assessmentRegulation"
  | "controlAnswer"
  | "controlComment"
  | "evidence"
  | "dataInventoryItem"
  | "connector"
  | "synchronizationRun"
  | "connectorResource"
  | "monitoringRule"
  | "monitoringFinding"
  | "findingControlMapping"
  | "report"
  | "auditLog";

export interface ExplorerDataset {
  label: string;
  model: ExplorerModel;
  /** Layer heading used to group dataset cards on the index page. */
  group: string;
  /** The one obvious text column `q` searches with contains/insensitive. */
  searchField: string;
  /**
   * Newest-first sort column. Every current model carries createdAt; "id" is
   * the documented fallback for any future model that does not.
   */
  orderField?: "createdAt" | "id";
  /**
   * Column allow-list. When present, ONLY these columns are ever selected —
   * used for users, where nothing beyond the directory fields may leave the
   * database layer.
   */
  select?: Record<string, true>;
}

export const EXPLORER_DATASETS = {
  organizations: {
    label: "Organizations",
    model: "organization",
    group: "Tenancy",
    searchField: "name",
  },
  users: {
    label: "Users",
    model: "user",
    group: "Tenancy",
    searchField: "email",
    select: { id: true, name: true, email: true, isPlatformAdmin: true, createdAt: true },
  },
  memberships: {
    label: "Memberships",
    model: "organizationMembership",
    group: "Tenancy",
    searchField: "role",
  },
  regulations: {
    label: "Regulations",
    model: "regulation",
    group: "Regulation library",
    searchField: "name",
  },
  "control-domains": {
    label: "Control domains",
    model: "controlDomain",
    group: "Regulation library",
    searchField: "name",
  },
  controls: {
    label: "Controls",
    model: "control",
    group: "Regulation library",
    searchField: "question",
  },
  "regulation-mappings": {
    label: "Regulation mappings",
    model: "regulationControlMapping",
    group: "Regulation library",
    searchField: "legalBasis",
  },
  assessments: {
    label: "Assessments",
    model: "assessment",
    group: "Assessments",
    searchField: "title",
  },
  "assessment-regulations": {
    label: "Assessment regulations",
    model: "assessmentRegulation",
    group: "Assessments",
    searchField: "id",
  },
  "assessment-controls": {
    label: "Assessment controls",
    model: "controlAnswer",
    group: "Assessments",
    searchField: "answer",
  },
  "control-comments": {
    label: "Control comments",
    model: "controlComment",
    group: "Assessments",
    searchField: "body",
  },
  evidence: {
    label: "Evidence",
    model: "evidence",
    group: "Evidence & reporting",
    searchField: "fileName",
  },
  inventory: {
    label: "Data inventory",
    model: "dataInventoryItem",
    group: "Inventory & connectors",
    searchField: "name",
  },
  connectors: {
    label: "Connectors",
    model: "connector",
    group: "Inventory & connectors",
    searchField: "displayName",
  },
  "sync-runs": {
    label: "Synchronization runs",
    model: "synchronizationRun",
    group: "Inventory & connectors",
    searchField: "status",
  },
  "connector-resources": {
    label: "Connector resources",
    model: "connectorResource",
    group: "Inventory & connectors",
    searchField: "name",
  },
  "monitoring-rules": {
    label: "Monitoring rules",
    model: "monitoringRule",
    group: "Monitoring",
    searchField: "name",
  },
  "monitoring-findings": {
    label: "Monitoring findings",
    model: "monitoringFinding",
    group: "Monitoring",
    searchField: "title",
  },
  "finding-mappings": {
    label: "Finding mappings",
    model: "findingControlMapping",
    group: "Monitoring",
    searchField: "mappingReason",
  },
  reports: {
    label: "Reports",
    model: "report",
    group: "Evidence & reporting",
    searchField: "type",
  },
  "audit-logs": {
    label: "Audit logs",
    model: "auditLog",
    group: "Audit trail",
    searchField: "summary",
  },
} satisfies Record<string, ExplorerDataset>;

export type ExplorerKey = keyof typeof EXPLORER_DATASETS;

/** Index-page grouping, in schema-layer order. */
export const EXPLORER_GROUPS = [
  "Tenancy",
  "Regulation library",
  "Assessments",
  "Evidence & reporting",
  "Inventory & connectors",
  "Monitoring",
  "Audit trail",
] as const;

export function getExplorerDataset(key: string): (ExplorerDataset & { key: ExplorerKey }) | null {
  const dataset = (EXPLORER_DATASETS as Record<string, ExplorerDataset>)[key];
  return dataset ? { key: key as ExplorerKey, ...dataset } : null;
}

// ─── Sanitization ───────────────────────────────────────────────────────────

/** Columns that must never leave the database layer, listed explicitly. */
const REDACTED_COLUMNS = new Set([
  "encryptedCredentialsReference",
  "storageKey",
  "authenticationProviderId",
]);

/** Defense in depth: drop anything that even smells like a secret. */
const SECRET_LIKE = /token|secret|credential|password/i;

/** Strip redacted and secret-like keys from a row before it is rendered. */
export function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (REDACTED_COLUMNS.has(key)) continue;
    if (SECRET_LIKE.test(key)) continue;
    clean[key] = value;
  }
  return clean;
}

// ─── Queries ────────────────────────────────────────────────────────────────

// The registry is the type boundary: every model listed above exposes the
// same count/findMany surface, accessed through this minimal shape.
interface ExplorerDelegate {
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
  findMany(args: Record<string, unknown>): Promise<Record<string, unknown>[]>;
}

function delegateFor(prisma: PrismaClient, model: ExplorerModel): ExplorerDelegate {
  return prisma[model] as unknown as ExplorerDelegate;
}

export interface ExplorerCount {
  key: ExplorerKey;
  label: string;
  count: number;
}

export async function exploreCounts(prisma: PrismaClient): Promise<ExplorerCount[]> {
  const entries = Object.entries(EXPLORER_DATASETS) as [ExplorerKey, ExplorerDataset][];
  const counts = await Promise.all(
    entries.map(([, dataset]) => delegateFor(prisma, dataset.model).count())
  );
  return entries.map(([key, dataset], index) => ({
    key,
    label: dataset.label,
    count: counts[index],
  }));
}

export interface ExplorerRowsResult {
  label: string;
  total: number;
  rows: Record<string, unknown>[];
  page: number;
  pageSize: number;
}

export async function exploreRows(
  prisma: PrismaClient,
  key: string,
  options: { page?: number; search?: string } = {}
): Promise<ExplorerRowsResult | null> {
  const dataset = getExplorerDataset(key);
  if (!dataset) return null;

  const requestedPage = Math.max(1, Math.floor(options.page ?? 1));
  const search = options.search?.trim() ?? "";
  const where = search
    ? { [dataset.searchField]: { contains: search, mode: "insensitive" } }
    : undefined;

  const model = delegateFor(prisma, dataset.model);
  const total = await model.count({ where });
  // Clamp to the last real page so an out-of-range ?page= shows records
  // instead of a misleading "no records" empty state.
  const lastPage = Math.max(1, Math.ceil(total / EXPLORER_PAGE_SIZE));
  const page = Math.min(requestedPage, lastPage);

  // Sanitize inside the promise chain so no unsanitized row array is ever an
  // awaited value (React dev tooling serializes awaited values into the
  // flight payload; sanitizing after the await would expose raw rows there).
  const rows = await model
    .findMany({
      where,
      orderBy: { [dataset.orderField ?? "createdAt"]: "desc" },
      skip: (page - 1) * EXPLORER_PAGE_SIZE,
      take: EXPLORER_PAGE_SIZE,
      ...(dataset.select ? { select: dataset.select } : {}),
    })
    .then((raw: Record<string, unknown>[]) => raw.map(sanitizeRow));

  return {
    label: dataset.label,
    total,
    rows,
    page,
    pageSize: EXPLORER_PAGE_SIZE,
  };
}
