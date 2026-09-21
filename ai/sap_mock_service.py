"""
sap_mock_service.py
===================

Capa de servicio para consultar los datos SAP simulados definidos
en mock_sap.py.

NO conecta a MySQL todavía.
La finalidad es probar la integración académica antes de cambiar
la fuente de datos a la BD SAP real.

Flujo principal:

PERSONA
  -> ESTUDIANTE / DOCENTE
  -> MATRICULA
  -> PAQUETEEVENTOS (SECCIÓN)
  -> EVENTO
  -> OFERTA (HORARIO)
  -> AULA
  -> PABELLÓN
  -> ASISTENCIA
"""

from datetime import datetime
from typing import Any, Optional

from mock_sap import (
    personas,
    estudiantes,
    docentes,
    planes_estudio,
    modulos,
    paqueteeventos,
    eventos,
    aulas,
    pabellones,
    campus,
    ofertas,
    matriculas,
    asistencia_alumno,
    marcaciondocente,
    terminales,
)


# ============================================================
# CONFIGURACIÓN
# ============================================================

ANO_ACTUAL = 2026
SEMESTRE_ACTUAL = 1

DIAS_SEMANA = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo",
}


# ============================================================
# FUNCIONES BÁSICAS
# ============================================================

def normalizar_texto(valor: Any) -> str:
    if valor is None:
        return ""
    return str(valor).strip().upper()    


def obtener_periodo(ano: int, semestre: int) -> str:
    nombres = {
        1: "I",
        2: "II",
    }
    return f"{ano}-{nombres.get(semestre, str(semestre))}"


def obtener_dia_nombre(codigodia: int) -> str:
    return DIAS_SEMANA.get(int(codigodia), "Desconocido")


def hora_a_minutos(hora: str) -> int:
    horas, minutos = map(int, hora.split(":")[:2])
    return horas * 60 + minutos


