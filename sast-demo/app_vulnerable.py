import os
import ast
from pathlib import Path

# ==========================================================
# DEMOSTRACIÓN SAST - UBO Academic Hub
# Versión corregida después del análisis con Semgrep.
# ==========================================================

# La contraseña ya no queda escrita directamente en el código.
# Se obtiene desde una variable de entorno.
ADMIN_PASSWORD = os.getenv("UBO_ADMIN_PASSWORD")

def login(usuario, password):
    if usuario == "admin" and password == ADMIN_PASSWORD:
        return "Acceso autorizado"

    return "Acceso denegado"

def buscar_archivo(nombre_archivo):
    """Busca un archivo local sin delegar argumentos a un intérprete de comandos."""
    nombre = str(nombre_archivo).strip()
    ruta = Path(nombre)

    # La demo acepta solamente un nombre de archivo dentro del directorio
    # actual; no permite rutas absolutas ni recorridos de directorio.
    if not nombre or ruta.name != nombre:
        print("Nombre de archivo no válido.")
        return None

    archivo = Path.cwd() / ruta
    if archivo.is_file():
        print(f"Archivo encontrado: {archivo.name}")
        return None

    print("Archivo no encontrado.")
    return None

def ejecutar_codigo():

    valor = input("Ingrese un valor Python simple: ")

    # CORRECCIÓN:
    # ast.literal_eval permite interpretar únicamente
    # estructuras y valores literales seguros.
    try:
        resultado = ast.literal_eval(valor)
        print("Resultado:", resultado)
    except (ValueError, SyntaxError):
        print("Entrada no válida.")

usuario = input("Usuario: ")
password = input("Contraseña: ")

print(login(usuario, password))

archivo = input("Archivo a buscar: ")
buscar_archivo(archivo)

ejecutar_codigo()
