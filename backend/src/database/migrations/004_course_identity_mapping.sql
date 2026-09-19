-- Mapa explícito y reversible de identidades de curso para el LMS DEMO.
-- Ninguna fila de esta tabla prueba una equivalencia con sistemas oficiales UBO.

CREATE TABLE IF NOT EXISTS course_identity_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lms_course_id UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  legacy_course_id TEXT,
  external_course_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('DEMO', 'LEGACY', 'INSTITUTIONAL', 'MANUAL')),
  confidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (legacy_course_id IS NOT NULL OR external_course_id IS NOT NULL),
  CHECK (legacy_course_id IS NULL OR length(trim(legacy_course_id)) > 0),
  CHECK (external_course_id IS NULL OR length(trim(external_course_id)) > 0)
);

-- Un alias legacy o una referencia externa sólo puede resolver a un curso LMS.
CREATE UNIQUE INDEX IF NOT EXISTS course_identity_mapping_legacy_unique
  ON course_identity_mapping(legacy_course_id)
  WHERE legacy_course_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS course_identity_mapping_external_unique
  ON course_identity_mapping(external_course_id)
  WHERE external_course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS course_identity_mapping_lms_course_idx
  ON course_identity_mapping(lms_course_id);

-- Evita asociar una referencia externa conocida a un LMS diferente del curso
-- que ya la declara. Los aliases sin referencia externa (por ejemplo RAG)
-- permanecen válidos.
CREATE OR REPLACE FUNCTION validate_course_identity_external_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.external_course_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM lms_courses c
     WHERE c.id = NEW.lms_course_id
       AND c.external_course_id = NEW.external_course_id
  ) THEN
    RAISE EXCEPTION 'external_course_id must belong to lms_course_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS course_identity_mapping_external_reference_check ON course_identity_mapping;
CREATE TRIGGER course_identity_mapping_external_reference_check
BEFORE INSERT OR UPDATE OF lms_course_id, external_course_id ON course_identity_mapping
FOR EACH ROW EXECUTE FUNCTION validate_course_identity_external_reference();

COMMENT ON TABLE course_identity_mapping IS
  'Aliases DEMO/legacy explícitos. No constituyen equivalencias con el sistema académico institucional UBO.';
COMMENT ON COLUMN course_identity_mapping.confidence IS
  'Campo reservado para revisión humana; las semillas DEMO lo mantienen NULL y no expresa certeza institucional.';
