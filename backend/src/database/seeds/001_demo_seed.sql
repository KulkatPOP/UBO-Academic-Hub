INSERT INTO users_reference (external_id, name, role, username, password_demo) VALUES
  ('student-demo-001', 'Sofía Martínez', 'STUDENT', 'msofia', '123456'),
  ('teacher-demo-001', 'Carlos Pérez', 'TEACHER', 'pcarlos', '123456'),
  ('admin-demo-001', 'Administrador UBO', 'ADMIN', 'admin', 'admin123')
ON CONFLICT (external_id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  username = EXCLUDED.username,
  password_demo = EXCLUDED.password_demo;

WITH teacher AS (
  SELECT id FROM users_reference WHERE external_id = 'teacher-demo-001' AND role = 'TEACHER'
)
INSERT INTO lms_courses (external_course_id, name, code, teacher_reference, description)
SELECT course.external_course_id, course.name, course.code, teacher.id, course.description
FROM teacher
CROSS JOIN (VALUES
  ('course-db-2026-1', 'Bases de Datos', 'INF-302', 'Curso DEMO del LMS complementario para modelamiento y consultas.'),
  ('course-algebra-2026-1', 'Álgebra', 'MAT-101', 'Curso DEMO del LMS complementario para funciones, límites y derivadas.'),
  ('course-programming-2026-1', 'Programación', 'INF-101', 'Curso DEMO del LMS complementario para fundamentos de programación.')
) AS course(external_course_id, name, code, description)
ON CONFLICT (external_course_id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  teacher_reference = EXCLUDED.teacher_reference,
  description = EXCLUDED.description;

INSERT INTO lms_course_members (course_id, student_reference)
SELECT course.id, student.id
FROM lms_courses course
INNER JOIN users_reference student ON student.external_id = 'student-demo-001' AND student.role = 'STUDENT'
WHERE course.external_course_id IN ('course-db-2026-1', 'course-algebra-2026-1', 'course-programming-2026-1')
ON CONFLICT (course_id, student_reference) DO NOTHING;

WITH inserted_materials AS (
  INSERT INTO learning_materials (course_reference, title, content, topic, keywords) VALUES
    ('database', 'Modelo relacional', 'El modelo relacional organiza información en tablas relacionadas mediante atributos y claves.', 'Modelo relacional', ARRAY['modelo relacional', 'tablas', 'relaciones']),
    ('database', 'Clave primaria', 'Una clave primaria identifica de forma única cada registro de una tabla.', 'Clave primaria', ARRAY['clave primaria', 'identificador', 'registro']),
    ('database', 'Normalización', 'La normalización reduce redundancia y dependencias innecesarias en una base de datos.', 'Normalización', ARRAY['normalización', '3FN', 'dependencias']),
    ('algebra', 'Funciones', 'Una función asigna a cada entrada permitida un único valor de salida.', 'Funciones', ARRAY['funciones', 'dominio', 'rango']),
    ('algebra', 'Límites', 'Un límite describe el valor al que se aproxima una función cerca de un punto.', 'Límites', ARRAY['límites', 'aproximación']),
    ('programming', 'Variables', 'Una variable representa un valor que puede cambiar durante la ejecución de un programa.', 'Variables', ARRAY['variables', 'tipo de dato']),
    ('programming', 'Funciones de programación', 'Una función agrupa instrucciones reutilizables y puede recibir parámetros.', 'Funciones', ARRAY['funciones', 'parámetros', 'retorno'])
  ON CONFLICT (course_reference, title) DO UPDATE SET
    content = EXCLUDED.content,
    topic = EXCLUDED.topic,
    keywords = EXCLUDED.keywords
  RETURNING id, title, content, topic, keywords
)
INSERT INTO knowledge_base (material_id, title, content, topic, keywords)
SELECT id, title, content, topic, keywords FROM inserted_materials
ON CONFLICT (material_id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  topic = EXCLUDED.topic,
  keywords = EXCLUDED.keywords;

UPDATE learning_materials AS material
SET lms_course_id = course.id
FROM lms_courses AS course
WHERE (material.course_reference = 'database' AND course.external_course_id = 'course-db-2026-1')
   OR (material.course_reference = 'algebra' AND course.external_course_id = 'course-algebra-2026-1')
   OR (material.course_reference = 'programming' AND course.external_course_id = 'course-programming-2026-1');

-- Evidencia exclusivamente DEMO: `db` aparece como subjectId del frontend y
-- `database` como course_reference de material/RAG; ambas referencias están
-- unidas explícitamente al curso LMS Bases de Datos en esta misma semilla.
-- `course-db-2026-1` es una referencia externa preparada, no un ID oficial UBO.
INSERT INTO course_identity_mapping (lms_course_id, legacy_course_id, external_course_id, source, confidence)
SELECT id, 'db', external_course_id, 'DEMO', NULL
FROM lms_courses
WHERE external_course_id = 'course-db-2026-1'
ON CONFLICT (legacy_course_id) WHERE legacy_course_id IS NOT NULL DO UPDATE SET
  lms_course_id = EXCLUDED.lms_course_id,
  external_course_id = EXCLUDED.external_course_id,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  updated_at = NOW();

INSERT INTO course_identity_mapping (lms_course_id, legacy_course_id, external_course_id, source, confidence)
SELECT id, 'database', NULL, 'DEMO', NULL
FROM lms_courses
WHERE external_course_id = 'course-db-2026-1'
ON CONFLICT (legacy_course_id) WHERE legacy_course_id IS NOT NULL DO UPDATE SET
  lms_course_id = EXCLUDED.lms_course_id,
  external_course_id = EXCLUDED.external_course_id,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  updated_at = NOW();
