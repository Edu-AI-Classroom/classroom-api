-- CreateEnum
CREATE TYPE "ChunkType" AS ENUM ('TITLE', 'HEADING', 'PARAGRAPH', 'LIST', 'TABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentIngestionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ContentReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'EDITED', 'REJECTED');

-- AlterTable
ALTER TABLE "document"
ADD COLUMN "source_file_url" VARCHAR(500),
ADD COLUMN "source_file_type" VARCHAR(20),
ADD COLUMN "ingestion_status" "DocumentIngestionStatus" DEFAULT 'PENDING',
ADD COLUMN "ingestion_error" TEXT,
ADD COLUMN "ingestion_done_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "content_bank"
ADD COLUMN "source_chunk_id" CHAR(36),
ADD COLUMN "review_status" "ContentReviewStatus" DEFAULT 'PENDING',
ADD COLUMN "review_note" TEXT,
ADD COLUMN "reviewed_by" INTEGER,
ADD COLUMN "reviewed_at" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "ai_audit_log"
ADD COLUMN "updated_at" TIMESTAMP(6),
ADD COLUMN "completed_at" TIMESTAMP(6),
ADD COLUMN "document_id" CHAR(36),
ADD COLUMN "chunk_id" CHAR(36),
ADD COLUMN "model" VARCHAR(150),
ADD COLUMN "prompt" TEXT,
ADD COLUMN "answer" TEXT,
ADD COLUMN "error_message" TEXT;

-- CreateTable
CREATE TABLE "document_chunk" (
  "id" CHAR(36) NOT NULL,
  "document_id" CHAR(36) NOT NULL,
  "chunk_index" INTEGER NOT NULL,
  "chunk_type" "ChunkType" NOT NULL DEFAULT 'PARAGRAPH',
  "page_start" INTEGER,
  "page_end" INTEGER,
  "chapter" VARCHAR(255),
  "section" VARCHAR(255),
  "raw_text" TEXT NOT NULL,
  "embedding_id" CHAR(36),
  "embedded" BOOLEAN NOT NULL DEFAULT false,
  "embedded_at" TIMESTAMP(6),
  "token_count" INTEGER,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "document_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_chunk_document_id_chunk_index_key" ON "document_chunk"("document_id", "chunk_index");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunk_embedding_id_key" ON "document_chunk"("embedding_id");

-- CreateIndex
CREATE INDEX "document_chunk_document_id_idx" ON "document_chunk"("document_id");

-- CreateIndex
CREATE INDEX "document_chunk_embedding_id_idx" ON "document_chunk"("embedding_id");

-- CreateIndex
CREATE INDEX "document_chunk_embedded_idx" ON "document_chunk"("embedded");

-- CreateIndex
CREATE INDEX "document_ingestion_status_idx" ON "document"("ingestion_status");

-- CreateIndex
CREATE INDEX "content_bank_source_chunk_id_idx" ON "content_bank"("source_chunk_id");

-- CreateIndex
CREATE INDEX "ai_audit_log_user_id_created_at_idx" ON "ai_audit_log"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_audit_log_document_id_idx" ON "ai_audit_log"("document_id");

-- CreateIndex
CREATE INDEX "ai_audit_log_request_id_idx" ON "ai_audit_log"("request_id");

-- AddForeignKey
ALTER TABLE "document_chunk"
ADD CONSTRAINT "document_chunk_document_id_fkey"
FOREIGN KEY ("document_id") REFERENCES "document"("id")
ON DELETE CASCADE
ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_bank"
ADD CONSTRAINT "content_bank_source_chunk_id_fkey"
FOREIGN KEY ("source_chunk_id") REFERENCES "document_chunk"("id")
ON DELETE SET NULL
ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_bank"
ADD CONSTRAINT "content_bank_reviewed_by_fkey"
FOREIGN KEY ("reviewed_by") REFERENCES "USER"("user_id")
ON DELETE NO ACTION
ON UPDATE NO ACTION;
