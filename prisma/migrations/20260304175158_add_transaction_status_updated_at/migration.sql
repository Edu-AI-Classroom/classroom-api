-- AlterTable
ALTER TABLE "transaction" ADD COLUMN "status" VARCHAR(50) DEFAULT 'PENDING',
ADD COLUMN "updated_at" TIMESTAMP(6);

-- UpdateData
UPDATE "transaction" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;
