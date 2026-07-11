// Seed services — idempotent builders for the regulation layer, control
// libraries, monitoring rules and the demonstration organization. Used by
// `prisma db seed` and by the demo Reset action (which replays the demo
// slice only). Fails loudly if PDPL counts drift from the source document.

import type { PrismaClient } from "@prisma/client";
import { demoAdminCredentials, demoUserPassword, hashPassword } from "./passwords";
import { generateVault, vaultExists } from "./vault";
import { CONTROLS as GDPR_CONTROLS, DOMAINS as GDPR_DOMAINS } from "@/data/controls";
import { PDPL_CONTROLS, PDPL_DOMAINS, PDPL_EXPECTED } from "@/data/pdpl-controls";
import { MONITORING_RULES } from "@/data/monitoring-rules";
import {
  DEMO_ANSWER_PLAN,
  DEMO_CONNECTOR,
  DEMO_MANUAL_INVENTORY,
  DEMO_ORG,
  DEMO_USERS,
  PLATFORM_ADMIN,
} from "@/data/demo";

const J = (v: unknown) => JSON.stringify(v);

// ─── Regulations & control libraries ────────────────────────────────────────

export async function seedRegulationsAndControls(prisma: PrismaClient) {
  const gdpr = await prisma.regulation.upsert({
    where: { code: "EU-GDPR" },
    create: {
      code: "EU-GDPR",
      name: "General Data Protection Regulation (EU) 2016/679",
      jurisdiction: "European Union",
      legalInstrument: "Regulation (EU) 2016/679",
      version: "2016/679",
      regulator: "EU supervisory authorities / EDPB",
      regulatorCode: "EDPB",
      effectiveDate: new Date("2018-05-25"),
      status: "active",
      description:
        "The EU's data protection regulation. The Iltzam GDPR library holds 64 plain-language controls across 14 domains, extracted from the regulation's operative articles.",
      sourceDocument: "Iltzam_GDPR_Control_Framework.docx / Iltzam_Control_Library.docx",
    },
    update: { status: "active" },
  });

  const pdpl = await prisma.regulation.upsert({
    where: { code: "EG-PDPL" },
    create: {
      code: "EG-PDPL",
      name: "Egypt Personal Data Protection Law",
      jurisdiction: "Egypt",
      legalInstrument: "Law No. 151 of 2020 and Executive Regulations 816/2025",
      version: "Law 151/2020 · ER 816/2025",
      regulator: "Personal Data Protection Center",
      regulatorCode: "PDPC",
      effectiveDate: new Date("2025-11-02"),
      complianceDeadline: new Date("2026-11-01"),
      status: "implementation_period",
      description:
        "Egypt's first comprehensive data protection statute. 85 controls across 14 domains, drafted from the Arabic text of the Law and its Executive Regulations. Fixed fines in Egyptian pounds; criminal exposure for sensitive-data and cross-border breaches. Compliance expected by 1 November 2026.",
      sourceDocument: "Egypt_PDPL_Law_and_Controls.docx",
    },
    update: {
      legalInstrument: "Law No. 151 of 2020 and Executive Regulations 816/2025",
      complianceDeadline: new Date("2026-11-01"),
      status: "implementation_period",
    },
  });

  // Domains
  const domainIdByCode = new Map<string, string>();
  for (const d of GDPR_DOMAINS) {
    const row = await prisma.controlDomain.upsert({
      where: { code: d.code },
      create: { code: d.code, name: d.name, description: d.blurb, displayOrder: d.order },
      update: { name: d.name, description: d.blurb, displayOrder: d.order },
    });
    domainIdByCode.set(d.code, row.id);
  }
  for (const d of PDPL_DOMAINS) {
    const row = await prisma.controlDomain.upsert({
      where: { code: d.code },
      create: { code: d.code, name: d.name, description: d.blurb, displayOrder: d.order },
      update: { name: d.name, description: d.blurb, displayOrder: d.order },
    });
    domainIdByCode.set(d.code, row.id);
  }

  // GDPR controls → mapped to EU-GDPR only (legal basis = GDPR articles).
  const gdprDomainCode = new Map(GDPR_DOMAINS.map((d) => [d.name, d.code]));
  for (const c of GDPR_CONTROLS) {
    const domainId = domainIdByCode.get(gdprDomainCode.get(c.domain)!)!;
    const data = {
      domainId,
      question: c.question,
      description: c.description,
      whyItMatters: c.whyItMatters,
      severity: c.severity,
      isMandatory: c.severity === "legally_mandatory",
      requiresEvidence: true,
      evidenceExamples: J(c.evidenceExamples),
      recommendedAction: c.recommendedAction,
      sourceReference: c.frameworkId
        ? `GDPR ${c.gdprArticles} · framework ${c.frameworkId}`
        : `GDPR ${c.gdprArticles}`,
      provisional: false,
      active: true,
    };
    const row = await prisma.control.upsert({
      where: { controlCode: c.code },
      create: { controlCode: c.code, ...data },
      update: data,
    });
    await prisma.regulationControlMapping.upsert({
      where: { regulationId_controlId: { regulationId: gdpr.id, controlId: row.id } },
      create: {
        regulationId: gdpr.id,
        controlId: row.id,
        legalBasis: c.gdprArticles,
        mappingType: "exact",
        provisional: false,
      },
      update: { legalBasis: c.gdprArticles, mappingType: "exact", provisional: false },
    });
    // The GDPR library previously carried provisional EG-PDPL mappings; the
    // real PDPL library replaces them.
    await prisma.regulationControlMapping.deleteMany({
      where: { controlId: row.id, regulationId: pdpl.id },
    });
  }

  // PDPL controls → mapped to EG-PDPL with the document's article bases.
  const pdplDomainCode = new Map(PDPL_DOMAINS.map((d) => [d.name, d.code]));
  for (const c of PDPL_CONTROLS) {
    const domainId = domainIdByCode.get(pdplDomainCode.get(c.domain)!)!;
    const data = {
      domainId,
      question: c.question,
      description: `Egypt PDPL ${c.legalBasis} — Law No. 151 of 2020 / Executive Regulations 816/2025.`,
      whyItMatters: c.whyItMatters,
      severity: c.severity,
      isMandatory: c.severity === "legally_mandatory",
      requiresEvidence: true,
      evidenceExamples: J(c.evidenceExamples),
      recommendedAction: c.recommendedAction,
      sourceReference: `PDPL ${c.legalBasis} · Law 151/2020, ER 816/2025`,
      provisional: c.provisional,
      active: true,
    };
    const row = await prisma.control.upsert({
      where: { controlCode: c.code },
      create: { controlCode: c.code, ...data },
      update: data,
    });
    await prisma.regulationControlMapping.upsert({
      where: { regulationId_controlId: { regulationId: pdpl.id, controlId: row.id } },
      create: {
        regulationId: pdpl.id,
        controlId: row.id,
        legalBasis: c.legalBasis,
        mappingType: "regulation_specific",
        provisional: c.provisional,
        mappingNotes: c.provisional
          ? "Impact Assessments domain is provisional: the DPIA duty derives from the Executive Regulations and PDPC guidance, not the Law itself."
          : null,
      },
      update: { legalBasis: c.legalBasis, provisional: c.provisional },
    });
  }

  return { gdpr, pdpl };
}

