-- Demo seed for Admin Dashboard showcase.
-- Date window: 2026-06-05 to 2026-06-11.
-- Creates 5 trial users only:
--   Minh Ngọc (Teacher), Đăng Triết (Student), Mai Anh (Student),
--   Ngọc Khanh (Student), Hoàng Uyên (Parent)
-- These users do not have paid subscription purchases. Trial activity is recorded
-- with amount = 0 and status = TRIAL.
-- Safe to run more than once.

WITH sequence_sync AS (
  SELECT
    setval(
      pg_get_serial_sequence('"USER"', 'user_id'),
      COALESCE((SELECT MAX(user_id) FROM "USER"), 0) + 1,
      false
    ) AS user_sequence,
    setval(
      pg_get_serial_sequence('"subject"', 'subject_id'),
      COALESCE((SELECT MAX(subject_id) FROM "subject"), 0) + 1,
      false
    ) AS subject_sequence,
    setval(
      pg_get_serial_sequence('"classroom"', 'class_id'),
      COALESCE((SELECT MAX(class_id) FROM "classroom"), 0) + 1,
      false
    ) AS classroom_sequence,
    setval(
      pg_get_serial_sequence('"transaction"', 'transaction_id'),
      COALESCE((SELECT MAX(transaction_id) FROM "transaction"), 0) + 1,
      false
    ) AS transaction_sequence
),
demo_users AS (
  INSERT INTO "USER" (
    user_name, email, password_hash, role, credit, is_active, created_at, updated_at
  )
  SELECT v.user_name, v.email, v.password_hash, v.role, v.credit, v.is_active, v.created_at, v.updated_at
  FROM (
    VALUES
    ('Minh Ngọc', 'minhngoc@gmail.com', NULL, 'TEACHER', 25, true, '2026-06-05 09:10:00'::timestamp, '2026-06-05 09:10:00'::timestamp),
    ('Đăng Triết', 'dangtriet@gmail.com', NULL, 'STUDENT', 0, true, '2026-06-06 10:20:00'::timestamp, '2026-06-06 10:20:00'::timestamp),
    ('Mai Anh', 'maianh@gmail.com', NULL, 'STUDENT', 0, true, '2026-06-07 14:35:00'::timestamp, '2026-06-07 14:35:00'::timestamp),
    ('Ngọc Khanh', 'ngockhanh@gmail.com', NULL, 'STUDENT', 0, true, '2026-06-08 08:45:00'::timestamp, '2026-06-08 08:45:00'::timestamp),
    ('Hoàng Uyên', 'hoanguyen@gmail.com', NULL, 'PARENT', 0, true, '2026-06-09 17:15:00'::timestamp, '2026-06-09 17:15:00'::timestamp)
  ) AS v(user_name, email, password_hash, role, credit, is_active, created_at, updated_at)
  CROSS JOIN sequence_sync
  ON CONFLICT (email) DO UPDATE SET
    user_name = EXCLUDED.user_name,
    role = EXCLUDED.role,
    credit = EXCLUDED.credit,
    is_active = EXCLUDED.is_active,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at
  RETURNING user_id, email
),
user_pick AS (
  SELECT
    (SELECT user_id FROM demo_users WHERE email = 'minhngoc@gmail.com') AS teacher_id,
    (SELECT user_id FROM demo_users WHERE email = 'dangtriet@gmail.com') AS dang_triet_id,
    (SELECT user_id FROM demo_users WHERE email = 'maianh@gmail.com') AS mai_anh_id,
    (SELECT user_id FROM demo_users WHERE email = 'ngockhanh@gmail.com') AS ngoc_khanh_id,
    (SELECT user_id FROM demo_users WHERE email = 'hoanguyen@gmail.com') AS parent_id
),
teacher_profile AS (
  INSERT INTO "teacher" (
    teacher_id, specialization, department, qualification, experience_years,
    is_verified, created_at, updated_at
  )
  SELECT
    teacher_id,
    'Mathematics',
    'Primary Learning',
    'Demo teacher account',
    5,
    true,
    '2026-06-05 09:15:00'::timestamp,
    '2026-06-05 09:15:00'::timestamp
  FROM user_pick
  WHERE teacher_id IS NOT NULL
  ON CONFLICT (teacher_id) DO UPDATE SET
    specialization = EXCLUDED.specialization,
    department = EXCLUDED.department,
    qualification = EXCLUDED.qualification,
    experience_years = EXCLUDED.experience_years,
    is_verified = EXCLUDED.is_verified,
    updated_at = EXCLUDED.updated_at
  RETURNING teacher_id
),
student_profiles AS (
  INSERT INTO "student" (student_id, grade_level, parent_phone)
  SELECT student_id, grade_level, parent_phone
  FROM user_pick u
  CROSS JOIN LATERAL (
    VALUES
      (u.dang_triet_id, 6, '0900000606'),
      (u.mai_anh_id, 6, '0900000607'),
      (u.ngoc_khanh_id, 7, '0900000608')
  ) AS v(student_id, grade_level, parent_phone)
  WHERE v.student_id IS NOT NULL
  ON CONFLICT (student_id) DO UPDATE SET
    grade_level = EXCLUDED.grade_level,
    parent_phone = EXCLUDED.parent_phone
  RETURNING student_id
),
parent_profile AS (
  INSERT INTO "parent" (parent_id, phone, created_at, updated_at)
  SELECT parent_id, '0900000609', '2026-06-09 17:20:00'::timestamp, '2026-06-09 17:20:00'::timestamp
  FROM user_pick
  WHERE parent_id IS NOT NULL
  ON CONFLICT (parent_id) DO UPDATE SET
    phone = EXCLUDED.phone,
    updated_at = EXCLUDED.updated_at
  RETURNING parent_id
),
demo_subjects AS (
  INSERT INTO "subject" (subject_name)
  SELECT subject_name
  FROM (VALUES ('Mathematics'), ('English'), ('Science')) AS v(subject_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM "subject" s WHERE s.subject_name = v.subject_name
  )
  RETURNING subject_id, subject_name
),
subject_pick AS (
  SELECT
    COALESCE(
      (SELECT subject_id FROM demo_subjects WHERE subject_name = 'Mathematics' LIMIT 1),
      (SELECT subject_id FROM "subject" WHERE subject_name = 'Mathematics' LIMIT 1)
    ) AS math_id,
    COALESCE(
      (SELECT subject_id FROM demo_subjects WHERE subject_name = 'English' LIMIT 1),
      (SELECT subject_id FROM "subject" WHERE subject_name = 'English' LIMIT 1)
    ) AS english_id,
    COALESCE(
      (SELECT subject_id FROM demo_subjects WHERE subject_name = 'Science' LIMIT 1),
      (SELECT subject_id FROM "subject" WHERE subject_name = 'Science' LIMIT 1)
    ) AS science_id
),
classroom_insert AS (
  INSERT INTO "classroom" (
    class_name, subject_id, grade_level, created_by, created_at, updated_at, is_deleted
  )
  SELECT
    v.class_name,
    v.subject_id,
    v.grade_level,
    u.teacher_id,
    v.created_at,
    v.created_at,
    false
  FROM user_pick u
  CROSS JOIN subject_pick s
  CROSS JOIN LATERAL (
    VALUES
      ('Admin Demo Math 6A', s.math_id, 6, '2026-06-08 09:30:00'::timestamp),
      ('Admin Demo English Lab', s.english_id, 6, '2026-06-10 11:00:00'::timestamp),
      ('Admin Demo Science Club', s.science_id, 7, '2026-06-11 08:20:00'::timestamp)
  ) AS v(class_name, subject_id, grade_level, created_at)
  WHERE u.teacher_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "classroom" c WHERE c.class_name = v.class_name
    )
  RETURNING class_id, class_name
),
class_pick AS (
  SELECT
    COALESCE(
      (SELECT class_id FROM classroom_insert WHERE class_name = 'Admin Demo Math 6A' LIMIT 1),
      (SELECT class_id FROM "classroom" WHERE class_name = 'Admin Demo Math 6A' LIMIT 1)
    ) AS math_class_id,
    COALESCE(
      (SELECT class_id FROM classroom_insert WHERE class_name = 'Admin Demo English Lab' LIMIT 1),
      (SELECT class_id FROM "classroom" WHERE class_name = 'Admin Demo English Lab' LIMIT 1)
    ) AS english_class_id,
    COALESCE(
      (SELECT class_id FROM classroom_insert WHERE class_name = 'Admin Demo Science Club' LIMIT 1),
      (SELECT class_id FROM "classroom" WHERE class_name = 'Admin Demo Science Club' LIMIT 1)
    ) AS science_class_id
),
teacher_classrooms AS (
  INSERT INTO "teacher_classroom" (teacher_id, class_id, added_at, is_owner)
  SELECT u.teacher_id, v.class_id, v.added_at, true
  FROM user_pick u
  CROSS JOIN class_pick c
  CROSS JOIN LATERAL (
    VALUES
      (c.math_class_id, '2026-06-08 09:35:00'::timestamp),
      (c.english_class_id, '2026-06-10 11:05:00'::timestamp),
      (c.science_class_id, '2026-06-11 08:25:00'::timestamp)
  ) AS v(class_id, added_at)
  WHERE u.teacher_id IS NOT NULL AND v.class_id IS NOT NULL
  ON CONFLICT (teacher_id, class_id) DO UPDATE SET
    added_at = EXCLUDED.added_at,
    is_owner = EXCLUDED.is_owner
  RETURNING class_id
),
class_students AS (
  INSERT INTO "class_student" (class_id, student_id, joined_at)
  SELECT v.class_id, v.student_id, v.joined_at
  FROM user_pick u
  CROSS JOIN class_pick c
  CROSS JOIN LATERAL (
    VALUES
      (c.math_class_id, u.dang_triet_id, '2026-06-08 10:00:00'::timestamp),
      (c.math_class_id, u.mai_anh_id, '2026-06-08 10:05:00'::timestamp),
      (c.english_class_id, u.dang_triet_id, '2026-06-10 11:30:00'::timestamp),
      (c.english_class_id, u.mai_anh_id, '2026-06-10 11:35:00'::timestamp),
      (c.science_class_id, u.ngoc_khanh_id, '2026-06-11 09:00:00'::timestamp)
  ) AS v(class_id, student_id, joined_at)
  WHERE v.class_id IS NOT NULL AND v.student_id IS NOT NULL
  ON CONFLICT (class_id, student_id) DO UPDATE SET
    joined_at = EXCLUDED.joined_at
  RETURNING class_id, student_id
),
parent_links AS (
  INSERT INTO "parent_student" (parent_id, student_id, relationship, linked_at, status)
  SELECT u.parent_id, v.student_id, 'Mother', v.linked_at, 'ACTIVE'
  FROM user_pick u
  CROSS JOIN LATERAL (
    VALUES
      (u.dang_triet_id, '2026-06-09 17:45:00'::timestamp),
      (u.mai_anh_id, '2026-06-09 17:50:00'::timestamp),
      (u.ngoc_khanh_id, '2026-06-10 18:10:00'::timestamp)
  ) AS v(student_id, linked_at)
  WHERE u.parent_id IS NOT NULL AND v.student_id IS NOT NULL
  ON CONFLICT (parent_id, student_id) DO UPDATE SET
    relationship = EXCLUDED.relationship,
    linked_at = EXCLUDED.linked_at,
    status = EXCLUDED.status
  RETURNING parent_id, student_id
),
trial_events AS (
  INSERT INTO "transaction" (
    user_id, payment_gateway, transaction_type, amount, note, created_at,
    order_code, sub_code, status, updated_at
  )
  SELECT v.user_id, 'DEMO', 'Trial access', 0.00, v.note, v.created_at,
    v.order_code, NULL, 'TRIAL', v.created_at
  FROM user_pick u
  CROSS JOIN LATERAL (
    VALUES
      (u.teacher_id, 'Admin demo trial event - teacher onboarding', 'ADMIN-DEMO-TRIAL-20260605-TEACHER', '2026-06-05 09:40:00'::timestamp),
      (u.dang_triet_id, 'Admin demo trial event - student joined class', 'ADMIN-DEMO-TRIAL-20260606-STUDENT-1', '2026-06-06 10:45:00'::timestamp),
      (u.mai_anh_id, 'Admin demo trial event - student joined class', 'ADMIN-DEMO-TRIAL-20260607-STUDENT-2', '2026-06-07 15:00:00'::timestamp),
      (u.ngoc_khanh_id, 'Admin demo trial event - student joined class', 'ADMIN-DEMO-TRIAL-20260608-STUDENT-3', '2026-06-08 09:05:00'::timestamp),
      (u.parent_id, 'Admin demo trial event - parent linked students', 'ADMIN-DEMO-TRIAL-20260609-PARENT', '2026-06-09 18:00:00'::timestamp)
  ) AS v(user_id, note, order_code, created_at)
  WHERE v.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "transaction" t WHERE t.order_code = v.order_code
    )
  RETURNING transaction_id
),
ai_events AS (
  INSERT INTO "ai_audit_log" (
    log_id, user_id, feature, created_at, interaction_data, total_tokens, cost, rating, request_id
  )
  SELECT v.log_id, u.teacher_id, v.feature, v.created_at, v.interaction_data,
    v.total_tokens, v.cost, v.rating, v.request_id
  FROM user_pick u
  CROSS JOIN (
    VALUES
      ('ad000001-0000-0000-0000-000000000001', 'AI_LESSON_GENERATION', '2026-06-05 10:30:00'::timestamp, '{"topic":"Fractions introduction"}', 1850, 0.018500, 5, 'admin-demo-ai-20260605-lesson'),
      ('ad000002-0000-0000-0000-000000000002', 'AI_QUIZ_GENERATION', '2026-06-06 13:10:00'::timestamp, '{"topic":"Decimals checkpoint"}', 1420, 0.014200, 4, 'admin-demo-ai-20260606-quiz'),
      ('ad000003-0000-0000-0000-000000000003', 'AI_EXAM_MATRIX_GENERATION', '2026-06-08 16:25:00'::timestamp, '{"topic":"Geometry matrix"}', 2600, 0.026000, 5, 'admin-demo-ai-20260608-exam'),
      ('ad000004-0000-0000-0000-000000000004', 'AI_LESSON_GENERATION', '2026-06-10 09:50:00'::timestamp, '{"topic":"Reading comprehension"}', 1980, 0.019800, 5, 'admin-demo-ai-20260610-lesson'),
      ('ad000005-0000-0000-0000-000000000005', 'AI_QUIZ_GENERATION', '2026-06-11 10:15:00'::timestamp, '{"topic":"Science warmup"}', 1550, 0.015500, 4, 'admin-demo-ai-20260611-quiz')
  ) AS v(log_id, feature, created_at, interaction_data, total_tokens, cost, rating, request_id)
  WHERE u.teacher_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "ai_audit_log" a WHERE a.log_id = v.log_id
    )
  RETURNING log_id
),
classroom_activity AS (
  INSERT INTO "audit_log" (
    log_id, user_id, role, table_name, record_id, feature, action, old_value, new_value, client_ip, user_agent
  )
  SELECT v.log_id, u.teacher_id, 'TEACHER', 'classroom', v.class_id,
    'ADMIN_DASHBOARD_DEMO', v.action, NULL, v.new_value, '127.0.0.1', 'Admin demo seed'
  FROM user_pick u
  CROSS JOIN class_pick c
  CROSS JOIN LATERAL (
    VALUES
      ('ad100001-0000-0000-0000-000000000001', c.math_class_id, 'CREATE_CLASS', 'Admin Demo Math 6A created'),
      ('ad100002-0000-0000-0000-000000000002', c.math_class_id, 'ADD_STUDENT', 'Đăng Triết joined Math 6A'),
      ('ad100003-0000-0000-0000-000000000003', c.math_class_id, 'ADD_STUDENT', 'Mai Anh joined Math 6A'),
      ('ad100004-0000-0000-0000-000000000004', c.english_class_id, 'CREATE_CLASS', 'Admin Demo English Lab created'),
      ('ad100005-0000-0000-0000-000000000005', c.english_class_id, 'ADD_STUDENT', 'Đăng Triết joined English Lab'),
      ('ad100006-0000-0000-0000-000000000006', c.english_class_id, 'ADD_STUDENT', 'Mai Anh joined English Lab'),
      ('ad100007-0000-0000-0000-000000000007', c.science_class_id, 'CREATE_CLASS', 'Admin Demo Science Club created'),
      ('ad100008-0000-0000-0000-000000000008', c.science_class_id, 'ADD_STUDENT', 'Ngọc Khanh joined Science Club')
  ) AS v(log_id, class_id, action, new_value)
  WHERE v.class_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "audit_log" a WHERE a.log_id = v.log_id
    )
  RETURNING log_id
)
SELECT
  'Admin dashboard demo seed completed' AS message,
  (SELECT COUNT(*) FROM "USER" WHERE email IN (
    'minhngoc@gmail.com',
    'dangtriet@gmail.com',
    'maianh@gmail.com',
    'ngockhanh@gmail.com',
    'hoanguyen@gmail.com'
  )) AS demo_users,
  (SELECT COUNT(*) FROM "classroom" WHERE class_name LIKE 'Admin Demo%') AS demo_classrooms,
  (SELECT COUNT(*) FROM "transaction" WHERE order_code LIKE 'ADMIN-DEMO-TRIAL-%') AS trial_events,
  (SELECT COUNT(*) FROM "ai_audit_log" WHERE request_id LIKE 'admin-demo-ai-%') AS ai_events;
