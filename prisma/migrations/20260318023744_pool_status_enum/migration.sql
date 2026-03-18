/*
  Warnings:

  - The `status` column on the `pools` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "pools" DROP COLUMN "status",
ADD COLUMN     "status" "PoolStatus" NOT NULL DEFAULT 'OPEN';
