-- Campos derivados para recomendaciones del LMS complementario.
-- No almacenan notas, asistencia, matrícula oficial ni decisiones académicas.

ALTER TABLE recommendations
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES lms_courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS resource_reference UUID REFERENCES learning_materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS recommendations_student_course_created_idx
  ON recommendations(student_reference, course_id, created_at DESC);

-- Una recomendación derivada por recurso se refresca por UPSERT sin duplicar
-- snapshots; los registros históricos JSONB previos no se ven afectados.
CREATE UNIQUE INDEX IF NOT EXISTS recommendations_student_course_resource_unique
  ON recommendations(student_reference, course_id, type, resource_reference)
  WHERE course_id IS NOT NULL AND resource_reference IS NOT NULL;

COMMENT ON TABLE recommendations IS
  'Recomendaciones derivadas del LMS complementario. No constituyen registros académicos oficiales.';
