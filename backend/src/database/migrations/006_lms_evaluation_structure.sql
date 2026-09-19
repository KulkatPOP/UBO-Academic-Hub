-- Evaluaciones y entregas exclusivas del LMS complementario Academic Hub.
-- Ningún score de esta estructura representa una nota oficial UBO.

ALTER TABLE lms_evaluations
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS teacher_reference UUID REFERENCES users_reference(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
  ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS evaluation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES lms_evaluations(id) ON DELETE CASCADE,
  question_reference TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER')),
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB,
  points NUMERIC(6,2) NOT NULL DEFAULT 1 CHECK (points > 0),
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lms_submissions
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'AUTO_GRADED', 'GRADED')),
  ADD COLUMN IF NOT EXISTS score NUMERIC(3,1) CHECK (score IS NULL OR (score >= 1 AND score <= 7)),
  ADD COLUMN IF NOT EXISTS auto_grade JSONB,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS lms_evaluations_course_teacher_idx ON lms_evaluations(course_id, teacher_reference, status);
CREATE INDEX IF NOT EXISTS evaluation_questions_evaluation_idx ON evaluation_questions(evaluation_id, created_at);
CREATE INDEX IF NOT EXISTS lms_submissions_evaluation_status_idx ON lms_submissions(evaluation_id, status);

COMMENT ON COLUMN lms_submissions.score IS
  'Resultado de evaluación LMS en escala 1,0 a 7,0; no es una nota oficial UBO.';
