# Avisos demo del curso para Profesor

Carlos Pérez puede crear, editar y eliminar avisos demo en sus propios cursos. Cada aviso contiene identificador, curso, profesor, título, contenido y fechas ISO de creación/edición. La fuente es local y reversible: `uboDemoTeacherAnnouncements`.

El servicio valida rol `TEACHER`, propiedad del curso, texto obligatorio y límites de 120 caracteres para título y 2.000 para contenido. Los avisos se ordenan por publicación más reciente, se aíslan por curso/profesor y los datos corruptos solo restablecen su propia clave local.

No se crean avisos institucionales ni se muestran aún en Student; tampoco hay backend, notificaciones, archivos ni integración Core. La PWA v120 precachea el módulo. El rollback consiste en retirar el servicio, la sección, el test, la documentación y su referencia de precache sin tocar Material, Notas, Asistencia, Student o Admin.
