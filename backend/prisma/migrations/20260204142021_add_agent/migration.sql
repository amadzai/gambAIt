-- CreateEnum
CREATE TYPE "Playstyle" AS ENUM ('AGGRESSIVE', 'DEFENSIVE', 'POSITIONAL');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "playstyle" "Playstyle" NOT NULL,
    "opening" TEXT,
    "personality" TEXT,
    "profileImage" TEXT,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);
