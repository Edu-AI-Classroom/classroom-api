-- AlterTable
ALTER TABLE "ai_audit_log" ADD COLUMN     "status" VARCHAR(50);

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "chunk_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quiz_count" INTEGER NOT NULL DEFAULT 0;
