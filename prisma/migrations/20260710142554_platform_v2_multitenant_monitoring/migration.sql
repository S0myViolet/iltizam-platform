/*
  Warnings:

  - You are about to drop the column `companyName` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `companySize` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `selectedRegimes` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `domainOrder` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `orderInDomain` on the `Control` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Regulation` table. All the data in the column will be lost.
  - You are about to drop the column `articleReference` on the `RegulationControlMapping` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `domainId` to the `Control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Evidence` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RegulationControlMapping` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Control_domain_idx";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "companyName",
DROP COLUMN "companySize",
DROP COLUMN "country",
DROP COLUMN "industry",
DROP COLUMN "selectedRegimes",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "startedByUserId" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Control" DROP COLUMN "domain",
DROP COLUMN "domainOrder",
DROP COLUMN "orderInDomain",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "domainId" TEXT NOT NULL,
ADD COLUMN     "provisional" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ControlAnswer" ADD COLUMN     "ownerMembershipId" TEXT;

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "originalFileName" TEXT,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'unreviewed',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedByUserId" TEXT,
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "uploadedByUserId" TEXT,
ADD COLUMN     "validFrom" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Regulation" DROP COLUMN "notes",
ADD COLUMN     "complianceDeadline" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "jurisdiction" TEXT,
ADD COLUMN     "legalInstrument" TEXT,
ADD COLUMN     "regulator" TEXT,
ADD COLUMN     "regulatorCode" TEXT,
ADD COLUMN     "sourceDocument" TEXT;

-- AlterTable
ALTER TABLE "RegulationControlMapping" DROP COLUMN "articleReference",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "effectiveFrom" TIMESTAMP(3),
ADD COLUMN     "effectiveTo" TIMESTAMP(3),
ADD COLUMN     "legalBasis" TEXT,
ADD COLUMN     "mappingNotes" TEXT,
ADD COLUMN     "mappingType" TEXT NOT NULL DEFAULT 'exact',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "country" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "registrationNumber" TEXT,
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "timezone" TEXT,
    "demoOrganization" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authenticationProviderId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlDomain" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentRegulation" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "regulationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentRegulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlComment" (
    "id" TEXT NOT NULL,
    "assessmentControlId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "generatedByUserId" TEXT,
    "storageKey" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorUserId" TEXT,
    "actorName" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'human',
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "beforeData" TEXT,
    "afterData" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataInventoryItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectorId" TEXT,
    "externalResourceId" TEXT,
    "name" TEXT NOT NULL,
    "systemName" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "businessOwner" TEXT,
    "technicalOwner" TEXT,
    "dataCategories" TEXT NOT NULL,
    "sensitiveDataCategories" TEXT NOT NULL,
    "dataSubjects" TEXT NOT NULL,
    "processingPurposes" TEXT NOT NULL,
    "lawfulBasis" TEXT,
    "storageLocations" TEXT NOT NULL,
    "destinationCountries" TEXT NOT NULL,
    "retentionPeriod" TEXT,
    "retentionDate" TIMESTAMP(3),
    "processors" TEXT NOT NULL,
    "containsPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "containsSensitiveData" BOOLEAN NOT NULL DEFAULT false,
    "crossBorderTransfer" BOOLEAN NOT NULL DEFAULT false,
    "sharingStatus" TEXT,
    "encryptionStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastReviewedAt" TIMESTAMP(3),
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataInventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "authenticationType" TEXT,
    "encryptedCredentialsReference" TEXT,
    "grantedScopes" TEXT NOT NULL,
    "configuration" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "lastSuccessfulSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SynchronizationRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "stage" TEXT NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resourcesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "resourcesCreated" INTEGER NOT NULL DEFAULT 0,
    "resourcesUpdated" INTEGER NOT NULL DEFAULT 0,
    "findingsCreated" INTEGER NOT NULL DEFAULT 0,
    "evidenceCandidatesCreated" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "triggeredByUserId" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'manual',
    "errorSummary" TEXT,
    "scoreBefore" TEXT,
    "scoreAfter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SynchronizationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectorResource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "synchronizationRunId" TEXT,
    "externalId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "owner" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "sharingStatus" TEXT,
    "classification" TEXT,
    "metadata" TEXT NOT NULL,
    "createdExternallyAt" TIMESTAMP(3),
    "modifiedExternallyAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectorResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "conditionType" TEXT NOT NULL DEFAULT 'structured',
    "conditionConfiguration" TEXT NOT NULL,
    "relatedControlCodes" TEXT NOT NULL,
    "regulationCodes" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringFinding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectorId" TEXT,
    "synchronizationRunId" TEXT,
    "connectorResourceId" TEXT,
    "monitoringRuleId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "ruleVersion" INTEGER NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "isEvidenceCandidate" BOOLEAN NOT NULL DEFAULT false,
    "suggestedEvidenceType" TEXT,
    "confidence" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewedByName" TEXT,
    "assignedOwnerMembershipId" TEXT,
    "assignedOwnerName" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FindingControlMapping" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "mappingReason" TEXT NOT NULL,
    "mappingSource" TEXT NOT NULL DEFAULT 'deterministic_rule',
    "mappingConfidence" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FindingControlMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "confidence" TEXT,
    "promptVersion" TEXT,
    "modelId" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending_human_review',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authenticationProviderId_key" ON "User"("authenticationProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ControlDomain_code_key" ON "ControlDomain"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentRegulation_assessmentId_regulationId_key" ON "AssessmentRegulation"("assessmentId", "regulationId");

-- CreateIndex
CREATE INDEX "ControlComment_assessmentControlId_idx" ON "ControlComment"("assessmentControlId");

-- CreateIndex
CREATE INDEX "Report_organizationId_idx" ON "Report"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "DataInventoryItem_organizationId_idx" ON "DataInventoryItem"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DataInventoryItem_organizationId_connectorId_externalResour_key" ON "DataInventoryItem"("organizationId", "connectorId", "externalResourceId");

-- CreateIndex
CREATE INDEX "Connector_organizationId_idx" ON "Connector"("organizationId");

-- CreateIndex
CREATE INDEX "SynchronizationRun_organizationId_createdAt_idx" ON "SynchronizationRun"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ConnectorResource_organizationId_idx" ON "ConnectorResource"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectorResource_connectorId_externalId_key" ON "ConnectorResource"("connectorId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringRule_code_version_key" ON "MonitoringRule"("code", "version");

-- CreateIndex
CREATE INDEX "MonitoringFinding_organizationId_status_idx" ON "MonitoringFinding"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoringFinding_organizationId_dedupKey_key" ON "MonitoringFinding"("organizationId", "dedupKey");

-- CreateIndex
CREATE UNIQUE INDEX "FindingControlMapping_findingId_controlId_key" ON "FindingControlMapping"("findingId", "controlId");

-- CreateIndex
CREATE INDEX "Assessment_organizationId_idx" ON "Assessment"("organizationId");

-- CreateIndex
CREATE INDEX "Control_domainId_idx" ON "Control"("domainId");

-- CreateIndex
CREATE INDEX "Evidence_organizationId_idx" ON "Evidence"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Control" ADD CONSTRAINT "Control_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "ControlDomain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRegulation" ADD CONSTRAINT "AssessmentRegulation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentRegulation" ADD CONSTRAINT "AssessmentRegulation_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlComment" ADD CONSTRAINT "ControlComment_assessmentControlId_fkey" FOREIGN KEY ("assessmentControlId") REFERENCES "ControlAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataInventoryItem" ADD CONSTRAINT "DataInventoryItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataInventoryItem" ADD CONSTRAINT "DataInventoryItem_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connector" ADD CONSTRAINT "Connector_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynchronizationRun" ADD CONSTRAINT "SynchronizationRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SynchronizationRun" ADD CONSTRAINT "SynchronizationRun_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorResource" ADD CONSTRAINT "ConnectorResource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorResource" ADD CONSTRAINT "ConnectorResource_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectorResource" ADD CONSTRAINT "ConnectorResource_synchronizationRunId_fkey" FOREIGN KEY ("synchronizationRunId") REFERENCES "SynchronizationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringFinding" ADD CONSTRAINT "MonitoringFinding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringFinding" ADD CONSTRAINT "MonitoringFinding_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringFinding" ADD CONSTRAINT "MonitoringFinding_synchronizationRunId_fkey" FOREIGN KEY ("synchronizationRunId") REFERENCES "SynchronizationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringFinding" ADD CONSTRAINT "MonitoringFinding_connectorResourceId_fkey" FOREIGN KEY ("connectorResourceId") REFERENCES "ConnectorResource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringFinding" ADD CONSTRAINT "MonitoringFinding_monitoringRuleId_fkey" FOREIGN KEY ("monitoringRuleId") REFERENCES "MonitoringRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingControlMapping" ADD CONSTRAINT "FindingControlMapping_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "MonitoringFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingControlMapping" ADD CONSTRAINT "FindingControlMapping_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;
