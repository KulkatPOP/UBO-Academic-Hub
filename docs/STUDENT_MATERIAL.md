# Visualización de material para Student

Student consulta `uboDemoTeacherMaterials`, la fuente local gestionada por Profesor, mediante un servicio exclusivamente de lectura. El material se filtra por cursos inscritos, se ordena por `createdAt` descendente y se presenta en Inicio y en el detalle del ramo.

La UI no muestra controles de edición y utiliza `textContent` para título y descripción, por lo que contenido HTML se presenta literalmente. No hay archivos, URLs falsas, descarga, backend ni integración Core. La PWA v122 incluye el servicio; el rollback retira la vista, servicio, test, documentación y precache sin afectar la gestión docente.
