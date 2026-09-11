# Operación del canario Core Session — Teacher

## Objetivo, alcance y autoridad

Este procedimiento prepara una futura activación controlada del canario Teacher para Carlos Pérez (`teacher-carlos-perez`, `TEACHER`). No activa nada en esta fase. La aprobación conceptual exige tres roles, sin personas reales: Responsable técnico, Responsable del proyecto y Responsable de pruebas.

El alcance futuro es únicamente Teacher. Student, Admin, Career, Room, autorización Core, datos, credenciales, UI, rutas y PWA quedan fuera. `USE_CORE_SESSION` debe seguir en `false` hasta que las tres aprobaciones sean explícitas.

## Precondiciones y baseline

Antes de toda activación futura se debe comprobar: Core disponible con checkpoint conocido; UBO compatible con el checkpoint aprobado; tests UBO/Core y `node --check` correctos; PWA/precache sano; Student/Teacher/Admin sin regresiones; adapter, shadow, coexistencia y diseño canario correctos; Career/Room OFF; rollback documentado; y ausencia de cambios no autorizados.

El baseline registra solo información no sensible: identidad y rol Teacher esperados, estado de sesión esperado, estado Student/Admin, versión PWA y checkpoints UBO/Core. Nunca registra contraseñas, tokens, secretos, credenciales ni contenido académico personal.

## Activación futura y monitoreo

La activación futura sería manual, después de que UBO resolviera Teacher, mediante `USE_CORE_SESSION=true`. No se crea todavía un perfil de configuración adicional. Core no procesa credenciales ni toma login.

Durante una ejecución aprobada se observarían: identidad y rol, creación/lectura/limpieza de sesión, dashboard y ruta directa Teacher, accesos permitidos/denegados, ausencia de sesión, cambios Teacher ↔ Student/Admin y errores inesperados. La matriz de registro debe contener solo escenario, resultado esperado, resultado observado y estado.

| Escenario | Esperado | Estado inicial |
|---|---|---|
| Login/resolución/sesión Teacher | ID y rol equivalentes | Pendiente de canario aprobado |
| Dashboard/ruta directa Teacher | Guard UBO continúa correcto | Pendiente |
| Logout/post-logout | Ambas fronteras nulas; acceso denegado | Pendiente |
| Cambios de perfil | Espejo Teacher limpio | Pendiente |
| Adapter/SessionPort/identity/role fallidos | Abort manual | Pendiente |
| Stale, corrupción, rol desconocido, ciclos repetidos | Sin acceso ni sesión residual | Pendiente |

## Éxito, abort y severidad

Éxito requiere identidad, rol y sesión equivalentes; logout completo; cero stale session o escalamiento; Teacher operativo; Student/Admin intactos; guards correctos; y adapter/SessionPort deterministas.

| Severidad | Acción |
|---|---|
| CRITICAL — escalamiento, identidad cruzada, acceso indebido, logout residual | Abort inmediato. |
| HIGH — fallo de adapter/SessionPort, navegación incorrecta, acceso válido perdido | Abort salvo aprobación explícita. |
| MEDIUM — warning de compatibilidad o visual no relacionado | Documentar y evaluar. |
| LOW — documentación o warning no funcional | Documentar. |

Se aborta ante cualquier cambio fuera de Teacher, modificación de datos/Core/Career/Room, corrupción, no determinismo, identidad/rol distinto o fallo no controlado.

## Rollback y validación posterior

El rollback es manual y no destructivo:

1. Desactivar el canario.
2. Volver a `USE_CORE_SESSION=false`.
3. Recargar runtime.
4. Confirmar a UBO como autoridad.
5. Validar Teacher, Student y Admin.
6. Ejecutar tests y registrar escenario, resultado, motivo y acción.

Después se valida Student, Teacher, Admin, denegación sin identidad, consistencia de `uboSession`/demo identity y ausencia de snapshot o sesión Core residual. No se eliminan usuarios ni se cambian datos o credenciales.

## Repetibilidad, protección y límites

Cada corrida se registra como `CANARY RUN #n` con datos no sensibles. No hay activación automática, CI que habilite flags, feature flag remoto, deploy ni rollback automático. El Core sigue independiente y la seguridad vigente continúa siendo UBO frontend guards.

La siguiente fase, solo con autorización explícita, debe definir el formato de acta manual de una corrida canario y el mecanismo de diagnóstico no sensible; no debe activar el canario todavía.
