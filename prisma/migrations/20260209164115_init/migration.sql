-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SUGGESTED', 'ACTIVE', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('MAIN_QUEST', 'SIDE_QUEST');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL,
    "questType" "QuestType" NOT NULL,
    "nominatedBy" TEXT NOT NULL,
    "hltbTime" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_name_key" ON "Player"("name");
