// Seeds the platform: regulations, both control libraries (GDPR 64 + Egypt
// PDPL 85), monitoring rules, and the demonstration organization. Idempotent —
// re-running updates library content without duplicating rows or touching
// client data. Verification fails loudly if PDPL counts drift from the
// source document.

import { PrismaClient } from "@prisma/client";
import {
  seedDemo,
  seedMonitoringRules,
  seedRegulationsAndControls,
  verifySeed,
} from "../src/lib/seeding";

const prisma = new PrismaClient();

async function main() {
  await seedRegulationsAndControls(prisma);
  await seedMonitoringRules(prisma);
  await seedDemo(prisma);
  const counts = await verifySeed(prisma);
  console.log("Seed verification passed:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
