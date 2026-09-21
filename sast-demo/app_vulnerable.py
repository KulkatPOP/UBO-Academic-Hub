import os
import subprocess
import ast


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

    # CORRECCIÓN:
    # Se evita construir un comando como texto y no se utiliza shell=True.
    subprocess.run(
        ["cmd", "/c", "dir", nombre_archivo],
        shell=False,
        check=False
    )


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