def obtener_persona(codigosap: str) -> Optional[dict]:
    return next(
        (
            item for item in personas
            if item["CODIGOSAP"] == str(codigosap)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_estudiante(codigosap: str) -> Optional[dict]:
    return next(
        (
            item for item in estudiantes
            if item["CODIGOSAP"] == str(codigosap)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_docente(codigosap: str) -> Optional[dict]:
    return next(
        (
            item for item in docentes
            if item["CODIGOSAP"] == str(codigosap)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_plan_estudio(clave: str) -> Optional[dict]:
    return next(
        (
            item for item in planes_estudio
            if item["CLAVE"] == str(clave)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_modulo(clave: str) -> Optional[dict]:
    return next(
        (
            item for item in modulos
            if item["CLAVE"] == str(clave)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_paquete(clave: str) -> Optional[dict]:
    return next(
        (
            item for item in paqueteeventos
            if item["CLAVE"] == str(clave)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_evento(clave: str) -> Optional[dict]:
    return next(
        (
            item for item in eventos
            if item["CLAVE"] == str(clave)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_aula(codigo: str) -> Optional[dict]:
    return next(
        (
            item for item in aulas
            if item["CODIGO"] == str(codigo)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_pabellon(codigo: str) -> Optional[dict]:
    return next(
        (
            item for item in pabellones
            if item["CODIGO"] == str(codigo)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_oferta(consecutivo: str) -> Optional[dict]:
    return next(
        (
            item for item in ofertas
            if item["CONSECUTIVOOFERTA"] == str(consecutivo)
            and item.get("VIGENCIA") == 1
        ),
        None,
    )


def obtener_terminal(codigo: str) -> Optional[dict]:
    return next(
        (
            item for item in terminales
            if item["CODIGO"] == str(codigo)
            and item.get("ESTADO") == "ACTIVO"
        ),
        None,
    )


# ============================================================
# PERSONAS
# ============================================================

def buscar_persona(codigosap: str) -> Optional[dict]:
    return obtener_persona(codigosap)


def listar_personas() -> list[dict]:
    return [
        item for item in personas
        if item.get("VIGENCIA") == 1
    ]


# ============================================================
# ESTUDIANTES
# ============================================================

def buscar_estudiante(codigosap: str) -> Optional[dict]:
    estudiante = obtener_estudiante(codigosap)

    if not estudiante:
        return None

    persona = obtener_persona(codigosap)

    if not persona:
        return None

    plan = obtener_plan_estudio(
        estudiante["CLAVEPLANESTUDIOS"]
    )

    return {
        "CODIGOSAP": estudiante["CODIGOSAP"],
        "CODIGOTESO": estudiante["CODIGOTESO"],
        "DNI": persona["DNI"],
        "NOMBRES": persona["NOMBRES"],
        "APELLIDOPATERNO": persona["APELLIDOPATERNO"],
        "APELLIDOMATERNO": persona["APELLIDOMATERNO"],
        "NOMBRECOMPLETO": (
            f'{persona["NOMBRES"]} '
            f'{persona["APELLIDOPATERNO"]} '
            f'{persona["APELLIDOMATERNO"]}'
        ),
        "CLAVEPLANESTUDIOS": estudiante["CLAVEPLANESTUDIOS"],
        "CARRERA": plan["DENOMINACION"] if plan else None,
        "CODIGOESTADOESTUDIANTE": (
            estudiante["CODIGOESTADOESTUDIANTE"]
        ),
        "VIGENCIA": estudiante["VIGENCIA"],
    }


def listar_estudiantes() -> list[dict]:
    resultado = []

    for estudiante in estudiantes:
        if estudiante.get("VIGENCIA") != 1:
            continue

        item = buscar_estudiante(estudiante["CODIGOSAP"])

        if item:
            resultado.append(item)

    return resultado


# ============================================================
# DOCENTES
# ============================================================

def buscar_docente(codigosap: str) -> Optional[dict]:
    docente = obtener_docente(codigosap)

    if not docente:
        return None

    persona = obtener_persona(codigosap)

    if not persona:
        return None

    return {
        "CODIGOSAP": docente["CODIGOSAP"],
        "CODIGOTESO": docente["CODIGOTESO"],
        "DNI": persona["DNI"],
        "NOMBRES": persona["NOMBRES"],
        "APELLIDOPATERNO": persona["APELLIDOPATERNO"],
        "APELLIDOMATERNO": persona["APELLIDOMATERNO"],
        "NOMBRECOMPLETO": (
            f'{persona["NOMBRES"]} '
            f'{persona["APELLIDOPATERNO"]} '
            f'{persona["APELLIDOMATERNO"]}'
        ),
        "VIGENCIA": docente["VIGENCIA"],
    }


def listar_docentes() -> list[dict]:
    resultado = []

    for docente in docentes:
        if docente.get("VIGENCIA") != 1:
            continue

        item = buscar_docente(docente["CODIGOSAP"])

        if item:
            resultado.append(item)

    return resultado


# ============================================================
# PLANES / CURSOS / SECCIONES
# ============================================================

def listar_planes_estudio() -> list[dict]:
    return [
        item for item in planes_estudio
        if item.get("VIGENCIA") == 1
    ]


def listar_modulos() -> list[dict]:
    return [
        item for item in modulos
        if item.get("VIGENCIA") == 1
    ]


def listar_secciones() -> list[dict]:
    resultado = []

    for paquete in paqueteeventos:
        if paquete.get("VIGENCIA") != 1:
            continue

        modulo = obtener_modulo(paquete["CLAVEMODULO"])
        plan = obtener_plan_estudio(
            paquete["CLAVEPLANESTUDIOS"]
        )

        resultado.append({
            "CLAVEPAQUETEEVENTOS": paquete["CLAVE"],
            "ABREVIATURA": paquete["ABREVIATURA"],
            "DENOMINACION": paquete["DENOMINACION"],
            "CLAVEMODULO": paquete["CLAVEMODULO"],
            "MODULO": modulo["DENOMINACION"] if modulo else None,
            "CLAVEPLANESTUDIOS": paquete["CLAVEPLANESTUDIOS"],
            "CARRERA": plan["DENOMINACION"] if plan else None,
            "ANO": paquete["ANO"],
            "SEMESTRE": paquete["SEMESTRE"],
            "PERIODO": obtener_periodo(
                paquete["ANO"],
                paquete["SEMESTRE"],
            ),
            "INSCRIPCIONES": paquete["INSCRIPCIONES"],
            "CAPACIDADMAXIMA": paquete["CAPACIDADMAXIMA"],
            "VIGENCIA": paquete["VIGENCIA"],
        })

    return resultado


# ============================================================
# EVENTOS
# ============================================================

def obtener_evento_de_oferta(
    consecutivo_oferta: str,
) -> Optional[dict]:

    oferta = obtener_oferta(consecutivo_oferta)

    if not oferta:
        return None

    evento = obtener_evento(oferta["CLAVEEVENTO"])

    if not evento:
        return None

    paquete = obtener_paquete(
        evento["clavepaqueteevento"]
    )

    return {
        "oferta": oferta,
        "evento": evento,
        "paquete": paquete,
    }


def listar_eventos() -> list[dict]:
    resultado = []

    for evento in eventos:
        if evento.get("VIGENCIA") != 1:
            continue

        paquete = obtener_paquete(
            evento["clavepaqueteevento"]
        )

        modulo = (
            obtener_modulo(paquete["CLAVEMODULO"])
            if paquete
            else None
        )

        docente = buscar_docente(
            evento["CODIGOSAPDOCENTE"]
        )

        resultado.append({
            "CLAVEEVENTO": evento["CLAVE"],
            "ABREVIATURA": evento["ABREVIATURA"],
            "TIPOEVENTO": evento["TIPOEVENTO"],
            "DENOMINACION": evento["DENOMINACION"],
            "CLAVEPAQUETEEVENTOS": (
                evento["clavepaqueteevento"]
            ),
            "SECCION": (
                paquete["ABREVIATURA"]
                if paquete else None
            ),
            "CLAVEMODULO": (
                paquete["CLAVEMODULO"]
                if paquete else None
            ),
            "MODULO": (
                modulo["DENOMINACION"]
                if modulo else None
            ),
            "CODIGOSAPDOCENTE": (
                evento["CODIGOSAPDOCENTE"]
            ),
            "DOCENTE": (
                docente["NOMBRECOMPLETO"]
                if docente else None
            ),
            "ANO": evento["ANO"],
            "SEMESTRE": evento["SEMESTRE"],
            "PERIODO": obtener_periodo(
                evento["ANO"],
                evento["SEMESTRE"],
            ),
            "VIGENCIA": evento["VIGENCIA"],
        })

    return resultado


# ============================================================
# AULAS / PABELLONES
# ============================================================

def listar_pabellones() -> list[dict]:
    resultado = []

    for pabellon in pabellones:
        if pabellon.get("VIGENCIA") != 1:
            continue

        campus_item = next(
            (
                item for item in campus
                if item["CODIGO"]
                == pabellon["CODIGOCAMPUS"]
            ),
            None,
        )

        resultado.append({
            "CODIGO": pabellon["CODIGO"],
            "DENOMINACION": pabellon["DENOMINACION"],
            "CODIGOCAMPUS": pabellon["CODIGOCAMPUS"],
            "CAMPUS": (
                campus_item["DENOMINACION"]
                if campus_item else None
            ),
            "VIGENCIA": pabellon["VIGENCIA"],
        })

    return resultado


def listar_aulas() -> list[dict]:
    resultado = []

    for aula in aulas:
        if aula.get("VIGENCIA") != 1:
            continue

        pabellon = obtener_pabellon(
            aula["CODIGOPABELLON"]
        )

        campus_item = None

        if pabellon:
            campus_item = next(
                (
                    item for item in campus
                    if item["CODIGO"]
                    == pabellon["CODIGOCAMPUS"]
                ),
                None,
            )

        resultado.append({
            "CLAVE": aula["CLAVE"],
            "CODIGO": aula["CODIGO"],
            "DENOMINACION": aula["DENOMINACION"],
            "CODIGOPABELLON": aula["CODIGOPABELLON"],
            "PABELLON": (
                pabellon["DENOMINACION"]
                if pabellon else None
            ),
            "CODIGOCAMPUS": (
                pabellon["CODIGOCAMPUS"]
                if pabellon else None
            ),
            "CAMPUS": (
                campus_item["DENOMINACION"]
                if campus_item else None
            ),
            "CAPACIDAD": aula["CAPACIDAD"],
            "MULTIPLE": aula["MULTIPLE"],
            "virtual": aula["virtual"],
            "VIGENCIA": aula["VIGENCIA"],
        })

    return resultado


def buscar_aula(codigo_aula: str) -> Optional[dict]:
    for aula in listar_aulas():
        if aula["CODIGO"] == str(codigo_aula):
            return aula
    return None


# ============================================================
# OFERTAS / HORARIOS
# ============================================================

def listar_ofertas() -> list[dict]:
    resultado = []

    for oferta in ofertas:
        if oferta.get("VIGENCIA") != 1:
            continue

        datos = obtener_evento_de_oferta(
            oferta["CONSECUTIVOOFERTA"]
        )

        if not datos:
            continue

        evento = datos["evento"]
        paquete = datos["paquete"]

        modulo = (
            obtener_modulo(paquete["CLAVEMODULO"])
            if paquete else None
        )

        docente = buscar_docente(
            oferta["CODIGOSAPDOCENTE"]
        )

        aula = buscar_aula(
            oferta["CODIGOAULA"]
        )

        resultado.append({
            "CONSECUTIVOOFERTA": (
                oferta["CONSECUTIVOOFERTA"]
            ),
            "CLAVEEVENTO": oferta["CLAVEEVENTO"],
            "EVENTO": evento["DENOMINACION"],
            "CLAVEPAQUETEEVENTOS": (
                paquete["CLAVE"]
                if paquete else None
            ),
            "SECCION": (
                paquete["ABREVIATURA"]
                if paquete else None
            ),
            "CLAVEMODULO": (
                paquete["CLAVEMODULO"]
                if paquete else None
            ),
            "MODULO": (
                modulo["DENOMINACION"]
                if modulo else None
            ),
            "CODIGOSAPDOCENTE": (
                oferta["CODIGOSAPDOCENTE"]
            ),
            "DOCENTE": (
                docente["NOMBRECOMPLETO"]
                if docente else None
            ),
            "CODIGOAULA": oferta["CODIGOAULA"],
            "AULA": (
                aula["DENOMINACION"]
                if aula else None
            ),
            "CODIGODIA": oferta["CODIGODIA"],
            "DIA": obtener_dia_nombre(
                oferta["CODIGODIA"]
            ),
            "HORAINICIO": oferta["HORAINICIO"],
            "HORAFIN": oferta["HORAFIN"],
            "CODIGOTURNO": oferta["CODIGOTURNO"],
            "ANO": oferta["ANO"],
            "SEMESTRE": oferta["SEMESTRE"],
            "PERIODO": obtener_periodo(
                oferta["ANO"],
                oferta["SEMESTRE"],
            ),
            "VIGENCIA": oferta["VIGENCIA"],
        })

    return resultado


def listar_horarios_aula(
    codigo_aula: str,
) -> list[dict]:

    return [
        oferta for oferta in listar_ofertas()
        if oferta["CODIGOAULA"] == str(codigo_aula)
    ]


def listar_horarios_docente(
    codigosap: str,
) -> list[dict]:

    return [
        oferta for oferta in listar_ofertas()
        if oferta["CODIGOSAPDOCENTE"] == str(codigosap)
    ]


# ============================================================
# MATRÍCULAS
# ============================================================

def obtener_matriculas_estudiante(
    codigosap: str,
) -> list[dict]:

    return [
        item for item in matriculas
        if item["CODIGOSAP"] == str(codigosap)
        and item.get("VIGENCIA") == 1
    ]


def listar_matriculas_estudiante(
    codigosap: str,
) -> list[dict]:

    resultado = []

    for matricula in obtener_matriculas_estudiante(
        codigosap
    ):
        paquete = obtener_paquete(
            matricula["CLAVEPAQUETEEVENTOS"]
        )

        modulo = (
            obtener_modulo(paquete["CLAVEMODULO"])
            if paquete else None
        )

        plan = obtener_plan_estudio(
            matricula["CLAVEPLANESTUDIOS"]
        )

        resultado.append({
            "CODIGOSAP": matricula["CODIGOSAP"],
            "CLAVEPAQUETEEVENTOS": (
                matricula["CLAVEPAQUETEEVENTOS"]
            ),
            "ABREVIATURAPAQUETEEVENTOS": (
                matricula[
                    "ABREVIATURAPAQUETEEVENTOS"
                ]
            ),
            "SECCION": (
                paquete["ABREVIATURA"]
                if paquete else None
            ),
            "CLAVEMODULO": (
                paquete["CLAVEMODULO"]
                if paquete else None
            ),
            "MODULO": (
                modulo["DENOMINACION"]
                if modulo else None
            ),
            "CLAVEPLANESTUDIOS": (
                matricula["CLAVEPLANESTUDIOS"]
            ),
            "CARRERA": (
                plan["DENOMINACION"]
                if plan else None
            ),
            "ANO": matricula["ANO"],
            "SEMESTRE": matricula["SEMESTRE"],
            "PERIODO": obtener_periodo(
                matricula["ANO"],
                matricula["SEMESTRE"],
            ),
            "VIGENCIA": matricula["VIGENCIA"],
        })

    return resultado


def verificar_matricula(
    codigosap: str,
    clavepaqueteeventos: str,
    ano: int = ANO_ACTUAL,
    semestre: int = SEMESTRE_ACTUAL,
) -> bool:

    return any(
        item["CODIGOSAP"] == str(codigosap)
        and item["CLAVEPAQUETEEVENTOS"]
        == str(clavepaqueteeventos)
        and item["ANO"] == ano
        and item["SEMESTRE"] == semestre
        and item.get("VIGENCIA") == 1
        for item in matriculas
    )


def verificar_matricula_oferta(
    codigosap: str,
    consecutivo_oferta: str,
) -> bool:

    datos = obtener_evento_de_oferta(
        consecutivo_oferta
    )

    if not datos or not datos["paquete"]:
        return False

    return verificar_matricula(
        codigosap,
        datos["paquete"]["CLAVE"],
        datos["oferta"]["ANO"],
        datos["oferta"]["SEMESTRE"],
    )


# ============================================================
# HORARIOS DE ESTUDIANTE
# ============================================================

def listar_horarios_estudiante(
    codigosap: str,
) -> list[dict]:

    resultado = []

    estudiante = buscar_estudiante(codigosap)

    if not estudiante:
        return resultado

    for matricula in listar_matriculas_estudiante(
        codigosap
    ):
        clave_paquete = (
            matricula["CLAVEPAQUETEEVENTOS"]
        )

        for oferta in listar_ofertas():

            datos = obtener_evento_de_oferta(
                oferta["CONSECUTIVOOFERTA"]
            )

            if not datos:
                continue

            paquete = datos["paquete"]

            if not paquete:
                continue

            if paquete["CLAVE"] != clave_paquete:
                continue

            if oferta["ANO"] != matricula["ANO"]:
                continue

            if oferta["SEMESTRE"] != matricula["SEMESTRE"]:
                continue

            resultado.append({
                **oferta,
                "CODIGOSAP": codigosap,
                "CARRERA": matricula["CARRERA"],
                "CLAVEPLANESTUDIOS": (
                    matricula["CLAVEPLANESTUDIOS"]
                ),
                "CLAVEPAQUETEEVENTOS": (
                    paquete["CLAVE"]
                ),
                "SECCION": (
                    paquete["ABREVIATURA"]
                ),
                "SECCION_NOMBRE": (
                    paquete["DENOMINACION"]
                ),
            })

    resultado.sort(
        key=lambda item: (
            item["CODIGODIA"],
            hora_a_minutos(item["HORAINICIO"]),
        )
    )

    return resultado


# ============================================================
# CLASES DE UN AULA
# ============================================================

def obtener_clases_del_aula(
    codigo_aula: str,
) -> list[dict]:

    return listar_horarios_aula(codigo_aula)


# ============================================================
# TABLETS / TERMINALES
# ============================================================

def listar_terminales() -> list[dict]:
    resultado = []

    for terminal in terminales:

        aula = buscar_aula(
            terminal["CODIGOAULA"]
        )

        resultado.append({
            "CODIGO": terminal["CODIGO"],
            "NOMBRE": terminal["NOMBRE"],
            "CODIGOAULA": terminal["CODIGOAULA"],
            "AULA": (
                aula["DENOMINACION"]
                if aula else None
            ),
            "TIPO": terminal["TIPO"],
            "ESTADO": terminal["ESTADO"],
        })

    return resultado


def buscar_terminal(
    codigo_terminal: str,
) -> Optional[dict]:

    terminal = obtener_terminal(
        codigo_terminal
    )

    if not terminal:
        return None

    aula = buscar_aula(
        terminal["CODIGOAULA"]
    )

    return {
        **terminal,
        "AULA": (
            aula["DENOMINACION"]
            if aula else None
        ),
    }


# ============================================================
# CLASE ACTIVA PARA UNA TABLET/AULA
# ============================================================

def clase_activa_para_aula(
    codigo_aula: str,
    fecha_hora: Optional[datetime] = None,
) -> Optional[dict]:

    if fecha_hora is None:
        fecha_hora = datetime.now()

    dia_actual = fecha_hora.isoweekday()

    minutos_actuales = (
        fecha_hora.hour * 60
        + fecha_hora.minute
    )

    for horario in listar_horarios_aula(
        codigo_aula
    ):

        if horario["CODIGODIA"] != dia_actual:
            continue

        if horario["ANO"] != ANO_ACTUAL:
            continue

        if horario["SEMESTRE"] != SEMESTRE_ACTUAL:
            continue

        inicio = hora_a_minutos(
            horario["HORAINICIO"]
        )

        fin = hora_a_minutos(
            horario["HORAFIN"]
        )

        ventana_inicio = inicio - 10

        if ventana_inicio <= minutos_actuales <= fin:

            return {
                **horario,
                "ACTIVA": True,
                "DIA_ACTUAL": obtener_dia_nombre(
                    dia_actual
                ),
                "MINUTOS_PARA_INICIO": (
                    inicio - minutos_actuales
                ),
                "MINUTOS_DESDE_INICIO": (
                    minutos_actuales - inicio
                ),
            }

    return None


def proxima_clase_aula(
    codigo_aula: str,
    fecha_hora: Optional[datetime] = None,
) -> Optional[dict]:

    if fecha_hora is None:
        fecha_hora = datetime.now()

    dia_actual = fecha_hora.isoweekday()

    minutos_actuales = (
        fecha_hora.hour * 60
        + fecha_hora.minute
    )

    candidatos = []

    for horario in listar_horarios_aula(
        codigo_aula
    ):

        if horario["ANO"] != ANO_ACTUAL:
            continue

        if horario["SEMESTRE"] != SEMESTRE_ACTUAL:
            continue

        dia = horario["CODIGODIA"]
        inicio = hora_a_minutos(
            horario["HORAINICIO"]
        )

        diferencia_dia = (
            dia - dia_actual
        ) % 7

        if (
            diferencia_dia == 0
            and inicio <= minutos_actuales
        ):
            diferencia_dia = 7

        candidatos.append(
            (
                diferencia_dia,
                inicio,
                horario,
            )
        )

    if not candidatos:
        return None

    candidatos.sort(
        key=lambda item: (
            item[0],
            item[1],
        )
    )

    return candidatos[0][2]


# ============================================================
# VALIDACIÓN ACADÉMICA
# ============================================================

def validar_asistencia_estudiante(
    codigosap: str,
    consecutivo_oferta: str,
) -> dict:

    estudiante = buscar_estudiante(codigosap)

    if not estudiante:
        return {
            "valido": False,
            "codigo": "ESTUDIANTE_NO_ENCONTRADO",
            "mensaje": (
                "El estudiante no existe "
                "o no está vigente."
            ),
        }

    oferta = obtener_oferta(
        consecutivo_oferta
    )

    if not oferta:
        return {
            "valido": False,
            "codigo": "OFERTA_NO_ENCONTRADA",
            "mensaje": "La oferta no existe.",
        }

    datos = obtener_evento_de_oferta(
        consecutivo_oferta
    )

    if not datos:
        return {
            "valido": False,
            "codigo": "EVENTO_NO_ENCONTRADO",
            "mensaje": "No se encontró el evento.",
        }

    paquete = datos["paquete"]

    if not paquete:
        return {
            "valido": False,
            "codigo": "SECCION_NO_ENCONTRADA",
            "mensaje": "No se encontró la sección.",
        }

    if not verificar_matricula_oferta(
        codigosap,
        consecutivo_oferta,
    ):
        return {
            "valido": False,
            "codigo": "NO_MATRICULADO",
            "mensaje": (
                "El estudiante no está "
                "matriculado en esta clase."
            ),
            "CODIGOSAP": codigosap,
            "CONSECUTIVOOFERTA": consecutivo_oferta,
            "CLAVEPAQUETEEVENTOS": paquete["CLAVE"],
        }

    return {
        "valido": True,
        "codigo": "OK",
        "mensaje": (
            "Estudiante validado "
            "académicamente."
        ),
        "estudiante": estudiante,
        "oferta": oferta,
        "evento": datos["evento"],
        "seccion": paquete,
    }


# ============================================================
# ESTADO DE ASISTENCIA
# ============================================================

def determinar_estado_asistencia(
    consecutivo_oferta: str,
    fecha_hora: Optional[datetime] = None,
) -> dict:

    if fecha_hora is None:
        fecha_hora = datetime.now()

    oferta = obtener_oferta(
        consecutivo_oferta
    )

    if not oferta:
        return {
            "valido": False,
            "estado": None,
            "codigo": "OFERTA_NO_ENCONTRADA",
        }

    inicio = hora_a_minutos(
        oferta["HORAINICIO"]
    )

    fin = hora_a_minutos(
        oferta["HORAFIN"]
    )

    actual = (
        fecha_hora.hour * 60
        + fecha_hora.minute
    )

    ventana_inicio = inicio - 10
    limite_tardanza = inicio + 20

    if actual < ventana_inicio:
        return {
            "valido": False,
            "estado": None,
            "codigo": "MUY_TEMPRANO",
            "mensaje": (
                "La ventana de asistencia "
                "todavía no está activa."
            ),
        }

    if actual < inicio:
        return {
            "valido": True,
            "estado": "A",
            "descripcion": "ASISTIO",
            "codigo": "ASISTENCIA_ANTICIPADA",
        }

    if actual <= limite_tardanza:
        return {
            "valido": True,
            "estado": "T",
            "descripcion": "TARDANZA",
            "codigo": "TARDANZA",
        }

    if actual <= fin:
        return {
            "valido": False,
            "estado": None,
            "codigo": "VENTANA_TARDANZA_CERRADA",
            "mensaje": (
                "La ventana de asistencia "
                "ha terminado."
            ),
        }

    return {
        "valido": False,
        "estado": None,
        "codigo": "CLASE_FINALIZADA",
        "mensaje": "La clase ya finalizó.",
    }


# ============================================================
# ASISTENCIA DE ALUMNOS
# ============================================================

def asistencia_ya_registrada(
    codigosap_alumno: str,
    consecutivo_oferta: str,
    fecha_evento: str,
) -> bool:

    return any(
        registro.get("codigosap_alumno")
        == codigosap_alumno
        and registro.get("CONSECUTIVOOFERTA")
        == consecutivo_oferta
        and registro.get("fecha_evento")
        == fecha_evento
        for registro in asistencia_alumno
    )


def registrar_asistencia_alumno(
    codigosap: str,
    consecutivo_oferta: str,
    fecha_hora: Optional[datetime] = None,
) -> dict:

    if fecha_hora is None:
        fecha_hora = datetime.now()

    validacion = validar_asistencia_estudiante(
        codigosap,
        consecutivo_oferta,
    )

    if not validacion["valido"]:
        return validacion

    estado = determinar_estado_asistencia(
        consecutivo_oferta,
        fecha_hora,
    )

    if not estado["valido"]:
        return {
            **estado,
            "CODIGOSAP": codigosap,
            "CONSECUTIVOOFERTA": consecutivo_oferta,
        }

    fecha_evento = fecha_hora.strftime(
        "%Y-%m-%d"
    )

    if asistencia_ya_registrada(
        codigosap,
        consecutivo_oferta,
        fecha_evento,
    ):
        return {
            "valido": False,
            "codigo": "YA_REGISTRADO",
            "mensaje": (
                "La asistencia ya fue "
                "registrada para esta clase."
            ),
        }

    oferta = validacion["oferta"]
    evento = validacion["evento"]
    seccion = validacion["seccion"]

    id_asistencia = (
        f"ASIS-{len(asistencia_alumno) + 1:05d}"
    )

    registro = {
        "id_asistencia": id_asistencia,
        "claveevento": evento["CLAVE"],
        "abrev_eventos": evento["ABREVIATURA"],
        "clavepaqueteeventos": seccion["CLAVE"],
        "abrev_paqueteeventos": (
            seccion["ABREVIATURA"]
        ),
        "clavemodulo": seccion["CLAVEMODULO"],
        "codigosap_docente": (
            oferta["CODIGOSAPDOCENTE"]
        ),
        "codigosap_alumno": codigosap,
        "fecha_evento": fecha_evento,
        "estado_asistencia": estado["estado"],
        "ano": oferta["ANO"],
        "semestre": oferta["SEMESTRE"],
        "hora_registro": (
            fecha_hora.strftime("%H:%M:%S")
        ),
        "CONSECUTIVOOFERTA": consecutivo_oferta,
    }

    asistencia_alumno.append(registro)

    return {
        "valido": True,
        "codigo": "ASISTENCIA_REGISTRADA",
        "mensaje": (
            "Asistencia registrada "
            "correctamente."
        ),
        "estado": estado["estado"],
        "descripcion": estado["descripcion"],
        "registro": registro,
        "estudiante": validacion["estudiante"],
        "oferta": oferta,
    }


def listar_asistencias_alumno() -> list[dict]:
    return list(asistencia_alumno)


def listar_asistencias_por_estudiante(
    codigosap: str,
) -> list[dict]:

    return [
        registro for registro in asistencia_alumno
        if registro.get("codigosap_alumno")
        == str(codigosap)
    ]


# ============================================================
# MARCACIÓN DOCENTE
# ============================================================

def buscar_marcacion_docente(
    codigosap_docente: str,
    fecha: str,
    consecutivo_oferta: str,
) -> Optional[dict]:

    return next(
        (
            registro
            for registro in marcaciondocente
            if registro.get("CODIGOSAPDOCENTE")
            == str(codigosap_docente)
            and registro.get("FECHA") == fecha
            and registro.get("CONSECUTIVOOFERTA")
            == str(consecutivo_oferta)
        ),
        None,
    )


def registrar_ingreso_docente(
    codigosap_docente: str,
    consecutivo_oferta: str,
    fecha_hora: Optional[datetime] = None,
) -> dict:

    if fecha_hora is None:
        fecha_hora = datetime.now()

    docente = buscar_docente(
        codigosap_docente
    )

    if not docente:
        return {
            "valido": False,
            "codigo": "DOCENTE_NO_ENCONTRADO",
            "mensaje": "Docente no encontrado.",
        }

    oferta = obtener_oferta(
        consecutivo_oferta
    )

    if not oferta:
        return {
            "valido": False,
            "codigo": "OFERTA_NO_ENCONTRADA",
            "mensaje": "Oferta no encontrada.",
        }

    if (
        oferta["CODIGOSAPDOCENTE"]
        != str(codigosap_docente)
    ):
        return {
            "valido": False,
            "codigo": "DOCENTE_NO_ASIGNADO",
            "mensaje": (
                "El docente no está asignado "
                "a esta clase."
            ),
        }

    fecha = fecha_hora.strftime(
        "%Y-%m-%d"
    )

    existente = buscar_marcacion_docente(
        codigosap_docente,
        fecha,
        consecutivo_oferta,
    )

    if existente:
        return {
            "valido": False,
            "codigo": "INGRESO_YA_REGISTRADO",
            "mensaje": "El ingreso ya fue registrado.",
            "registro": existente,
        }

    inicio = hora_a_minutos(
        oferta["HORAINICIO"]
    )

    fin = hora_a_minutos(
        oferta["HORAFIN"]
    )

    actual = (
        fecha_hora.hour * 60
        + fecha_hora.minute
    )

    if actual < inicio - 5:
        return {
            "valido": False,
            "codigo": "MUY_TEMPRANO",
            "mensaje": (
                "El ingreso docente "
                "todavía no está habilitado."
            ),
        }

    if actual > fin:
        return {
            "valido": False,
            "codigo": "CLASE_FINALIZADA",
            "mensaje": "La clase ya finalizó.",
        }

    estado = "A" if actual <= inicio else "T"

    registro = {
        "CONSECUTIVOOFERTA": consecutivo_oferta,
        "CODIGOSAPDOCENTE": codigosap_docente,
        "FECHA": fecha,
        "ANO": oferta["ANO"],
        "SEMESTRE": oferta["SEMESTRE"],
        "HORAINGRESO": (
            fecha_hora.strftime("%H:%M:%S")
        ),
        "HORASALIDA": None,
        "ESTADO": estado,
    }

    marcaciondocente.append(registro)

    return {
        "valido": True,
        "codigo": "INGRESO_REGISTRADO",
        "mensaje": "Ingreso docente registrado.",
        "estado": estado,
        "registro": registro,
        "docente": docente,
    }


def registrar_salida_docente(
    codigosap_docente: str,
    consecutivo_oferta: str,
    fecha_hora: Optional[datetime] = None,
) -> dict:

    if fecha_hora is None:
        fecha_hora = datetime.now()

    fecha = fecha_hora.strftime(
        "%Y-%m-%d"
    )

    registro = buscar_marcacion_docente(
        codigosap_docente,
        fecha,
        consecutivo_oferta,
    )

    if not registro:
        return {
            "valido": False,
            "codigo": "INGRESO_NO_REGISTRADO",
            "mensaje": (
                "No existe un ingreso docente "
                "previo para esta clase."
            ),
        }

    if registro.get("HORASALIDA"):
        return {
            "valido": False,
            "codigo": "SALIDA_YA_REGISTRADA",
            "mensaje": "La salida ya fue registrada.",
            "registro": registro,
        }

    oferta = obtener_oferta(
        consecutivo_oferta
    )

    if not oferta:
        return {
            "valido": False,
            "codigo": "OFERTA_NO_ENCONTRADA",
        }

    fin = hora_a_minutos(
        oferta["HORAFIN"]
    )

    actual = (
        fecha_hora.hour * 60
        + fecha_hora.minute
    )

    if actual < fin:
        return {
            "valido": False,
            "codigo": "SALIDA_ANTICIPADA",
            "mensaje": (
                "La salida se habilita "
                "al finalizar la clase."
            ),
        }

    if actual > fin + 20:
        return {
            "valido": False,
            "codigo": "SALIDA_CERRADA",
            "mensaje": (
                "La ventana de salida "
                "ha terminado."
            ),
        }

    registro["HORASALIDA"] = (
        fecha_hora.strftime("%H:%M:%S")
    )

    return {
        "valido": True,
        "codigo": "SALIDA_REGISTRADA",
        "mensaje": "Salida docente registrada.",
        "registro": registro,
    }


# ============================================================
# RESUMEN
# ============================================================

def obtener_resumen() -> dict:
    return {
        "personas": len(personas),
        "estudiantes": len(estudiantes),
        "docentes": len(docentes),
        "planes_estudio": len(planes_estudio),
        "modulos": len(modulos),
        "paqueteeventos": len(paqueteeventos),
        "eventos": len(eventos),
        "ofertas": len(ofertas),
        "aulas": len(aulas),
        "pabellones": len(pabellones),
        "campus": len(campus),
        "matriculas": len(matriculas),
        "asistencia_alumno": len(asistencia_alumno),
        "marcaciondocente": len(marcaciondocente),
        "terminales": len(terminales),
    }


# ============================================================
# PRUEBA DIRECTA
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("SAP MOCK SERVICE - PRUEBA")
    print("=" * 70)

    print("\nRESUMEN")
    print("-" * 70)

    for clave, valor in obtener_resumen().items():
        print(f"{clave:25}: {valor}")

    print("\nESTUDIANTES")
    print("-" * 70)

    for estudiante in listar_estudiantes():
        print(
            f'{estudiante["CODIGOSAP"]} | '
            f'{estudiante["NOMBRECOMPLETO"]} | '
            f'{estudiante["CARRERA"]}'
        )

    print("\nHORARIOS DE 20260001")
    print("-" * 70)

    for horario in listar_horarios_estudiante(
        "20260001"
    ):
        print(
            f'{horario["DIA"]} | '
            f'{horario["HORAINICIO"]} - '
            f'{horario["HORAFIN"]} | '
            f'{horario["MODULO"]} | '
            f'Sección {horario["SECCION"]} | '
            f'{horario["CODIGOAULA"]}'
        )

    print("\nTERMINALES")
    print("-" * 70)

    for terminal in listar_terminales():
        print(
            f'{terminal["CODIGO"]} | '
            f'{terminal["CODIGOAULA"]} | '
            f'{terminal["ESTADO"]}'
        )

    print("\n" + "=" * 70)
    print("PRUEBA FINALIZADA CORRECTAMENTE")
    print("=" * 70)
