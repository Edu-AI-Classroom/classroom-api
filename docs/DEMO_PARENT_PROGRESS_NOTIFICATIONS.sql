-- Demo seed for Parent Progress Dashboard + Notification Center.
-- Assumes these accounts already exist:
-- teacher.demo@test.local / student.demo@test.local / parent.demo@test.local
-- Safe to run more than once for notifications/documents with the same titles.

WITH demo_users AS (
  SELECT
    (SELECT user_id FROM "USER" WHERE email = 'teacher.demo@test.local') AS teacher_id,
    (SELECT user_id FROM "USER" WHERE email = 'student.demo@test.local') AS student_id,
    (SELECT user_id FROM "USER" WHERE email = 'parent.demo@test.local') AS parent_id
),
demo_subject AS (
  INSERT INTO "subject" ("subject_name")
  SELECT 'Mathematics'
  WHERE NOT EXISTS (SELECT 1 FROM "subject" WHERE "subject_name" = 'Mathematics')
  RETURNING subject_id
),
subject_pick AS (
  SELECT COALESCE(
    (SELECT subject_id FROM demo_subject LIMIT 1),
    (SELECT subject_id FROM "subject" WHERE "subject_name" = 'Mathematics' LIMIT 1),
    (SELECT subject_id FROM "subject" ORDER BY subject_id LIMIT 1)
  ) AS subject_id
),
class_pick AS (
  SELECT class_id
  FROM "classroom"
  WHERE class_name = 'Class Parent Chat Test'
  LIMIT 1
),
owner_pick AS (
  SELECT tc.teacher_id
  FROM "teacher_classroom" tc
  JOIN class_pick c ON c.class_id = tc.class_id
  WHERE tc.is_owner = true
  LIMIT 1
),
docs AS (
  INSERT INTO "document" (
    id, title, type, status, grade_level, subject_id, owner_id, class_id, published_at, created_at
  )
  SELECT
    v.id,
    v.title,
    v.type,
    v.status,
    v.grade_level,
    subject_pick.subject_id,
    demo_users.teacher_id,
    class_pick.class_id,
    NOW(),
    NOW()
  FROM (
    VALUES
      ('11111111-1111-1111-1111-111111111111', 'Fractions Practice', 'ASSIGNMENT'::"DocumentType", 'PUBLISHED'::"DocumentStatus", 6),
      ('22222222-2222-2222-2222-222222222222', 'Geometry Checkpoint', 'EXAM'::"DocumentType", 'PUBLISHED'::"DocumentStatus", 6),
      ('33333333-3333-3333-3333-333333333333', 'Word Problems Review', 'ASSIGNMENT'::"DocumentType", 'PUBLISHED'::"DocumentStatus", 6)
  ) AS v(id, title, type, status, grade_level)
  CROSS JOIN demo_users
  CROSS JOIN subject_pick
  CROSS JOIN class_pick
  WHERE demo_users.teacher_id IS NOT NULL
    AND class_pick.class_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "document" d WHERE d.id = v.id)
  RETURNING id
),
assessment_rows AS (
  INSERT INTO "assessment" (doc_id, class_id, start_date, due_date, total_done, status, assigned_by)
  SELECT d.id, c.class_id, NOW() - INTERVAL '14 days', NOW() + INTERVAL '14 days', 1, 'PUBLISHED', u.teacher_id
  FROM "document" d
  CROSS JOIN class_pick c
  CROSS JOIN demo_users u
  WHERE d.id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  )
    AND NOT EXISTS (SELECT 1 FROM "assessment" a WHERE a.doc_id = d.id AND a.class_id = c.class_id)
  RETURNING assessment_id, doc_id
),
assessment_pick AS (
  SELECT assessment_id, doc_id FROM assessment_rows
  UNION
  SELECT assessment_id, doc_id
  FROM "assessment"
  WHERE doc_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
  )
),
blocks AS (
  INSERT INTO "document_block" (
    id, document_id, block_type, semantic_role, position_order, content, created_at
  )
  SELECT
    v.id,
    v.document_id,
    'QUESTION'::"BlockType",
    'MCQ'::"SemanticRole",
    v.position_order,
    v.content,
    NOW()
  FROM (
    VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 1.0, '{"question":"1/2 + 1/4 = ?","options":["2/6","3/4","1/8","1"]}'::jsonb),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 1.0, '{"question":"A triangle has how many sides?","options":["2","3","4","5"]}'::jsonb),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 1.0, '{"question":"There are 12 apples split equally into 3 baskets. How many per basket?","options":["3","4","6","9"]}'::jsonb)
  ) AS v(id, document_id, position_order, content)
  WHERE NOT EXISTS (SELECT 1 FROM "document_block" b WHERE b.id = v.id)
  RETURNING id
),
answer_keys AS (
  INSERT INTO "answer_key" (id, block_id, answer_type, correct_answer, score)
  SELECT * FROM (
    VALUES
      ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MCQ', '{"index":1}'::jsonb, 10.00),
      ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'MCQ', '{"index":1}'::jsonb, 10.00),
      ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'MCQ', '{"index":1}'::jsonb, 10.00)
  ) AS v(id, block_id, answer_type, correct_answer, score)
  WHERE NOT EXISTS (SELECT 1 FROM "answer_key" ak WHERE ak.block_id = v.block_id)
  RETURNING id
),
submissions AS (
  INSERT INTO "student_submission" (
    assessment_id, student_id, total_score, status, feedback, started_at, submitted_at
  )
  SELECT
    a.assessment_id,
    u.student_id,
    CASE a.doc_id
      WHEN '11111111-1111-1111-1111-111111111111' THEN 8.50
      WHEN '22222222-2222-2222-2222-222222222222' THEN 6.00
      WHEN '33333333-3333-3333-3333-333333333333' THEN 9.00
      ELSE 0
    END,
    'SUBMITTED',
    'Demo score for parent progress dashboard',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '2 days'
  FROM assessment_pick a
  CROSS JOIN demo_users u
  WHERE u.student_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "student_submission" s
      WHERE s.assessment_id = a.assessment_id AND s.student_id = u.student_id
  )
  RETURNING attempt_id
),
student_conversation_insert AS (
  INSERT INTO "conversation" (
    conversation_type, class_id, student_id, teacher_id, created_at, updated_at, last_message_at
  )
  SELECT
    'STUDENT_TEACHER',
    c.class_id,
    u.student_id,
    COALESCE(o.teacher_id, u.teacher_id),
    NOW() - INTERVAL '45 minutes',
    NOW() - INTERVAL '20 minutes',
    NOW() - INTERVAL '20 minutes'
  FROM demo_users u
  CROSS JOIN class_pick c
  LEFT JOIN owner_pick o ON true
  WHERE u.student_id IS NOT NULL
    AND COALESCE(o.teacher_id, u.teacher_id) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM "class_student" cs
      WHERE cs.class_id = c.class_id AND cs.student_id = u.student_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM "conversation" existing
      WHERE existing.conversation_type = 'STUDENT_TEACHER'
        AND existing.class_id = c.class_id
        AND existing.student_id = u.student_id
        AND existing.teacher_id = COALESCE(o.teacher_id, u.teacher_id)
        AND existing.parent_id IS NULL
    )
  RETURNING conversation_id
),
student_conversation_pick AS (
  SELECT conversation_id FROM student_conversation_insert
  UNION
  SELECT existing.conversation_id
  FROM "conversation" existing
  CROSS JOIN demo_users u
  CROSS JOIN class_pick c
  LEFT JOIN owner_pick o ON true
  WHERE existing.conversation_type = 'STUDENT_TEACHER'
    AND existing.class_id = c.class_id
    AND existing.student_id = u.student_id
    AND existing.teacher_id = COALESCE(o.teacher_id, u.teacher_id)
    AND existing.parent_id IS NULL
),
student_teacher_messages AS (
  INSERT INTO "message" (conversation_id, sender_id, body, created_at)
  SELECT
    cp.conversation_id,
    CASE v.sender_role WHEN 'STUDENT' THEN u.student_id ELSE COALESCE(o.teacher_id, u.teacher_id) END,
    v.body,
    v.created_at
  FROM student_conversation_pick cp
  CROSS JOIN demo_users u
  LEFT JOIN owner_pick o ON true
  CROSS JOIN (
    VALUES
      ('STUDENT', 'Hi teacher, I am not sure why my geometry checkpoint score is low.', NOW() - INTERVAL '40 minutes'),
      ('TEACHER', 'Thanks for asking. Review question 2 about triangle sides, then try the practice again.', NOW() - INTERVAL '30 minutes'),
      ('STUDENT', 'Got it, I will review it before the next assignment.', NOW() - INTERVAL '20 minutes')
  ) AS v(sender_role, body, created_at)
  WHERE CASE v.sender_role WHEN 'STUDENT' THEN u.student_id ELSE COALESCE(o.teacher_id, u.teacher_id) END IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "message" m
      WHERE m.conversation_id = cp.conversation_id
        AND m.body = v.body
    )
  RETURNING conversation_id, created_at
),
student_conversation_touch AS (
  UPDATE "conversation" c
  SET
    last_message_at = latest.latest_at,
    updated_at = latest.latest_at
  FROM (
    SELECT conversation_id, MAX(created_at) AS latest_at
    FROM "message"
    WHERE conversation_id IN (SELECT conversation_id FROM student_conversation_pick)
    GROUP BY conversation_id
  ) latest
  WHERE c.conversation_id = latest.conversation_id
  RETURNING c.conversation_id
)
INSERT INTO "notification" (user_id, title, body, type, link_url, metadata, created_at)
SELECT * FROM (
  SELECT parent_id AS user_id, 'New grade posted', 'Student Demo received new scores in Mathematics.', 'GRADE_POSTED', '/parent', '{"student":"Student Demo","class":"Class Parent Chat Test"}'::jsonb, NOW() - INTERVAL '30 minutes' FROM demo_users
  UNION ALL
  SELECT parent_id, 'Teacher replied', 'Teacher Demo replied to your classroom conversation.', 'CHAT_MESSAGE', '/parent', '{"conversation":"parent-teacher"}'::jsonb, NOW() - INTERVAL '10 minutes' FROM demo_users
  UNION ALL
  SELECT parent_id, 'Weekly progress summary', 'Completion is on track. Review the progress dashboard for details.', 'WEEKLY_SUMMARY', '/parent', '{"completionRate":100}'::jsonb, NOW() - INTERVAL '1 day' FROM demo_users
  UNION ALL
  SELECT teacher_id, 'Parent sent a message', 'Parent Demo sent a message about Student Demo.', 'CHAT_MESSAGE', '/dashboard', '{"parent":"Parent Demo"}'::jsonb, NOW() - INTERVAL '15 minutes' FROM demo_users
  UNION ALL
  SELECT student_id, 'Parent linked successfully', 'Parent Demo can now view your class progress.', 'PARENT_LINKED', '/student', '{"parent":"Parent Demo"}'::jsonb, NOW() - INTERVAL '2 hours' FROM demo_users
  UNION ALL
  SELECT student_id, 'Teacher replied to your question', 'Teacher Demo replied in your private class conversation.', 'CHAT_MESSAGE', '/student/classroom', '{"conversation":"student-teacher","class":"Class Parent Chat Test"}'::jsonb, NOW() - INTERVAL '25 minutes' FROM demo_users
  UNION ALL
  SELECT teacher_id, 'Student asked a question', 'Student Demo started a private classroom conversation.', 'CHAT_MESSAGE', '/classroom', '{"student":"Student Demo","class":"Class Parent Chat Test"}'::jsonb, NOW() - INTERVAL '40 minutes' FROM demo_users
  UNION ALL
  SELECT student_id, 'New score available', 'Your latest Mathematics scores are ready to review.', 'GRADE_POSTED', '/student', '{"class":"Class Parent Chat Test"}'::jsonb, NOW() - INTERVAL '50 minutes' FROM demo_users
) AS n(user_id, title, body, type, link_url, metadata, created_at)
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "notification" existing
    WHERE existing.user_id = n.user_id AND existing.title = n.title
  );
