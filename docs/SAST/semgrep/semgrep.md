# Análisis SAST con Semgrep

## 1. Descripción de la herramienta

Semgrep es una herramienta de análisis estático de seguridad (SAST) que permite detectar vulnerabilidades y malas prácticas dentro del código fuente mediante reglas de análisis.

A diferencia de otros analizadores, Semgrep permite crear reglas personalizadas para identificar patrones específicos de riesgo dentro de una aplicación.

---

# 2. Configuración utilizada

Proyecto analizado:

UBO-Academic-Hub

Repositorio:

[(https://github.com/KulkatPOP/UBO-Academic-Hub/tree/main)]


Lenguaje analizado:

JavaScript / HTML / CSS

Sistema operativo:

Windows

Método de instalación:


Instalación mediante Python Package Manager (pip) utilizando la terminal de Visual Studio Code.

Comando ejecutado:

python -m pip install semgrep

Versión de Semgrep:

[1.176.1]

---

# 3. Instalación

Comando utilizado:

```bash
python -m pip install semgrep

Verificación de instalación:

Comando ejecutado:

semgrep --version

Versión obtenida:

1.176.1

# 4. Ejecución del análisis

Para realizar el análisis del proyecto se ejecutó Semgrep desde la terminal de Visual Studio Code, ubicándose en la raíz del repositorio UBO-Academic-Hub.

Comando utilizado:

```bash
semgrep --config auto .

# 5. Resultados obtenidos

El análisis finalizó correctamente.

Resultados del escaneo:

- Hallazgos encontrados: 0
- Reglas ejecutadas: 217
- Archivos analizados: 13
- Código procesado: aproximadamente 100%

Resultado general:

Semgrep no detectó vulnerabilidades ni patrones inseguros dentro del código analizado utilizando las reglas disponibles de Semgrep OSS.

Nivel de severidad:

No aplica, debido a que no se encontraron hallazgos.

Análisis:

El resultado indica que el proyecto no presenta vulnerabilidades conocidas bajo las reglas ejecutadas por Semgrep. Sin embargo, se recomienda complementar este análisis con otras herramientas SAST debido a que cada herramienta posee diferentes reglas y niveles de cobertura.

# 6. Evidencia

Captura del análisis realizado:

![Resultado Semgrep](../evidencias/semgrep.png)

La evidencia corresponde a la ejecución del comando:

```bash
semgrep --config auto .


---


```markdown
# 7. Conclusión

Semgrep permitió realizar un análisis estático del proyecto UBO-Academic-Hub mediante reglas automatizadas de seguridad.

Aunque no se encontraron vulnerabilidades, la herramienta permitió validar que el código analizado no contiene patrones inseguros detectables mediante las reglas utilizadas.

Su integración como herramienta SAST permite incorporar controles de seguridad tempranos dentro del ciclo de desarrollo.