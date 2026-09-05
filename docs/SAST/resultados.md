# 1. Análisis con SonarCloud (SAST)

## Descripción

SonarCloud fue utilizado como herramienta de análisis estático de seguridad (SAST) para evaluar el código fuente del proyecto UBO-Academic-Hub.

La herramienta permitió detectar problemas relacionados con seguridad, confiabilidad, accesibilidad y calidad del código sin necesidad de ejecutar la aplicación.

## Configuración utilizada

Herramienta:

SonarCloud

Proyecto analizado:

UBO-Academic-Hub

Repositorio:

KulkatPOP/UBO-Academic-Hub

Rama analizada:

main

Lenguaje principal:

JavaScript / HTML / CSS

Líneas analizadas:

1.4k líneas de código

Método de integración:

Repositorio GitHub conectado con SonarCloud.

---

# Ejecución del análisis

Proceso realizado:

1. Se vinculó el repositorio GitHub con SonarCloud.
2. Se configuró el proyecto dentro de la plataforma.
3. Se ejecutó el análisis automático del código fuente.
4. Se revisaron los problemas encontrados en el dashboard.

---

# Resultados obtenidos

## Seguridad

Cantidad de problemas encontrados:

1 vulnerabilidad de seguridad.

Clasificación:

- Security Rating: C
- Severidad: Alta (High)

Descripción:

SonarCloud detectó un problema relacionado con una dependencia utilizada en el proyecto.

Recomendación:

Actualizar la dependencia afectada utilizando una versión segura y mantener las librerías actualizadas.

---

## Fiabilidad del código (Reliability)

Cantidad de problemas encontrados:

6 problemas.

Clasificación:

- Reliability Rating: C
- Severidad predominante: Media (Medium)

Problemas detectados:

Los principales hallazgos corresponden a problemas de consistencia y accesibilidad en elementos HTML.

Ejemplos:

- Campos de entrada sin etiquetas válidas.
- Elementos HTML que no cumplen completamente recomendaciones WCAG 2.

Ubicaciones detectadas:

- index.html línea 90.
- index.html línea 91.
- index.html línea 93.
- index.html línea 95.
- index.html línea 109.
- index.html línea 114.

Recomendación:

Agregar etiquetas asociadas correctamente a los elementos de formulario utilizando atributos como:

- label
- for
- aria-label

para mejorar accesibilidad y compatibilidad con lectores de pantalla.

---

## Mantenibilidad

Cantidad de problemas:

0 problemas detectados.

Clasificación:

- Maintainability Rating: A

Resultado:

El código mantiene una estructura adecuada respecto a mantenibilidad según las reglas analizadas por SonarCloud.

---

## Duplicación de código

Resultado:

0% de duplicación detectada.

Esto indica que no existen bloques importantes de código repetidos dentro del proyecto.

---

## Cobertura de pruebas

Resultado:

No disponible.

SonarCloud requiere configuración adicional para analizar cobertura mediante pruebas automatizadas.

---

# Evidencias

Capturas almacenadas:

- evidencias/sonarqube-resumen.png
- evidencias/sonarqube-issues.png