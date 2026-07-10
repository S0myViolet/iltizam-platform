// Monitoring rule evaluator — deterministic, versioned, testable. Evaluates
// structured rule conditions against a normalized resource's metadata. No AI
// anywhere in this path; the same metadata and rule version always produce
// the same result. Findings it produces default to "new" and require human
// review before they can touch any official number.

import type { MonitoringRuleSeed, RuleClause, RuleCondition } from "@/data/monitoring-rules";
import type { DemoResource } from "@/data/demo";

export type ResourceMetadata = DemoResource;

function fieldValue(meta: ResourceMetadata, field: string): unknown {
  return (meta as unknown as Record<string, unknown>)[field];
}

function isMissing(v: unknown): boolean {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

export function evaluateClause(clause: RuleClause, meta: ResourceMetadata, now: Date): boolean {
  const v = fieldValue(meta, clause.field);
  switch (clause.op) {
    case "eq":
      return v === clause.value;
    case "neq":
      return v !== clause.value;
    case "isTrue":
      return v === true;
    case "isFalse":
      return v === false || v === null || v === undefined ? v === false : false;
    case "missing":
      return isMissing(v);
    case "present":
      return !isMissing(v);
    case "includes":
      return Array.isArray(v) && v.includes(clause.value as string);
    case "inSet":
      return (
        (isMissing(v) && (clause.value as string[]).includes("missing")) ||
        (typeof v === "string" && (clause.value as string[]).includes(v))
      );
    case "notInSet":
      return typeof v === "string" && !(clause.value as string[]).includes(v);
    case "beforeNow":
      return typeof v === "string" && !Number.isNaN(Date.parse(v)) && new Date(v).getTime() < now.getTime();
    case "gteThreshold":
      return typeof v === "number" && v >= (clause.value as number);
    default:
      return false;
  }
}

export function evaluateCondition(
  condition: RuleCondition,
  meta: ResourceMetadata,
  now: Date
): boolean {
  if (condition.any) {
    return condition.any.some((c) => evaluateCondition(c, meta, now));
  }
  if (condition.all) {
    return condition.all.every((clause) => evaluateClause(clause, meta, now));
  }
  return false;
}

export interface RuleMatch {
  ruleCode: string;
  ruleVersion: number;
  title: string;
  description: string;
  severity: string;
  recommendedAction: string;
  relatedControlCodes: string[];
  isEvidenceCandidate: boolean;
  suggestedEvidenceType: string | null;
  /** Deterministic dedup key: same resource + same rule ⇒ same finding. */
  dedupKey: string;
}

export function evaluateRulesForResource(
  rules: MonitoringRuleSeed[],
  meta: ResourceMetadata,
  now: Date
): RuleMatch[] {
  const matches: RuleMatch[] = [];
  for (const rule of rules) {
    if (!evaluateCondition(rule.condition, meta, now)) continue;
    matches.push({
      ruleCode: rule.code,
      ruleVersion: rule.version,
      title: rule.findingTitle.replace("{name}", meta.name),
      description: rule.findingDescription,
      severity: rule.severity,
      recommendedAction: rule.recommendedAction,
      relatedControlCodes: rule.relatedControlCodes,
      isEvidenceCandidate: rule.isEvidenceCandidate ?? false,
      suggestedEvidenceType: rule.isEvidenceCandidate ? (meta.evidenceType ?? null) : null,
      dedupKey: `${rule.code}:${meta.externalId}`,
    });
  }
  // Stable order: rule code, then resource id — determinism in persistence too.
  return matches.sort((a, b) => a.ruleCode.localeCompare(b.ruleCode));
}
