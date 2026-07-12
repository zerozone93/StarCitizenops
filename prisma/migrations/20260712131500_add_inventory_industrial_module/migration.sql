-- CreateEnum
CREATE TYPE "InventoryItemCategory" AS ENUM (
    'RAW_ORE',
    'REFINED_MATERIAL',
    'COMPONENT',
    'CONSUMABLE',
    'AMMUNITION',
    'FUEL',
    'SALVAGE',
    'CARGO',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "IndustrialJobType" AS ENUM (
    'MINING',
    'REFINING',
    'SALVAGE',
    'MANUFACTURING',
    'HAULING',
    'TRADE',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "IndustrialJobStatus" AS ENUM (
    'PLANNED',
    'ACTIVE',
    'BLOCKED',
    'COMPLETED',
    'CANCELLED'
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "category" "InventoryItemCategory" NOT NULL DEFAULT 'OTHER',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'units',
    "sku" TEXT,
    "notes" TEXT,
    "lastUpdatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustrialJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jobType" "IndustrialJobType" NOT NULL,
    "status" "IndustrialJobStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "targetItemId" TEXT,
    "quantityTarget" INTEGER,
    "quantityCompleted" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3),
    "startAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustrialJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryLocation_organizationId_name_idx" ON "InventoryLocation"("organizationId", "name");

-- CreateIndex
CREATE INDEX "InventoryLocation_ownerId_idx" ON "InventoryLocation"("ownerId");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_category_idx" ON "InventoryItem"("organizationId", "category");

-- CreateIndex
CREATE INDEX "InventoryItem_locationId_idx" ON "InventoryItem"("locationId");

-- CreateIndex
CREATE INDEX "InventoryItem_ownerId_idx" ON "InventoryItem"("ownerId");

-- CreateIndex
CREATE INDEX "InventoryItem_lastUpdatedById_idx" ON "InventoryItem"("lastUpdatedById");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_organizationId_name_sku_key" ON "InventoryItem"("organizationId", "name", "sku");

-- CreateIndex
CREATE INDEX "IndustrialJob_organizationId_status_idx" ON "IndustrialJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "IndustrialJob_createdById_idx" ON "IndustrialJob"("createdById");

-- CreateIndex
CREATE INDEX "IndustrialJob_targetItemId_idx" ON "IndustrialJob"("targetItemId");

-- CreateIndex
CREATE INDEX "IndustrialJob_dueAt_idx" ON "IndustrialJob"("dueAt");

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustrialJob" ADD CONSTRAINT "IndustrialJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustrialJob" ADD CONSTRAINT "IndustrialJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustrialJob" ADD CONSTRAINT "IndustrialJob_targetItemId_fkey" FOREIGN KEY ("targetItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
