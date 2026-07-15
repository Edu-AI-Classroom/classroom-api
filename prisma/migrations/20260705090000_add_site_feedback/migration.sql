CREATE TABLE "site_feedback" (
    "feedback_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255),
    "role" VARCHAR(50),
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "site_feedback_pkey" PRIMARY KEY ("feedback_id")
);

CREATE INDEX "site_feedback_is_approved_created_at_idx" ON "site_feedback"("is_approved", "created_at");
CREATE INDEX "site_feedback_rating_idx" ON "site_feedback"("rating");

ALTER TABLE "site_feedback"
ADD CONSTRAINT "site_feedback_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "USER"("user_id")
ON DELETE SET NULL ON UPDATE NO ACTION;
