// Seeds the regulation layer and both control libraries:
//   - EU-GDPR: 64 controls from src/data/controls.ts
//   - EG-PDPL: 85 controls from src/data/pdpl-controls.ts (once extracted
//     from the source document — seeding skips while that array is empty)
// Idempotent: upserts by natural keys, so it can run repeatedly without
// duplicating rows or touching client assessments.

import { PrismaClient } from "@prisma/client";
import {
  CONTROLS,
  DOMAINS,
  REGULATIONS,
  EXPECTED_CONTROL_COUNT,
} from "../src/data/controls";
import {
  PDPL_CONTROLS,
  PDPL_DOMAINS,
  PDPL_EXPECTED_TOTAL,
  PDPL_EXPECTED_MANDATORY,
  PDPL_EXPECTED_IMPORTANT,
} from "../src/data/pdpl-controls";

const prisma = new PrismaClient();

async function seedRegulations(): Promise<Map<string, string>> {
  const idByCode = new Map<string, string>();
  for (const reg of REGULATIONS) {
    const data = {
      name: reg.name,
      jurisdiction: reg.jurisdiction,
      version: reg.version,
      legalInstrument: reg.legalInstrument,
      effectiveDate: reg.effectiveDate ? new Date(reg.effectiveDate) : null,
      complianceDeadline: reg.complianceDeadline ? new Date(reg.complianceDeadline) : null,
      regulator: reg.regulator,
      status: reg.status,
      description: reg.description,
    };
    const row = await prisma.regulation.upsert({
      where: { code: reg.code },
      create: { code: reg.code, ...data },
      update: data,
    });
    idByCode.set(reg.code, row.id);
  }
  return idByCode;
}

async function seedGdprLibrary(regulationIdByCode: Map<string, string>) {
  if (CONTROLS.length !== EXPECTED_CONTROL_COUNT) {
    throw new Error(
      `GDPR library has ${CONTROLS.length} controls, expected ${EXPECTED_CONTROL_COUNT} — refusing to seed.`
    );
  }
  const gdprId = regulationIdByCode.get("EU-GDPR");
  if (!gdprId) throw new Error("EU-GDPR regulation missing.");

  const domainOrder = new Map(DOMAINS.map((d) => [d.name, d.order]));
  const orderCounters = new Map<string, number>();

  for (const control of CONTROLS) {
    const order = domainOrder.get(control.domain);
    if (order === undefined) {
      throw new Error(`Control ${control.code} references unknown domain "${control.domain}"`);
    }
    const orderInDomain = (orderCounters.get(control.domain) ?? 0) + 1;
    orderCounters.set(control.domain, orderInDomain);

    const legalBasis = `GDPR ${control.gdprArticles}`;
    const sourceReference = control.frameworkId
      ? `GDPR ${control.gdprArticles} · framework ${control.frameworkId}`
      : `GDPR ${control.gdprArticles}`;

    const data = {
      question: control.question,
      description: control.description,
      domain: control.domain,
      domainOrder: order,
      orderInDomain,
      severity: control.severity,
      isMandatory: control.severity === "legally_mandatory",
      sourceRegulationCode: "EU-GDPR",
      legalBasis,
      provisional: false,
      appliesToRoles: JSON.stringify(["controller"]),
      evidenceExamples: JSON.stringify(control.evidenceExamples),
      whyItMatters: control.whyItMatters,
      recommendedAction: control.recommendedAction,
      sourceReference,
    };

    const row = await prisma.control.upsert({
      where: { controlCode: control.code },
      create: { controlCode: control.code, ...data },
      update: data,
    });

    await prisma.regulationControlMapping.upsert({
      where: { regulationId_controlId: { regulationId: gdprId, controlId: row.id } },
      create: {
        regulationId: gdprId,
        controlId: row.id,
        articleReference: control.gdprArticles,
        mappingStatus: "exact",
        provisional: false,
      },
      update: { articleReference: control.gdprArticles, mappingStatus: "exact", provisional: false },
    });
  }

  // Retire the old provisional EG-PDPL tags on GDPR-sourced controls: Egypt
  // PDPL now has its own library. Cross-law overlap returns later as explicit
  // crosswalk rows with a real mapping status.
  const removed = await prisma.regulationControlMapping.deleteMany({
    where: {
      regulation: { code: { not: "EU-GDPR" } },
      control: { sourceRegulationCode: "EU-GDPR" },
    },
  });
  if (removed.count > 0) {
    console.log(`Removed ${removed.count} legacy provisional PDPL mappings from GDPR controls.`);
  }
}

