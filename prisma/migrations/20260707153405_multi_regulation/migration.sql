/*
  Warnings:

  - You are about to drop the column `notes` on the `Regulation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Control" ADD COLUMN     "appliesToRoles" TEXT NOT NULL DEFAULT '["controller"]',
ADD COLUMN     "legalBasis" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "provisional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceRegulationCode" TEXT NOT NULL DEFAULT 'EU-GDPR';

-- AlterTable
ALTER TABLE "Regulation" DROP COLUMN "notes",
ADD COLUMN     "complianceDeadline" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "jurisdiction" TEXT,
ADD COLUMN     "legalInstrument" TEXT,
ADD COLUMN     "regulator" TEXT;

-- AlterTable
ALTER TABLE "RegulationControlMapping" ADD COLUMN     "mappingStatus" TEXT NOT NULL DEFAULT 'exact',
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "Control_sourceRegulationCode_idx" ON "Control"("sourceRegulationCode");
