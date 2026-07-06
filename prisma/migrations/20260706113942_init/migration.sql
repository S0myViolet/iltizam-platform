-- CreateTable
CREATE TABLE "Regulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveDate" DATETIME,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RegulationControlMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "regulationId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "articleReference" TEXT,
    "provisional" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RegulationControlMapping_regulationId_fkey" FOREIGN KEY ("regulationId") REFERENCES "Regulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RegulationControlMapping_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Control" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "controlCode" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "domainOrder" INTEGER NOT NULL,
    "orderInDomain" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL,
    "evidenceExamples" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "requiresEvidence" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "companySize" TEXT,
    "industry" TEXT,
    "country" TEXT,
    "selectedRegimes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "readinessScore" REAL,
    "mandatoryScore" REAL,
    "importantScore" REAL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ControlAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "answer" TEXT NOT NULL DEFAULT 'not_answered',
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "notes" TEXT,
    "dueDate" DATETIME,
    "remediationStatus" TEXT NOT NULL DEFAULT 'not_started',
    "lastReviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ControlAnswer_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ControlAnswer_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "answerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "evidenceType" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ControlAnswer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Regulation_code_key" ON "Regulation"("code");

-- CreateIndex
CREATE INDEX "RegulationControlMapping_controlId_idx" ON "RegulationControlMapping"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "RegulationControlMapping_regulationId_controlId_key" ON "RegulationControlMapping"("regulationId", "controlId");

-- CreateIndex
CREATE UNIQUE INDEX "Control_controlCode_key" ON "Control"("controlCode");

-- CreateIndex
CREATE INDEX "Control_domain_idx" ON "Control"("domain");

-- CreateIndex
CREATE INDEX "ControlAnswer_assessmentId_idx" ON "ControlAnswer"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ControlAnswer_assessmentId_controlId_key" ON "ControlAnswer"("assessmentId", "controlId");

-- CreateIndex
CREATE INDEX "Evidence_answerId_idx" ON "Evidence"("answerId");
