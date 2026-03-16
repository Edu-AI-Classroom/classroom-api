-- CreateTable
CREATE TABLE "quiz_meta" (
  "document_id" CHAR(36) NOT NULL,
  "time_limit_minutes" INTEGER,
  "total_points" INTEGER,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "quiz_meta_pkey" PRIMARY KEY ("document_id")
);

-- AddForeignKey
ALTER TABLE "quiz_meta"
ADD CONSTRAINT "quiz_meta_document_id_fkey"
FOREIGN KEY ("document_id") REFERENCES "document"("id")
ON DELETE CASCADE
ON UPDATE NO ACTION;

-- CreateIndex
CREATE INDEX "quiz_meta_document_id_idx" ON "quiz_meta"("document_id");

