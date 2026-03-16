/*
  Warnings:

  - The primary key for the `ai_audit_log` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `answer_key` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `gen_block_id` on the `answer_key` table. All the data in the column will be lost.
  - You are about to drop the column `key_id` on the `answer_key` table. All the data in the column will be lost.
  - The `correct_answer` column on the `answer_key` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `audit_log` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `content_bank` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `content` on the `content_bank` table. All the data in the column will be lost.
  - You are about to drop the column `content_id` on the `content_bank` table. All the data in the column will be lost.
  - You are about to drop the column `content_type` on the `content_bank` table. All the data in the column will be lost.
  - You are about to drop the column `structure` on the `content_bank` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `content_bank` table. All the data in the column will be lost.
  - The `tags` column on the `content_bank` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `document` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `current_ver_id` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `doc_id` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `doc_title` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `doc_type` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `page_setting` on the `document` table. All the data in the column will be lost.
  - The `status` column on the `document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `submission_ans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `gen_block_id` on the `submission_ans` table. All the data in the column will be lost.
  - The `student_answer` column on the `submission_ans` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `content_block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_version` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `layout_block` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[block_id]` on the table `answer_key` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `block_id` to the `answer_key` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `answer_key` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `answer_type` on table `answer_key` required. This step will fail if there are existing NULL values in that column.
  - Made the column `score` on table `answer_key` required. This step will fail if there are existing NULL values in that column.
  - The required column `id` was added to the `content_bank` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `payload` to the `content_bank` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `content_bank` table without a default value. This is not possible if the table is not empty.
  - Made the column `grade_level` on table `content_bank` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subject_id` on table `content_bank` required. This step will fail if there are existing NULL values in that column.
  - Made the column `owner_id` on table `content_bank` required. This step will fail if there are existing NULL values in that column.
  - Made the column `usage_count` on table `content_bank` required. This step will fail if there are existing NULL values in that column.
  - The required column `id` was added to the `document` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `title` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `document` table without a default value. This is not possible if the table is not empty.
  - Made the column `grade_level` on table `document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subject_id` on table `document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `owner_id` on table `document` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `block_id` to the `submission_ans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('EXAM', 'LESSON', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('QUESTION', 'READING', 'INSTRUCTION', 'MEDIA', 'SPACER');

-- CreateEnum
CREATE TYPE "SemanticRole" AS ENUM ('MCQ', 'SHORT_ANSWER', 'ESSAY', 'FILL_BLANK', 'READING_PASSAGE', 'INSTRUCTION', 'MEDIA', 'BLANK');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'IMAGE', 'AUDIO', 'QUIZ_MCQ', 'QUIZ_SHORT', 'READING');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- DropForeignKey
ALTER TABLE "answer_key" DROP CONSTRAINT "answer_key_gen_block_id_fkey";

-- DropForeignKey
ALTER TABLE "assessment" DROP CONSTRAINT "assessment_doc_id_fkey";

-- DropForeignKey
ALTER TABLE "content_block" DROP CONSTRAINT "content_block_block_id_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_class_id_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "fk_doc_current_version";

-- DropForeignKey
ALTER TABLE "document_version" DROP CONSTRAINT "document_version_doc_id_fkey";

-- DropForeignKey
ALTER TABLE "layout_block" DROP CONSTRAINT "layout_block_ver_id_fkey";

-- DropForeignKey
ALTER TABLE "submission_ans" DROP CONSTRAINT "submission_ans_gen_block_id_fkey";

-- AlterTable
ALTER TABLE "ai_audit_log" DROP CONSTRAINT "ai_audit_log_pkey",
ALTER COLUMN "log_id" DROP DEFAULT,
ALTER COLUMN "log_id" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "ai_audit_log_pkey" PRIMARY KEY ("log_id");
DROP SEQUENCE "ai_audit_log_log_id_seq";

-- AlterTable
ALTER TABLE "answer_key" DROP CONSTRAINT "answer_key_pkey",
DROP COLUMN "gen_block_id",
DROP COLUMN "key_id",
ADD COLUMN     "block_id" CHAR(36) NOT NULL,
ADD COLUMN     "id" CHAR(36) NOT NULL,
ALTER COLUMN "answer_type" SET NOT NULL,
DROP COLUMN "correct_answer",
ADD COLUMN     "correct_answer" JSONB,
ALTER COLUMN "score" SET NOT NULL,
ADD CONSTRAINT "answer_key_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "assessment" ALTER COLUMN "doc_id" SET DATA TYPE CHAR(36);

-- AlterTable
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_pkey",
ALTER COLUMN "log_id" DROP DEFAULT,
ALTER COLUMN "log_id" SET DATA TYPE CHAR(36),
ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("log_id");
DROP SEQUENCE "audit_log_log_id_seq";

-- AlterTable
ALTER TABLE "content_bank" DROP CONSTRAINT "content_bank_pkey",
DROP COLUMN "content",
DROP COLUMN "content_id",
DROP COLUMN "content_type",
DROP COLUMN "structure",
DROP COLUMN "visibility",
ADD COLUMN     "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "difficulty" "DifficultyLevel",
ADD COLUMN     "id" CHAR(36) NOT NULL,
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payload" JSONB NOT NULL,
ADD COLUMN     "type" "ContentType" NOT NULL,
ALTER COLUMN "grade_level" SET NOT NULL,
ALTER COLUMN "subject_id" SET NOT NULL,
DROP COLUMN "tags",
ADD COLUMN     "tags" TEXT[],
ALTER COLUMN "owner_id" SET NOT NULL,
ALTER COLUMN "usage_count" SET NOT NULL,
ADD CONSTRAINT "content_bank_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "document" DROP CONSTRAINT "document_pkey",
DROP COLUMN "current_ver_id",
DROP COLUMN "doc_id",
DROP COLUMN "doc_title",
DROP COLUMN "doc_type",
DROP COLUMN "page_setting",
ADD COLUMN     "duplicated_from" CHAR(36),
ADD COLUMN     "id" CHAR(36) NOT NULL,
ADD COLUMN     "published_at" TIMESTAMP(6),
ADD COLUMN     "title" VARCHAR(255) NOT NULL,
ADD COLUMN     "type" "DocumentType" NOT NULL,
ALTER COLUMN "grade_level" SET NOT NULL,
ALTER COLUMN "subject_id" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "owner_id" SET NOT NULL,
ADD CONSTRAINT "document_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "submission_ans" DROP CONSTRAINT "submission_ans_pkey",
DROP COLUMN "gen_block_id",
ADD COLUMN     "answered_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "block_id" CHAR(36) NOT NULL,
ADD COLUMN     "grading_status" VARCHAR(50) DEFAULT 'pending',
DROP COLUMN "student_answer",
ADD COLUMN     "student_answer" JSONB,
ADD CONSTRAINT "submission_ans_pkey" PRIMARY KEY ("attempt_id", "block_id");

-- DropTable
DROP TABLE "content_block";

-- DropTable
DROP TABLE "document_version";

-- DropTable
DROP TABLE "layout_block";

-- CreateTable
CREATE TABLE "document_block" (
    "id" CHAR(36) NOT NULL,
    "document_id" CHAR(36) NOT NULL,
    "block_type" "BlockType" NOT NULL,
    "semantic_role" "SemanticRole" NOT NULL DEFAULT 'BLANK',
    "position_order" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "content" JSONB,
    "content_bank_id" CHAR(36),
    "override_data" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_block_document_id_idx" ON "document_block"("document_id");

-- CreateIndex
CREATE INDEX "document_block_position_order_idx" ON "document_block"("position_order");

-- CreateIndex
CREATE INDEX "document_block_content_bank_id_idx" ON "document_block"("content_bank_id");

-- CreateIndex
CREATE UNIQUE INDEX "answer_key_block_id_key" ON "answer_key"("block_id");

-- CreateIndex
CREATE INDEX "answer_key_block_id_idx" ON "answer_key"("block_id");

-- CreateIndex
CREATE INDEX "content_bank_owner_id_idx" ON "content_bank"("owner_id");

-- CreateIndex
CREATE INDEX "content_bank_type_subject_id_grade_level_difficulty_idx" ON "content_bank"("type", "subject_id", "grade_level", "difficulty");

-- CreateIndex
CREATE INDEX "document_owner_id_idx" ON "document"("owner_id");

-- CreateIndex
CREATE INDEX "document_class_id_idx" ON "document"("class_id");

-- CreateIndex
CREATE INDEX "document_subject_id_grade_level_idx" ON "document"("subject_id", "grade_level");

-- CreateIndex
CREATE INDEX "submission_ans_attempt_id_idx" ON "submission_ans"("attempt_id");

-- AddForeignKey
ALTER TABLE "answer_key" ADD CONSTRAINT "answer_key_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "document_block"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_duplicated_from_fkey" FOREIGN KEY ("duplicated_from") REFERENCES "document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_block" ADD CONSTRAINT "document_block_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_block" ADD CONSTRAINT "document_block_content_bank_id_fkey" FOREIGN KEY ("content_bank_id") REFERENCES "content_bank"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "submission_ans" ADD CONSTRAINT "submission_ans_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "document_block"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
