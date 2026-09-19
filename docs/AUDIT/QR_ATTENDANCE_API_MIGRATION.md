# Asistencia QR LMS API

La asistencia registrada mediante este módulo pertenece exclusivamente al LMS Academic Hub y no constituye asistencia académica oficial de la Universidad.

La migración 008 crea sesiones QR con token almacenado únicamente como hash y registros `PRESENT` con restricción única por sesión/estudiante. La identidad siempre viene de `x-user-id`; el payload QR sólo incluye `sessionId` y token. Se valida profesor dueño, matrícula LMS, expiración, cierre y duplicados. `qr-attendance-service.js` y sus fuentes localStorage se conservan como fallback.
