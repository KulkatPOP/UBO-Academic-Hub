INSERT INTO users_reference (external_id, name, role, username, password_demo) VALUES
  ('student-demo-001', 'Sofía Martínez', 'STUDENT', 'msofia', '123456'),
  ('teacher-demo-001', 'Carlos Pérez', 'TEACHER', 'pcarlos', '123456'),
  ('admin-demo-001', 'Administrador UBO', 'ADMIN', 'admin', 'admin123')
ON CONFLICT (external_id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  username = EXCLUDED.username,
  password_demo = EXCLUDED.password_demo;

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
