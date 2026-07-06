// Seeds the regulation layer and the 64-control library from src/data/controls.ts.
// Idempotent: upserts by natural keys (regulation code, control code), so it can
// run repeatedly — including after control-library updates — without duplicating
// rows or touching client assessments.

import { PrismaClient } from "@prisma/client";
import {
  CONTROLS,
  DOMAINS,
  REGULATIONS,
  EXPECTED_CONTROL_COUNT,
} from "../src/data/controls";

const prisma = new PrismaClient();

async function main() {
  if (CONTROLS.length !== EXPECTED_CONTROL_COUNT) {
    throw new Error(
      `Control library has ${CONTROLS.length} controls, expected ${EXPECTED_CONTROL_COUNT} — refusing to seed.`
    );
  }

  const regulationIdByCode = new Map<string, string>();
  for (const reg of REGULATIONS) {
    const row = await prisma.regulation.upsert({
      where: { code: reg.code },
      create: {
        code: reg.code,
        name: reg.name,
        version: reg.version,
        effectiveDate: reg.effectiveDate ? new Date(reg.effectiveDate) : null,
        status: reg.status,
        notes: reg.notes,
      },
      update: {
        name: reg.name,
        version: reg.version,
        effectiveDate: reg.effectiveDate ? new Date(reg.effectiveDate) : null,
        status: reg.status,
        notes: reg.notes,
      },
    });
    regulationIdByCode.set(reg.code, row.id);
  }

  const domainOrder = new Map(DOMAINS.map((d) => [d.name, d.order]));
  const orderCounters = new Map<string, number>();

  for (const control of CONTROLS) {
    const order = domainOrder.get(control.domain);
    if (order === undefined) {
      throw new Error(`Control ${control.code} references unknown domain "${control.domain}"`);
    }
    const orderInDomain = (orderCounters.get(control.domain) ?? 0) + 1;
    orderCounters.set(control.domain, orderInDomain);

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

    for (const regime of control.regimes) {
      const regulationId = regulationIdByCode.get(regime);
      if (!regulationId) {
        throw new Error(`Control ${control.code} references unknown regime "${regime}"`);
      }
      // PDPL mappings stay provisional (article references pending legal
      // confirmation); GDPR mappings carry the article citation.
      const isGdpr = regime === "EU-GDPR";
      await prisma.regulationControlMapping.upsert({
        where: { regulationId_controlId: { regulationId, controlId: row.id } },
        create: {
          regulationId,
          controlId: row.id,
          articleReference: isGdpr ? control.gdprArticles : null,
          provisional: !isGdpr,
        },
        update: {
          articleReference: isGdpr ? control.gdprArticles : null,
          provisional: !isGdpr,
        },
      });
    }
  }

  const total = await prisma.control.count();
  const mandatory = await prisma.control.count({ where: { isMandatory: true } });
  console.log(`Seeded ${total} controls (${mandatory} legally mandatory, ${total - mandatory} important), ${REGULATIONS.length} regulations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
