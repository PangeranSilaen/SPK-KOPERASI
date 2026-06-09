-- AlterTable
ALTER TABLE "CalculationRun" ADD COLUMN     "bestAlternative" TEXT,
ADD COLUMN     "conditionLabel" TEXT,
ADD COLUMN     "consistencyRatio" DOUBLE PRECISION,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "isConsistent" BOOLEAN;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "modelId" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_modelId_idx" ON "AuditLog"("modelId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DecisionModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