async function seedPdplLibrary(regulationIdByCode: Map<string, string>) {
  if (PDPL_CONTROLS.length === 0) {
    console.log(
      "PDPL library not yet extracted from the source document — skipping (EG-PDPL will show as 'library pending')."
    );
    return;
  }
  // A partial PDPL library must never ship: all-or-nothing.
  if (PDPL_CONTROLS.length !== PDPL_EXPECTED_TOTAL) {
    throw new Error(
      `PDPL library has ${PDPL_CONTROLS.length} controls, expected ${PDPL_EXPECTED_TOTAL} — refusing to seed.`
    );
  }
  const mandatory = PDPL_CONTROLS.filter((c) => c.severity === "legally_mandatory").length;
  const important = PDPL_CONTROLS.filter((c) => c.severity === "important").length;
  if (mandatory !== PDPL_EXPECTED_MANDATORY || important !== PDPL_EXPECTED_IMPORTANT) {
    throw new Error(
      `PDPL severity split is ${mandatory}/${important}, expected ${PDPL_EXPECTED_MANDATORY}/${PDPL_EXPECTED_IMPORTANT} — refusing to seed.`
    );
  }

  const pdplId = regulationIdByCode.get("EG-PDPL");
  if (!pdplId) throw new Error("EG-PDPL regulation missing.");

  const domainOrder = new Map(PDPL_DOMAINS.map((d) => [d.name, d.order]));
  const expected = new Map(PDPL_DOMAINS.map((d) => [d.name, d.expectedControls]));
  const orderCounters = new Map<string, number>();

  for (const control of PDPL_CONTROLS) {
    const order = domainOrder.get(control.domain);
    if (order === undefined) {
      throw new Error(`PDPL control ${control.code} references unknown domain "${control.domain}"`);
    }
    const orderInDomain = (orderCounters.get(control.domain) ?? 0) + 1;
    orderCounters.set(control.domain, orderInDomain);

    const data = {
      question: control.question,
      description: control.description,
      domain: control.domain,
      domainOrder: order,
      orderInDomain,
      severity: control.severity,
      isMandatory: control.severity === "legally_mandatory",
      sourceRegulationCode: "EG-PDPL",
      legalBasis: control.legalBasis,
      provisional: control.provisional ?? false,
      appliesToRoles: JSON.stringify(control.appliesToRoles ?? ["controller"]),
      evidenceExamples: JSON.stringify(control.evidenceExamples),
      whyItMatters: control.whyItMatters,
      recommendedAction: control.recommendedAction,
      sourceReference: control.legalBasis,
    };

    const row = await prisma.control.upsert({
      where: { controlCode: control.code },
      create: { controlCode: control.code, ...data },
      update: data,
    });

    await prisma.regulationControlMapping.upsert({
      where: { regulationId_controlId: { regulationId: pdplId, controlId: row.id } },
      create: {
        regulationId: pdplId,
        controlId: row.id,
        articleReference: control.legalBasis,
        mappingStatus: "exact",
        provisional: control.provisional ?? false,
      },
      update: {
        articleReference: control.legalBasis,
        mappingStatus: "exact",
        provisional: control.provisional ?? false,
      },
    });
  }

  // Verify per-domain counts against the document's structure.
  for (const [domain, count] of orderCounters) {
    if (expected.get(domain) !== count) {
      throw new Error(
        `PDPL domain "${domain}" seeded ${count} controls, document expects ${expected.get(domain)}.`
      );
    }
  }
}

async function main() {
  const regulationIdByCode = await seedRegulations();
  await seedGdprLibrary(regulationIdByCode);
  await seedPdplLibrary(regulationIdByCode);

  for (const code of ["EU-GDPR", "EG-PDPL"]) {
    const total = await prisma.control.count({ where: { sourceRegulationCode: code } });
    const mandatory = await prisma.control.count({
      where: { sourceRegulationCode: code, isMandatory: true },
    });
    console.log(
      `${code}: ${total} controls (${mandatory} legally mandatory, ${total - mandatory} important).`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
