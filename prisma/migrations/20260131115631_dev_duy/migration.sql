/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "assessment" DROP CONSTRAINT "assessment_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "classroom" DROP CONSTRAINT "classroom_created_by_fkey";

-- DropForeignKey
ALTER TABLE "content_bank" DROP CONSTRAINT "content_bank_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "personal_info" DROP CONSTRAINT "personal_info_user_id_fkey";

-- DropForeignKey
ALTER TABLE "student" DROP CONSTRAINT "student_student_id_fkey";

-- DropForeignKey
ALTER TABLE "teacher" DROP CONSTRAINT "teacher_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "teacher_classroom" DROP CONSTRAINT "teacher_classroom_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_user_id_fkey";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "USER" (
    "user_id" SERIAL NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "is_active" BOOLEAN DEFAULT true,
    "profile_picture" VARCHAR(500),
    "role" VARCHAR(50),
    "credit" INTEGER DEFAULT 0,

    CONSTRAINT "USER_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USER_email_key" ON "USER"("email");

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_classroom" ADD CONSTRAINT "teacher_classroom_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "USER"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_bank" ADD CONSTRAINT "content_bank_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personal_info" ADD CONSTRAINT "personal_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
