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

-- CreateTable
CREATE TABLE "ai_audit_log" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "feature" VARCHAR(100),
    "created_at" TIMESTAMP(6),
    "interaction_data" TEXT,
    "total_tokens" INTEGER,
    "cost" DECIMAL(10,6),
    "rating" INTEGER,
    "request_id" VARCHAR(100),

    CONSTRAINT "ai_audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "answer_key" (
    "key_id" SERIAL NOT NULL,
    "gen_block_id" INTEGER,
    "answer_type" VARCHAR(50),
    "correct_answer" TEXT,
    "score" DECIMAL(5,2),

    CONSTRAINT "answer_key_pkey" PRIMARY KEY ("key_id")
);

-- CreateTable
CREATE TABLE "assessment" (
    "assessment_id" SERIAL NOT NULL,
    "doc_id" INTEGER,
    "class_id" INTEGER,
    "start_date" TIMESTAMP(6),
    "due_date" TIMESTAMP(6),
    "total_done" INTEGER,
    "status" VARCHAR(50),
    "assigned_by" INTEGER,

    CONSTRAINT "assessment_pkey" PRIMARY KEY ("assessment_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "role" VARCHAR(50),
    "table_name" VARCHAR(100),
    "record_id" INTEGER,
    "feature" VARCHAR(100),
    "action" VARCHAR(100),
    "old_value" TEXT,
    "new_value" TEXT,
    "client_ip" VARCHAR(45),
    "user_agent" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "book" (
    "book_id" SERIAL NOT NULL,
    "subject_id" INTEGER,
    "grade_level" INTEGER,
    "volume" INTEGER,
    "book_title" VARCHAR(255),
    "publisher" VARCHAR(255),
    "publish_year" INTEGER,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "book_pkey" PRIMARY KEY ("book_id")
);

-- CreateTable
CREATE TABLE "book_section" (
    "section_id" SERIAL NOT NULL,
    "book_id" INTEGER,
    "chapter_title" VARCHAR(255),
    "section_title" VARCHAR(255),
    "hierarchy_level" INTEGER,
    "page_from" INTEGER,
    "page_to" INTEGER,

    CONSTRAINT "book_section_pkey" PRIMARY KEY ("section_id")
);

-- CreateTable
CREATE TABLE "class_group" (
    "group_id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "group_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "class_group_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "class_student" (
    "class_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(6),

    CONSTRAINT "class_student_pkey" PRIMARY KEY ("class_id","student_id")
);

-- CreateTable
CREATE TABLE "classroom" (
    "class_id" SERIAL NOT NULL,
    "class_name" VARCHAR(255) NOT NULL,
    "subject_id" INTEGER,
    "grade_level" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "classroom_pkey" PRIMARY KEY ("class_id")
);

-- CreateTable
CREATE TABLE "content_bank" (
    "content_id" SERIAL NOT NULL,
    "content_type" VARCHAR(50),
    "book_id" INTEGER,
    "grade_level" INTEGER,
    "subject_id" INTEGER,
    "chapter_id" INTEGER,
    "section_id" INTEGER,
    "tags" VARCHAR(255),
    "cognitive_level" VARCHAR(50),
    "content" TEXT,
    "structure" TEXT,
    "visibility" VARCHAR(20),
    "owner_id" INTEGER,
    "usage_count" INTEGER DEFAULT 0,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "content_bank_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "content_block" (
    "content_id" SERIAL NOT NULL,
    "parent_content_id" INTEGER,
    "block_id" INTEGER,
    "content" TEXT,
    "source" VARCHAR(255),
    "is_active" BOOLEAN,
    "created_at" TIMESTAMP(6),
    "is_locked" BOOLEAN,

    CONSTRAINT "content_block_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "document" (
    "doc_id" SERIAL NOT NULL,
    "doc_title" VARCHAR(255),
    "doc_type" VARCHAR(50),
    "grade_level" INTEGER,
    "subject_id" INTEGER,
    "note" TEXT,
    "page_setting" TEXT,
    "status" VARCHAR(50),
    "updated_at" TIMESTAMP(6),
    "owner_id" INTEGER,
    "current_ver_id" INTEGER,

    CONSTRAINT "document_pkey" PRIMARY KEY ("doc_id")
);

-- CreateTable
CREATE TABLE "document_version" (
    "ver_id" SERIAL NOT NULL,
    "doc_id" INTEGER,
    "parent_ver_id" INTEGER,
    "settings" TEXT,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "document_version_pkey" PRIMARY KEY ("ver_id")
);

-- CreateTable
CREATE TABLE "group_student" (
    "group_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_student_pkey" PRIMARY KEY ("group_id","student_id")
);

-- CreateTable
CREATE TABLE "knowledge_unit" (
    "unit_id" SERIAL NOT NULL,
    "section_id" INTEGER,
    "unit_type" VARCHAR(50),
    "learning_objective" TEXT,
    "content" TEXT,
    "citation" VARCHAR(255),
    "embedding" TEXT,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "knowledge_unit_pkey" PRIMARY KEY ("unit_id")
);

-- CreateTable
CREATE TABLE "ku_reference" (
    "knowledge_unit_id" INTEGER NOT NULL,
    "subject" VARCHAR(255),
    "grade_level" INTEGER,
    "difficulty" INTEGER,
    "cognitive_level" VARCHAR(50),
    "version" INTEGER,
    "is_active" BOOLEAN,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "ku_reference_pkey" PRIMARY KEY ("knowledge_unit_id")
);

-- CreateTable
CREATE TABLE "layout_block" (
    "block_id" SERIAL NOT NULL,
    "parent_block_id" INTEGER,
    "ver_id" INTEGER,
    "block_type" VARCHAR(50),
    "semantic_role" VARCHAR(50),
    "layout_config" TEXT,
    "content_config" TEXT,
    "is_correct" BOOLEAN,
    "created_at" TIMESTAMP(6),
    "is_locked" BOOLEAN,

    CONSTRAINT "layout_block_pkey" PRIMARY KEY ("block_id")
);

-- CreateTable
CREATE TABLE "layout_template" (
    "template_id" SERIAL NOT NULL,
    "template_name" VARCHAR(255),
    "description" TEXT,
    "preview_thumbnail" VARCHAR(500),
    "template_type" VARCHAR(50),
    "schema_definition" TEXT,
    "structure_blueprint" TEXT,
    "ai_rule" TEXT,
    "visibility" VARCHAR(20),
    "created_at" TIMESTAMP(6),

    CONSTRAINT "layout_template_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "personal_info" (
    "user_id" INTEGER NOT NULL,
    "speciality" VARCHAR(255),
    "teacher_bio" TEXT,
    "dob" DATE,
    "sub_start_date" TIMESTAMP(6),
    "sub_status" VARCHAR(50),
    "sub_id" INTEGER,

    CONSTRAINT "personal_info_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "student" (
    "student_id" INTEGER NOT NULL,
    "grade_level" INTEGER,
    "parent_phone" VARCHAR(20),

    CONSTRAINT "student_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "student_ku_state" (
    "student_id" INTEGER NOT NULL,
    "knowledge_unit_id" INTEGER NOT NULL,
    "mastery" DECIMAL(5,2),
    "confidence" DECIMAL(5,2),
    "forgetting_rate" DECIMAL(5,2),
    "last_practiced" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "student_ku_state_pkey" PRIMARY KEY ("student_id","knowledge_unit_id")
);

-- CreateTable
CREATE TABLE "student_report" (
    "student_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "total_assessment" INTEGER,
    "completed_assessment" INTEGER,
    "avg_score" DECIMAL(5,2),
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "student_report_pkey" PRIMARY KEY ("student_id","class_id")
);

-- CreateTable
CREATE TABLE "student_submission" (
    "attempt_id" SERIAL NOT NULL,
    "assessment_id" INTEGER,
    "student_id" INTEGER,
    "total_score" DECIMAL(5,2),
    "status" VARCHAR(50),
    "feedback" TEXT,
    "started_at" TIMESTAMP(6),
    "submitted_at" TIMESTAMP(6),

    CONSTRAINT "student_submission_pkey" PRIMARY KEY ("attempt_id")
);

-- CreateTable
CREATE TABLE "subject" (
    "subject_id" SERIAL NOT NULL,
    "subject_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("subject_id")
);

-- CreateTable
CREATE TABLE "submission_ans" (
    "attempt_id" INTEGER NOT NULL,
    "gen_block_id" INTEGER NOT NULL,
    "student_answer" TEXT,
    "score" DECIMAL(5,2),
    "feedback" TEXT,

    CONSTRAINT "submission_ans_pkey" PRIMARY KEY ("attempt_id","gen_block_id")
);

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

-- CreateTable
CREATE TABLE "teacher" (
    "teacher_id" INTEGER NOT NULL,
    "specialization" VARCHAR(255),
    "department" VARCHAR(255),
    "qualification" VARCHAR(255),
    "experience_years" INTEGER,
    "is_verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6),

    CONSTRAINT "teacher_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "teacher_classroom" (
    "teacher_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "teacher_classroom_pkey" PRIMARY KEY ("teacher_id","class_id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "transaction_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "payment_gateway" VARCHAR(50),
    "transaction_type" VARCHAR(50),
    "amount" DECIMAL(10,2),
    "note" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USER_email_key" ON "USER"("email");

-- CreateIndex
CREATE UNIQUE INDEX "class_group_class_id_group_name_key" ON "class_group"("class_id", "group_name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_sub_code_key" ON "subscription_plan"("sub_code");

-- AddForeignKey
ALTER TABLE "answer_key" ADD CONSTRAINT "answer_key_gen_block_id_fkey" FOREIGN KEY ("gen_block_id") REFERENCES "layout_block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "document"("doc_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book" ADD CONSTRAINT "book_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("subject_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "book_section" ADD CONSTRAINT "book_section_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "book"("book_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "class_group" ADD CONSTRAINT "class_group_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "class_student" ADD CONSTRAINT "class_student_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "class_student" ADD CONSTRAINT "class_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("subject_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_bank" ADD CONSTRAINT "content_bank_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_bank" ADD CONSTRAINT "content_bank_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("subject_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_block" ADD CONSTRAINT "content_block_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "layout_block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("subject_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "fk_doc_current_version" FOREIGN KEY ("current_ver_id") REFERENCES "document_version"("ver_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_version" ADD CONSTRAINT "document_version_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "document"("doc_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_student" ADD CONSTRAINT "group_student_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "class_group"("group_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "group_student" ADD CONSTRAINT "group_student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "knowledge_unit" ADD CONSTRAINT "knowledge_unit_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "book_section"("section_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "layout_block" ADD CONSTRAINT "layout_block_ver_id_fkey" FOREIGN KEY ("ver_id") REFERENCES "document_version"("ver_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personal_info" ADD CONSTRAINT "fk_personal_sub" FOREIGN KEY ("sub_id") REFERENCES "subscription_plan"("sub_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personal_info" ADD CONSTRAINT "personal_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student" ADD CONSTRAINT "student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_ku_state" ADD CONSTRAINT "student_ku_state_knowledge_unit_id_fkey" FOREIGN KEY ("knowledge_unit_id") REFERENCES "knowledge_unit"("unit_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_ku_state" ADD CONSTRAINT "student_ku_state_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_report" ADD CONSTRAINT "student_report_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_report" ADD CONSTRAINT "student_report_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_submission" ADD CONSTRAINT "student_submission_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessment"("assessment_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_submission" ADD CONSTRAINT "student_submission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("student_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "submission_ans" ADD CONSTRAINT "submission_ans_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "student_submission"("attempt_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "submission_ans" ADD CONSTRAINT "submission_ans_gen_block_id_fkey" FOREIGN KEY ("gen_block_id") REFERENCES "layout_block"("block_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher" ADD CONSTRAINT "teacher_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_classroom" ADD CONSTRAINT "teacher_classroom_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classroom"("class_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_classroom" ADD CONSTRAINT "teacher_classroom_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "USER"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "USER"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
