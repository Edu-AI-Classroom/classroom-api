-- CreateTable
CREATE TABLE "parent" (
  "parent_id" INTEGER NOT NULL,
  "phone" VARCHAR(20),
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6),

  CONSTRAINT "parent_pkey" PRIMARY KEY ("parent_id")
);

-- CreateTable
CREATE TABLE "parent_student" (
  "parent_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "relationship" VARCHAR(50),
  "linked_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',

  CONSTRAINT "parent_student_pkey" PRIMARY KEY ("parent_id", "student_id")
);

-- CreateTable
CREATE TABLE "parent_link_code" (
  "code" VARCHAR(32) NOT NULL,
  "student_id" INTEGER NOT NULL,
  "created_by_student_id" INTEGER NOT NULL,
  "expires_at" TIMESTAMP(6) NOT NULL,
  "used_at" TIMESTAMP(6),
  "used_by_parent_id" INTEGER,
  "is_revoked" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "parent_link_code_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "conversation" (
  "conversation_id" SERIAL NOT NULL,
  "class_id" INTEGER NOT NULL,
  "student_id" INTEGER NOT NULL,
  "parent_id" INTEGER NOT NULL,
  "teacher_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6),
  "last_message_at" TIMESTAMP(6),

  CONSTRAINT "conversation_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "message" (
  "message_id" SERIAL NOT NULL,
  "conversation_id" INTEGER NOT NULL,
  "sender_id" INTEGER NOT NULL,
  "body" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at" TIMESTAMP(6),
  "deleted_at" TIMESTAMP(6),

  CONSTRAINT "message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "message_attachment" (
  "attachment_id" SERIAL NOT NULL,
  "message_id" INTEGER NOT NULL,
  "file_url" VARCHAR(1000) NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "file_size" INTEGER NOT NULL,

  CONSTRAINT "message_attachment_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "message_read" (
  "message_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "read_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "message_read_pkey" PRIMARY KEY ("message_id", "user_id")
);

-- CreateIndex
CREATE INDEX "parent_student_student_id_idx" ON "parent_student"("student_id");
CREATE INDEX "parent_student_status_idx" ON "parent_student"("status");
CREATE INDEX "parent_link_code_student_id_expires_at_idx" ON "parent_link_code"("student_id", "expires_at");
CREATE INDEX "parent_link_code_used_by_parent_id_idx" ON "parent_link_code"("used_by_parent_id");
CREATE UNIQUE INDEX "conversation_class_id_student_id_parent_id_teacher_id_key" ON "conversation"("class_id", "student_id", "parent_id", "teacher_id");
CREATE INDEX "conversation_parent_id_idx" ON "conversation"("parent_id");
CREATE INDEX "conversation_teacher_id_class_id_idx" ON "conversation"("teacher_id", "class_id");
CREATE INDEX "conversation_last_message_at_idx" ON "conversation"("last_message_at");
CREATE INDEX "message_conversation_id_created_at_idx" ON "message"("conversation_id", "created_at");
CREATE INDEX "message_sender_id_idx" ON "message"("sender_id");
CREATE INDEX "message_attachment_message_id_idx" ON "message_attachment"("message_id");
CREATE INDEX "message_read_user_id_idx" ON "message_read"("user_id");

-- AddForeignKey
ALTER TABLE "parent" ADD CONSTRAINT "parent_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "USER"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent"("parent_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "parent_link_code" ADD CONSTRAINT "parent_link_code_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "parent_link_code" ADD CONSTRAINT "parent_link_code_used_by_parent_id_fkey" FOREIGN KEY ("used_by_parent_id") REFERENCES "USER"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent"("parent_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_teacher_id_class_id_fkey" FOREIGN KEY ("teacher_id", "class_id") REFERENCES "teacher_classroom"("teacher_id", "class_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("conversation_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "message_attachment" ADD CONSTRAINT "message_attachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message"("message_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "message_read" ADD CONSTRAINT "message_read_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message"("message_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "message_read" ADD CONSTRAINT "message_read_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
