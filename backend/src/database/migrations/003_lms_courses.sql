-- Cursos y membresías propios del LMS DEMO de Academic Hub.
-- No representan cursos ni matrícula oficial de Universidad Bernardo O'Higgins.

CREATE TABLE IF NOT EXISTS lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_course_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  teacher_reference UUID NOT NULL REFERENCES users_reference(id) ON DELETE RESTRICT,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lms_course_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  student_reference UUID NOT NULL REFERENCES users_reference(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, student_reference)
);

-- Conserva course_reference por compatibilidad de RAG y agrega una relación
-- explícita al curso LMS DEMO para las consultas API.
ALTER TABLE learning_materials
  ADD COLUMN IF NOT EXISTS lms_course_id UUID REFERENCES lms_courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS lms_courses_teacher_reference_idx ON lms_courses(teacher_reference);
CREATE INDEX IF NOT EXISTS lms_course_members_student_reference_idx ON lms_course_members(student_reference);
CREATE INDEX IF NOT EXISTS learning_materials_lms_course_idx ON learning_materials(lms_course_id);

COMMENT ON TABLE lms_courses IS
  'Cursos DEMO propios del LMS complementario Academic Hub; external_course_id queda reservado para una futura integración institucional.';
COMMENT ON TABLE lms_course_members IS
  'Referencia de membresía DEMO para Academic Hub. No representa matrícula oficial UBO.';
