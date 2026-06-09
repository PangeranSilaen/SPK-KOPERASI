-- CreateEnum
CREATE TYPE "ModelStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CriterionType" AS ENUM ('BENEFIT', 'COST');

-- CreateEnum
CREATE TYPE "PairwisePreference" AS ENUM ('LEFT', 'RIGHT', 'EQUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ModelStatus" NOT NULL DEFAULT 'DRAFT',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "DecisionModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expert" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "experience" TEXT,
    "notes" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CriterionType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternative" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alternative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AhpComparison" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "leftCriterionId" TEXT NOT NULL,
    "rightCriterionId" TEXT NOT NULL,
    "preference" "PairwisePreference" NOT NULL,
    "scale" INTEGER NOT NULL,
    "ratioValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AhpComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyScore" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "conditionId" TEXT NOT NULL,
    "alternativeId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculationRun" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "conditionId" TEXT,
    "selectedExpertIds" JSONB NOT NULL,
    "ahpResult" JSONB NOT NULL,
    "wpResult" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalculationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DecisionModel_status_idx" ON "DecisionModel"("status");

-- CreateIndex
CREATE INDEX "Expert_modelId_idx" ON "Expert"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Expert_modelId_name_key" ON "Expert"("modelId", "name");

-- CreateIndex
CREATE INDEX "Criterion_modelId_idx" ON "Criterion"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Criterion_modelId_code_key" ON "Criterion"("modelId", "code");

-- CreateIndex
CREATE INDEX "Alternative_modelId_idx" ON "Alternative"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Alternative_modelId_code_key" ON "Alternative"("modelId", "code");

-- CreateIndex
CREATE INDEX "Condition_modelId_idx" ON "Condition"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "Condition_modelId_code_key" ON "Condition"("modelId", "code");

-- CreateIndex
CREATE INDEX "AhpComparison_modelId_expertId_idx" ON "AhpComparison"("modelId", "expertId");

-- CreateIndex
CREATE UNIQUE INDEX "AhpComparison_modelId_expertId_leftCriterionId_rightCriteri_key" ON "AhpComparison"("modelId", "expertId", "leftCriterionId", "rightCriterionId");

-- CreateIndex
CREATE INDEX "StrategyScore_modelId_expertId_idx" ON "StrategyScore"("modelId", "expertId");

-- CreateIndex
CREATE INDEX "StrategyScore_modelId_conditionId_idx" ON "StrategyScore"("modelId", "conditionId");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyScore_modelId_expertId_conditionId_alternativeId_cr_key" ON "StrategyScore"("modelId", "expertId", "conditionId", "alternativeId", "criterionId");

-- CreateIndex
CREATE INDEX "CalculationRun_modelId_idx" ON "CalculationRun"("modelId");

-- AddForeignKey
ALTER TABLE "DecisionModel" ADD CONSTRAINT "DecisionModel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expert" ADD CONSTRAINT "Expert_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DecisionModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criterion" ADD CONSTRAINT "Criterion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DecisionModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD CONSTRAINT "Alternative_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DecisionModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DecisionModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AhpComparison" ADD CONSTRAINT "AhpComparison_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DecisionModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AhpComparison" ADD CONSTRAINT "AhpComparison_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AhpComparison" ADD CONSTRAINT "AhpComparison_leftCriterionId_fkey" FOREIGN KEY ("leftCriterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AhpComparison" ADD CONSTRAINT "AhpComparison_rightCriterionId_fkey" FOREIGN KEY ("rightCriterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyScore" ADD CONSTRAINT "StrategyScore_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DecisionModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyScore" ADD CONSTRAINT "StrategyScore_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyScore" ADD CONSTRAINT "StrategyScore_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "Condition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyScore" ADD CONSTRAINT "StrategyScore_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "Alternative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyScore" ADD CONSTRAINT "StrategyScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculationRun" ADD CONSTRAINT "CalculationRun_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "DecisionModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculationRun" ADD CONSTRAINT "CalculationRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
