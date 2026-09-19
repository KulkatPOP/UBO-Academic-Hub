# FAQ — UBO Academic Hub Release 1.0

## 1. ¿Es un LMS real?

Es un LMS local funcional para demostración y continuidad técnica. Sus datos e identidades actuales son DEMO/LMS local; no representa una operación institucional de UBO.

## 2. ¿Está conectado actualmente a UBO?

No. Release 1.0 no se conecta a sistemas, datos, identidad ni fuentes institucionales de UBO.

## 3. ¿Utiliza Machine Learning?

No. Intelligence utiliza reglas deterministas, transparentes y de solo lectura sobre evidencia LMS disponible.

## 4. ¿Cómo funciona la inteligencia?

Deriva señales desde datos LMS autorizados. Si la evidencia es insuficiente, devuelve `INSUFFICIENT_DATA` o `null` en lugar de inventar un resultado.

## 5. ¿Cómo funcionan las recomendaciones?

Una señal verificable puede activar una decisión que apunta a material LMS autorizado. Si no hay señal o recurso autorizado, no genera una recomendación artificial.

## 6. ¿El Tutor inventa información?

No debe hacerlo. Usa conocimiento local autorizado, contexto LMS del curso permitido y reconoce cuando falta evidencia; no utiliza modelos o APIs externas.

## 7. ¿Qué datos utiliza?

Datos DEMO/LMS local: cursos, membresías, materiales, progreso y recursos propios de la plataforma. No usa fuentes oficiales UBO.

## 8. ¿Qué pasa si faltan datos?

La respuesta se mantiene conservadora: `INSUFFICIENT_DATA`, listas vacías o valores `null`, según el contrato del servicio.

## 9. ¿Cómo se separan Student, Teacher y Admin?

Las rutas LMS privadas resuelven identidad, rol y pertenencia desde backend; los parámetros o headers enviados por cliente no son autoridad.

## 10. ¿Cómo se autentican actualmente?

Con identidades DEMO locales. La sesión LMS usa cookie `HttpOnly`, `SameSite=Lax`, expiración y logout revocable. No es SSO institucional.

## 11. ¿Está preparado para SSO?

Está preparado documentalmente para integrar identidad institucional en el futuro, pero SSO/OAuth/SAML no está implementado en Release 1.0.

## 12. ¿Puede UBO incorporar sus propios cursos?

No en esta entrega. Para hacerlo deberá proporcionar las fuentes, contratos, identificadores estables y reglas de sincronización autorizadas.

## 13. ¿Puede utilizar notas reales?

No actualmente. Las notas oficiales requieren fuente institucional autorizada, contrato de datos, permisos, trazabilidad y reglas definidas por UBO.

## 14. ¿Puede utilizar asistencia real?

No actualmente. La asistencia disponible es LMS local/DEMO; la asistencia oficial exige fuente, reglas y autorización institucional.

## 15. ¿Qué necesita UBO para integrarlo?

SSO/IdP, contrato de identidad, identificadores estables, fuentes autorizadas, períodos, cursos, matrícula, notas/asistencia, ambiente QA, reglas de actualización y un responsable técnico.

## 16. ¿Qué queda fuera de Release 1.0?

Integración institucional, datos reales, SSO, sincronización, operación productiva, TLS de producción, observabilidad, alta disponibilidad, backups, CI/CD institucional y gestión corporativa de secretos.

## 17. ¿Qué recibe UBO con esta entrega?

Un LMS local funcional con PWA, backend Express, PostgreSQL local, módulos por rol, inteligencia determinista, recomendaciones, Tutor/RAG local, pruebas, documentación y frontera de integración institucional.