// ─── Monitoring rules ───────────────────────────────────────────────────────

export async function seedMonitoringRules(prisma: PrismaClient) {
  for (const r of MONITORING_RULES) {
    await prisma.monitoringRule.upsert({
      where: { code_version: { code: r.code, version: r.version } },
      create: {
        code: r.code,
        version: r.version,
        name: r.name,
        description: r.description,
        category: r.category,
        severity: r.severity,
        enabled: true,
        conditionType: "structured",
        conditionConfiguration: J(r.condition),
        relatedControlCodes: J(r.relatedControlCodes),
        regulationCodes: J(["EG-PDPL"]),
        recommendedAction: r.recommendedAction,
        requiresHumanReview: true,
      },
      update: {
        name: r.name,
        description: r.description,
        conditionConfiguration: J(r.condition),
        relatedControlCodes: J(r.relatedControlCodes),
        recommendedAction: r.recommendedAction,
      },
    });
  }
}

// ─── Assessment creation (shared with the API layer) ────────────────────────

export async function createAssessmentWithControls(
  prisma: PrismaClient,
  input: {
    organizationId: string;
    title: string;
    regulationCodes: string[];
    startedByUserId?: string | null;
  }
) {
  const regulations = await prisma.regulation.findMany({
    where: { code: { in: input.regulationCodes } },
  });
  if (regulations.length !== input.regulationCodes.length) {
    throw new Error("Unknown regulation code.");
  }
  const controls = await prisma.control.findMany({
    where: {
      active: true,
      regulationMappings: { some: { regulationId: { in: regulations.map((r) => r.id) } } },
    },
    select: { id: true },
  });
  if (controls.length === 0) throw new Error("No controls mapped to the selected regulations.");

  const assessment = await prisma.assessment.create({
    data: {
      organizationId: input.organizationId,
      title: input.title,
      status: "not_started",
      startedByUserId: input.startedByUserId ?? null,
      regulations: { create: regulations.map((r) => ({ regulationId: r.id })) },
      answers: { create: controls.map((c) => ({ controlId: c.id })) },
    },
  });
  return { assessment, controlCount: controls.length };
}

// ─── Demonstration organization ─────────────────────────────────────────────

export const DEMO_ASSESSMENT_TITLE = "PDPL & GDPR readiness review 2026";

