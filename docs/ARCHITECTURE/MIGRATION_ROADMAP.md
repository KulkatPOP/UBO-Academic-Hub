# Roadmap: LMS inteligente complementario

## Fase 1 — Finalizar LMS demo

Consolidar flujos demo, contratos de servicio, seguridad de renderizado y pruebas. No conectar aún información real.

## Fase 2 — Backend inteligente

Crear BFF/API de Hub, observabilidad, límites de dominio e interfaces para conectores externos. No reemplazar ERP.

## Fase 3 — Base propia de servicios LMS

Crear PostgreSQL para conversaciones Tutor, conocimiento, recomendaciones, contenidos LMS, configuraciones y analítica derivada. Usar semillas no personales.

## Fase 4 — Conectores institucionales

Implementar contratos de lectura autorizada para perfil, cursos y señales de rendimiento. Ejecutar modo sombra y reconciliación, sin copiar el expediente completo.

## Fase 5 — Autenticación federada

Integrar identidad institucional o SSO con sesiones seguras, consentimiento y autorización de servidor. Mantener compatibilidad de demo hasta completar el rollout.

## Fase 6 — IA avanzada con RAG real

Migrar conocimiento a almacenamiento propio, recuperación controlada, evaluación de calidad, trazabilidad de fuentes y políticas de privacidad. Las recomendaciones permanecen explicables.

## Fase 7 — Retiro gradual de demo

Desactivar cada clave de `localStorage` sólo después de: migración validada, feature flag habilitado, métricas estables, plan de rollback probado y aprobación de propietario del dominio. No borrar datos demo ni servicios hasta concluir ese ciclo. No se retiran ni reemplazan sistemas institucionales.

## Gates de seguridad para cada fase

- Contrato y pruebas de compatibilidad aprobados.
- Autorización de servidor y pruebas negativas por rol aprobadas.
- Migración reversible y backup comprobados.
- Sin cambios a flags de Core sin una fase propia aprobada.
- Monitoreo, manejo de errores y documentación actualizados.
