-- CreateEnum
CREATE TYPE "RefineryRunStatus" AS ENUM (
    'INTAKE',
    'PROCESSING',
    'READY_FOR_OUTPUT',
    'COMPLETED',
    'CANCELLED'
);

-- CreateEnum
CREATE TYPE "ResourceTicketType" AS ENUM (
    'ISSUE',
    'RETURN',
    'ADJUSTMENT'
);

-- CreateEnum
CREATE TYPE "ResourceTicketStatus" AS ENUM (
    'OPEN',
    'APPROVED',
    'FULFILLED',
    'CANCELLED'
);

-- CreateTable
CREATE TABLE "RefineryRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "inputItemId" TEXT NOT NULL,
    "outputItemId" TEXT,
    "intakeQuantity" INTEGER NOT NULL,
    "outputQuantity" INTEGER,
    "wasteQuantity" INTEGER,
    "status" "RefineryRunStatus" NOT NULL DEFAULT 'INTAKE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefineryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "approvedById" TEXT,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'units',
    "type" "ResourceTicketType" NOT NULL,
    "status" "ResourceTicketStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefineryRun_organizationId_status_idx" ON "RefineryRun"("organizationId", "status");
CREATE INDEX "RefineryRun_inputItemId_idx" ON "RefineryRun"("inputItemId");
CREATE INDEX "RefineryRun_outputItemId_idx" ON "RefineryRun"("outputItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceTicket_ticketNumber_key" ON "ResourceTicket"("ticketNumber");
CREATE INDEX "ResourceTicket_organizationId_status_idx" ON "ResourceTicket"("organizationId", "status");
CREATE INDEX "ResourceTicket_itemId_idx" ON "ResourceTicket"("itemId");
CREATE INDEX "ResourceTicket_requesterId_idx" ON "ResourceTicket"("requesterId");

-- AddForeignKey
ALTER TABLE "RefineryRun" ADD CONSTRAINT "RefineryRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefineryRun" ADD CONSTRAINT "RefineryRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefineryRun" ADD CONSTRAINT "RefineryRun_inputItemId_fkey" FOREIGN KEY ("inputItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefineryRun" ADD CONSTRAINT "RefineryRun_outputItemId_fkey" FOREIGN KEY ("outputItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceTicket" ADD CONSTRAINT "ResourceTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResourceTicket" ADD CONSTRAINT "ResourceTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResourceTicket" ADD CONSTRAINT "ResourceTicket_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResourceTicket" ADD CONSTRAINT "ResourceTicket_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