export async function seedDemo(prisma: PrismaClient) {
  // Platform admin — credentials come from DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD.
  const adminCreds = demoAdminCredentials();
  const adminHash = hashPassword(adminCreds.password);
  const admin = await prisma.user.upsert({
    where: { email: adminCreds.email },
    create: { name: PLATFORM_ADMIN.name, email: adminCreds.email, isPlatformAdmin: true, passwordHash: adminHash },
    update: { isPlatformAdmin: true, passwordHash: adminHash },
  });

  // Organization
  let org = await prisma.organization.findFirst({
    where: { demoOrganization: true, name: DEMO_ORG.name },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: { ...DEMO_ORG, demoOrganization: true },
    });
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        origin: "system_job",
        action: "organization_created",
        entityType: "Organization",
        entityId: org.id,
        summary: `Demonstration organization ${org.name} created by seed.`,
      },
    });
  }

  // Users & memberships
  const usersByKey = new Map<string, { id: string; name: string; email: string; membershipId: string }>();
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { name: u.name, email: u.email, passwordHash: hashPassword(demoUserPassword()) },
      update: { name: u.name, passwordHash: hashPassword(demoUserPassword()) },
    });
    const membership = await prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: u.role,
        status: "active",
        joinedAt: new Date("2026-01-15"),
      },
      update: { role: u.role, status: "active" },
    });
    usersByKey.set(u.key, { id: user.id, name: user.name, email: user.email, membershipId: membership.id });
  }

  // The real synthetic data source (files on disk + manifest).
  if (!vaultExists()) await generateVault();

  // Connector
  let connector = await prisma.connector.findFirst({
    where: { organizationId: org.id, provider: DEMO_CONNECTOR.provider },
  });
  if (!connector) {
    connector = await prisma.connector.create({
      data: {
        organizationId: org.id,
        provider: DEMO_CONNECTOR.provider,
        displayName: DEMO_CONNECTOR.displayName,
        status: DEMO_CONNECTOR.status,
        authenticationType: DEMO_CONNECTOR.authenticationType,
        grantedScopes: J(DEMO_CONNECTOR.grantedScopes),
        createdByUserId: usersByKey.get("admin")!.id,
      },
    });
  }

  // Manual inventory items
  for (const item of DEMO_MANUAL_INVENTORY) {
    const existing = await prisma.dataInventoryItem.findFirst({
      where: { organizationId: org.id, name: item.name, sourceType: "manual" },
    });
    if (!existing) {
      await prisma.dataInventoryItem.create({
        data: {
          organizationId: org.id,
          name: item.name,
          systemName: item.systemName,
          sourceType: "manual",
          businessOwner: item.businessOwner,
          technicalOwner: item.technicalOwner,
          dataCategories: J(item.dataCategories),
          sensitiveDataCategories: J(item.sensitiveDataCategories),
          dataSubjects: J(item.dataSubjects),
          processingPurposes: J(item.processingPurposes),
          lawfulBasis: item.lawfulBasis,
          storageLocations: J(item.storageLocations),
          destinationCountries: J(item.destinationCountries),
          retentionPeriod: item.retentionPeriod,
          processors: J(item.processors),
          containsPersonalData: item.containsPersonalData,
          containsSensitiveData: item.containsSensitiveData,
          crossBorderTransfer: item.crossBorderTransfer,
          sharingStatus: item.sharingStatus,
          encryptionStatus: item.encryptionStatus,
          lastReviewedAt: new Date("2026-06-01"),
        },
      });
    }
  }

  // Demonstration assessment with the answer plan
  let assessment = await prisma.assessment.findFirst({
    where: { organizationId: org.id, title: DEMO_ASSESSMENT_TITLE },
  });
  if (!assessment) {
    const created = await createAssessmentWithControls(prisma, {
      organizationId: org.id,
      title: DEMO_ASSESSMENT_TITLE,
      regulationCodes: ["EG-PDPL", "EU-GDPR"],
      startedByUserId: usersByKey.get("manager")!.id,
    });
    assessment = created.assessment;
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: "in_progress", startedAt: new Date("2026-06-10"), nextReviewAt: new Date("2026-10-01") },
    });
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        actorUserId: usersByKey.get("manager")!.id,
        actorName: usersByKey.get("manager")!.name,
        origin: "system_job",
        action: "assessment_created",
        entityType: "Assessment",
        entityId: assessment.id,
        summary: `Assessment "${DEMO_ASSESSMENT_TITLE}" created with ${created.controlCount} control instances (EG-PDPL + EU-GDPR).`,
      },
    });

    for (const plan of DEMO_ANSWER_PLAN) {
      const control = await prisma.control.findUnique({ where: { controlCode: plan.code } });
      if (!control) throw new Error(`Demo answer plan references unknown control ${plan.code}`);
      const owner = plan.owner ? usersByKey.get(plan.owner) : undefined;
      const answer = await prisma.controlAnswer.update({
        where: { assessmentId_controlId: { assessmentId: assessment.id, controlId: control.id } },
        data: {
          answer: plan.answer,
          ownerMembershipId: owner?.membershipId ?? null,
          ownerName: owner?.name ?? null,
          ownerEmail: owner?.email ?? null,
          notes: plan.notes ?? null,
          dueDate: plan.dueDate ? new Date(plan.dueDate) : null,
          remediationStatus:
            plan.answer === "no" ? (plan.dueDate ? "in_progress" : "not_started") : "not_started",
          lastReviewedAt: new Date("2026-06-25"),
        },
      });
      if (plan.evidence) {
        await prisma.evidence.create({
          data: {
            organizationId: org.id,
            answerId: answer.id,
            kind: "link",
            fileName: plan.evidence.title,
            fileUrl: `https://drive.niledigital.example/${plan.code.toLowerCase()}`,
            evidenceType: plan.evidence.type,
            reviewStatus: plan.evidence.review,
            reviewedAt: plan.evidence.review === "unreviewed" ? null : new Date("2026-06-28"),
            reviewedByUserId:
              plan.evidence.review === "unreviewed" ? null : usersByKey.get("reviewer")!.id,
            uploadedBy: owner?.name ?? "Karim Nassar",
            uploadedByUserId: owner?.id ?? usersByKey.get("manager")!.id,
            uploadedAt: new Date("2026-06-20"),
          },
        });
      }
    }
  }

  return { org, adminUserId: admin.id, assessmentId: assessment.id };
}

