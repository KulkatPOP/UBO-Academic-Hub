# Informe de Herramientas SAST

## 1. Introducción

El análisis estático de seguridad de aplicaciones (SAST, Static Application Security Testing) corresponde a un conjunto de técnicas utilizadas para analizar el código fuente de una aplicación sin necesidad de ejecutarla.

Su objetivo principal es identificar vulnerabilidades de seguridad, errores de programación y malas prácticas durante las primeras etapas del desarrollo de software.

La implementación de herramientas SAST permite integrar seguridad dentro del ciclo DevSecOps, reduciendo riesgos y costos asociados a la corrección de vulnerabilidades encontradas en etapas posteriores.

## 2. Objetivo del informe

El objetivo de este informe es investigar y analizar tres herramientas utilizadas dentro del proceso SAST, evaluando su funcionamiento, ventajas, limitaciones, modalidades de implementación y costos asociados.

Las herramientas seleccionadas son:

- SonarCloud.
- Semgrep.
- Snyk Code.

## 3. Proyecto utilizado para las pruebas

Proyecto analizado:

Nombre:
[UBO-Academic-Hub]

Repositorio:
[(https://github.com/KulkatPOP/UBO-Academic-Hub/tree/main)]

Tecnologías utilizadas:

- HTML5: utilizado para la estructura y creación de las interfaces de usuario.
- CSS3: utilizado para el diseño visual, estilos, distribución y adaptación de componentes.
- JavaScript (ES6): utilizado para la lógica de la aplicación, navegación entre vistas, interacción con elementos y manejo de datos.
- LocalStorage: utilizado para almacenar información local del usuario y mantener datos dentro del navegador.

Frameworks y herramientas utilizadas:

- No se utilizaron frameworks frontend externos.
- Visual Studio Code como entorno de desarrollo.
- Git y GitHub para control de versiones y gestión del repositorio.
- SonarQube como herramienta de análisis estático de seguridad (SAST).

Fecha de análisis:
[04/09/2026]

## Demo realizada

Para realizar la demostración práctica se utilizó el repositorio UBO-Academic-Hub conectado con SonarCloud mediante GitHub.

El análisis permitió identificar problemas de seguridad, confiabilidad y calidad del código.

Resultados principales:

- 1 problema de seguridad con severidad alta.
- 6 problemas relacionados con confiabilidad del código.
- 0 problemas de mantenibilidad.
- 0% de duplicación de código.

Las evidencias visuales del análisis se almacenarán en:

docs/SAST/evidencias/
