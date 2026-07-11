-- AlterTable
ALTER TABLE "Connector" ADD COLUMN     "monitoringEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monitoringIntervalSeconds" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "ConnectorResource" ADD COLUMN     "changeStatus" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "rowCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DataInventoryItem" ADD COLUMN     "recordCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MonitoringFinding" ADD COLUMN     "matchedValues" TEXT;

-- AlterTable
ALTER TABLE "SynchronizationRun" ADD COLUMN     "changeSummary" TEXT,
ADD COLUMN     "currentItem" TEXT,
ADD COLUMN     "filesRead" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "findingsResolved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resourcesRemoved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rowsInspected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rulesEvaluated" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;
