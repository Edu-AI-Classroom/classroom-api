/*
  Warnings:

  - A unique constraint covering the columns `[order_code]` on the table `transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "comment" DROP CONSTRAINT "comment_news_id_fkey";

-- DropForeignKey
ALTER TABLE "comment" DROP CONSTRAINT "comment_parent_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "comment" DROP CONSTRAINT "comment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "news" DROP CONSTRAINT "news_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "news" DROP CONSTRAINT "news_class_id_fkey";

-- DropForeignKey
ALTER TABLE "news" DROP CONSTRAINT "news_user_post_id_fkey";

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "class_id" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "media_url" VARCHAR(255),
ALTER COLUMN "user_post_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "personal_info" ADD COLUMN     "sub_id" INTEGER;

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "order_code" VARCHAR(50),
ADD COLUMN     "sub_code" VARCHAR(50);

-- CreateTable
CREATE TABLE "subscription_plan" (
    "sub_id" SERIAL NOT NULL,
    "sub_code" VARCHAR(50) NOT NULL,
    "sub_name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) DEFAULT 0,
    "duration_days" INTEGER,
    "ai_token_limit" INTEGER,
    "ai_request_limit" INTEGER,
    "max_classes" INTEGER,
    "max_documents" INTEGER,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("sub_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_sub_code_key" ON "subscription_plan"("sub_code");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_order_code_key" ON "transaction"("order_code");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personal_info" ADD CONSTRAINT "fk_personal_sub" FOREIGN KEY ("sub_id") REFERENCES "subscription_plan"("sub_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_user_post_id_fkey" FOREIGN KEY ("user_post_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("news_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comment"("comment_id") ON DELETE CASCADE ON UPDATE CASCADE;
