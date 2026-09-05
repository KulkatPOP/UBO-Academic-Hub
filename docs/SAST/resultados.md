# Resultados de análisis SAST

## Proyecto analizado

Nombre:

UBO-Academic-Hub

Repositorio:

https://github.com/KulkatPOP/UBO-Academic-Hub


---

# Comparación de herramientas

| Herramienta | Tipo | Método utilizado | Resultado |
|---|---|---|---|
| SonarCloud | SAST Cloud | Integración con GitHub | Detectó 1 problema de seguridad y 6 problemas de fiabilidad |
| Semgrep | SAST Local CLI | Terminal VS Code | 0 hallazgos encontrados |
| Snyk Code | SAST CLI | Análisis local del código | 0 vulnerabilidades detectadas |


---

# Resumen SonarCloud

Resultados:

- Problemas de seguridad: 1
- Problemas de fiabilidad: 6
- Mantenibilidad: A
- Duplicación: 0%

Conclusión:

SonarCloud permitió identificar problemas relacionados con seguridad y calidad del código que deben ser revisados durante el mantenimiento del proyecto.


---

# Resumen Semgrep

Resultados:

- Reglas ejecutadas: 217
- Archivos analizados: 13
- Hallazgos: 0

Conclusión:

Semgrep no encontró patrones inseguros mediante las reglas utilizadas.


---

# Resumen Snyk Code

Resultados:

- Tipo de análisis: Static Code Analysis
- Vulnerabilidades encontradas: 0

Conclusión:

Snyk Code permitió validar el código fuente mediante análisis SAST sin detectar vulnerabilidades conocidas.


---

# Comparación final

Las tres herramientas entregaron resultados complementarios.

SonarCloud permitió identificar problemas de calidad y seguridad mediante una plataforma integrada con GitHub.

Semgrep y Snyk Code permitieron realizar análisis adicionales desde herramientas especializadas de seguridad.

La combinación de herramientas mejora la cobertura del análisis dentro del ciclo DevSecOps.