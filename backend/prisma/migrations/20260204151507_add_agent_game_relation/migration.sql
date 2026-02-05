/*
  Warnings:

  - Added the required column `blackAgentId` to the `ChessGame` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whiteAgentId` to the `ChessGame` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChessGame" ADD COLUMN     "blackAgentId" TEXT NOT NULL,
ADD COLUMN     "whiteAgentId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ChessGame" ADD CONSTRAINT "ChessGame_whiteAgentId_fkey" FOREIGN KEY ("whiteAgentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChessGame" ADD CONSTRAINT "ChessGame_blackAgentId_fkey" FOREIGN KEY ("blackAgentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