// ─── Verification (fails loudly) ────────────────────────────────────────────

export async function verifySeed(prisma: PrismaClient) {
  const pdpl = await prisma.regulation.findUnique({ where: { code: "EG-PDPL" } });
  const gdpr = await prisma.regulation.findUnique({ where: { code: "EU-GDPR" } });
  if (!pdpl || !gdpr) throw new Error("SEED VERIFICATION FAILED: regulations missing");

  const pdplControls = await prisma.control.findMany({
    where: { regulationMappings: { some: { regulationId: pdpl.id } } },
    include: { domain: true },
  });
  const counts = {
    regulations: await prisma.regulation.count(),
    gdprControls: await prisma.control.count({
      where: { regulationMappings: { some: { regulationId: gdpr.id } } },
    }),
    pdplControls: pdplControls.length,
    pdplMandatory: pdplControls.filter((c) => c.isMandatory).length,
    pdplImportant: pdplControls.filter((c) => !c.isMandatory).length,
    pdplDomains: new Set(pdplControls.map((c) => c.domainId)).size,
    pdplProvisional: pdplControls.filter((c) => c.provisional).length,
    mappings: await prisma.regulationControlMapping.count(),
    demoOrgs: await prisma.organization.count({ where: { demoOrganization: true } }),
    demoUsers: await prisma.user.count({ where: { email: { endsWith: "example" } } }),
    demoAssessments: await prisma.assessment.count({
      where: { organization: { demoOrganization: true } },
    }),
    demoInventory: await prisma.dataInventoryItem.count({
      where: { organization: { demoOrganization: true } },
    }),
    demoFindings: await prisma.monitoringFinding.count({
      where: { organization: { demoOrganization: true } },
    }),
    monitoringRules: await prisma.monitoringRule.count(),
  };

  const failures: string[] = [];
  if (counts.pdplControls !== PDPL_EXPECTED.total)
    failures.push(`PDPL controls: expected ${PDPL_EXPECTED.total}, got ${counts.pdplControls}`);
  if (counts.pdplMandatory !== PDPL_EXPECTED.mandatory)
    failures.push(`PDPL mandatory: expected ${PDPL_EXPECTED.mandatory}, got ${counts.pdplMandatory}`);
  if (counts.pdplImportant !== PDPL_EXPECTED.important)
    failures.push(`PDPL important: expected ${PDPL_EXPECTED.important}, got ${counts.pdplImportant}`);
  if (counts.pdplDomains !== PDPL_EXPECTED.domains)
    failures.push(`PDPL domains: expected ${PDPL_EXPECTED.domains}, got ${counts.pdplDomains}`);
  if (counts.pdplProvisional !== PDPL_EXPECTED.provisional)
    failures.push(`PDPL provisional: expected ${PDPL_EXPECTED.provisional}, got ${counts.pdplProvisional}`);
  if (counts.gdprControls !== 64)
    failures.push(`GDPR controls: expected 64, got ${counts.gdprControls}`);

  if (failures.length > 0) {
    throw new Error("SEED VERIFICATION FAILED:\n  " + failures.join("\n  "));
  }
  return counts;
}
