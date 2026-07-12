-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "starCitizenVerificationCheckedAt" TIMESTAMP(3),
ADD COLUMN     "starCitizenVerified" BOOLEAN NOT NULL DEFAULT false;
