# Asistencia QR institucional UBO — modo demo

## Alcance

La asistencia QR complementa el registro docente demo existente. No reemplaza ni escribe en `uboDemoTeacherAttendance`, no usa backend y no representa una asistencia institucional real.

## Flujo

1. El profesor asignado genera una sesión temporal desde el detalle de un curso.
2. La sesión se guarda localmente en `uboDemoQrAttendanceSessions` con `id`, `courseId`, `teacherId`, fechas de creación y expiración, y estado `active`.
3. La tarjeta docente muestra un código visual demo y el payload JSON limitado a `sessionId` y `courseId`.
4. El estudiante inscrito ingresa el identificador o payload como lectura simulada.
5. El servicio comprueba existencia, vigencia, curso matriculado y ausencia de duplicado.
6. El registro exitoso se guarda únicamente en `uboDemoQrAttendanceRecords` como `PRESENT` y con la fecha actual.

## Validaciones

- Solo el profesor asignado puede iniciar una sesión para su curso.
- Las sesiones expiran después de 15 minutos.
- El estudiante debe estar inscrito en el curso de la sesión.
- Un estudiante solo puede registrar una vez cada sesión.
- Sesiones, registros y retornos se validan y se entregan como copias defensivas.

## Seguridad y limitaciones

- El payload no contiene nombres, contraseñas ni otros datos personales.
- La interfaz usa creación segura de nodos y `textContent`; no inserta datos QR mediante `innerHTML` dinámico.
- La lectura es simulada: el código visual no activa cámara ni envía información a un servidor.
- La información es local y demo; debe sustituirse por autenticación, validación de servidor y un lector QR estándar antes de cualquier uso institucional real.
