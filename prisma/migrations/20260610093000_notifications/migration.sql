-- CreateTable
CREATE TABLE "notification" (
  "notification_id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "body" TEXT,
  "type" VARCHAR(50) NOT NULL,
  "link_url" VARCHAR(500),
  "metadata" JSONB,
  "read_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE INDEX "notification_user_id_read_at_created_at_idx" ON "notification"("user_id", "read_at", "created_at");
CREATE INDEX "notification_type_idx" ON "notification"("type");

-- AddForeignKey
ALTER TABLE "notification"
ADD CONSTRAINT "notification_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "USER"("user_id")
ON DELETE CASCADE
ON UPDATE NO ACTION;
