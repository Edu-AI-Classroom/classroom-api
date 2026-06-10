ALTER TABLE "conversation"
ADD COLUMN IF NOT EXISTS "conversation_type" VARCHAR(50) NOT NULL DEFAULT 'PARENT_TEACHER';

ALTER TABLE "conversation"
ALTER COLUMN "parent_id" DROP NOT NULL;

DROP INDEX IF EXISTS "conversation_class_id_student_id_parent_id_teacher_id_key";

CREATE UNIQUE INDEX IF NOT EXISTS "conversation_parent_teacher_unique"
ON "conversation" ("class_id", "student_id", "parent_id", "teacher_id", "conversation_type")
WHERE "conversation_type" = 'PARENT_TEACHER' AND "parent_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "conversation_student_teacher_unique"
ON "conversation" ("class_id", "student_id", "teacher_id", "conversation_type")
WHERE "conversation_type" = 'STUDENT_TEACHER' AND "parent_id" IS NULL;

CREATE INDEX IF NOT EXISTS "conversation_student_id_class_id_idx"
ON "conversation" ("student_id", "class_id");
