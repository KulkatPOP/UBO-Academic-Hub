# Visión de arquitectura: capa inteligente complementaria

UBO Academic Hub **no reemplaza** el sistema académico institucional, ERP ni registro oficial de la universidad. Es una plataforma LMS inteligente complementaria: consume datos académicos autorizados mediante futuras integraciones y añade experiencias de aprendizaje, acompañamiento y contenido propios.

## Arquitectura actual

```text
PWA frontend UBO Academic Hub
          │
          └── Datos demo locales / localStorage
```

## Arquitectura objetivo

```text
Sistema académico institucional UBO
             │
     API / integración autorizada
             │
      UBO Academic Hub Backend
             │
 ┌───────────┼────────────┐
 Tutor IA   Analítica   Recomendaciones
     │          │             │
       LMS y RAG académico propio
```

Los sistemas institucionales continúan siendo la autoridad para identidad académica, matrícula, cursos oficiales, notas oficiales y asistencia oficial. Hub usa esas señales únicamente para personalizar sus servicios inteligentes, sin asumir su administración.

## Ventaja estratégica

Separar la capa de integración de los servicios inteligentes permite que Hub se conecte a la plataforma académica UBO actual o a otro sistema universitario compatible. El LMS, el Tutor, el RAG y la analítica no quedan acoplados a un proveedor de ERP específico.

```text
Sistema UBO actual ─┐
                    ├── API de integración ── UBO Academic Hub
Otro sistema futuro ─┘
```

La portabilidad depende de contratos de integración estables, consentimiento, controles de acceso y minimización de datos, no de copiar la base institucional.
