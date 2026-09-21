"""
mock_sap.py
===========

DATOS SAP SIMULADOS PARA PRUEBAS
--------------------------------

Este archivo NO se conecta a MySQL.

Su objetivo es simular la estructura y los campos
principales de la base de datos SAP real para probar:

    PERSONA
       ↓
    ESTUDIANTE / DOCENTE
       ↓
    MATRÍCULA
       ↓
    PAQUETEEVENTOS = SECCIÓN
       ↓
    EVENTO
       ↓
    OFERTA = HORARIO
       ↓
    AULA
       ↓
    PABELLÓN
       ↓
    ASISTENCIA

IMPORTANTE:
- Los nombres de los campos siguen la nomenclatura SAP.
- CODIGOSAP será la identificación principal de la persona.
- No usamos UUID como identidad académica.
- Los datos son únicamente para pruebas.
- Cuando conectemos MySQL, este archivo será reemplazado
  por consultas reales sin cambiar la lógica superior.
"""


# ============================================================
# CAMPUS
# ============================================================

campus = [
    {
        "CODIGO": "CAMP-01",
        "DENOMINACION": "Campus Principal",
        "VIGENCIA": 1,
    },
]


# ============================================================
# PABELLONES
# ============================================================

pabellones = [
    {
        "CODIGO": "PAB-A",
        "DENOMINACION": "Pabellón de Ingeniería",
        "CODIGOCAMPUS": "CAMP-01",
        "VIGENCIA": 1,
    },
    {
        "CODIGO": "PAB-B",
        "DENOMINACION": "Pabellón de Tecnología",
        "CODIGOCAMPUS": "CAMP-01",
        "VIGENCIA": 1,
    },
    {
        "CODIGO": "PAB-C",
        "DENOMINACION": "Pabellón de Ciencias",
        "CODIGOCAMPUS": "CAMP-01",
        "VIGENCIA": 1,
    },
    {
        "CODIGO": "PAB-D",
        "DENOMINACION": "Pabellón de Administración",
        "CODIGOCAMPUS": "CAMP-01",
        "VIGENCIA": 1,
    },
    {
        "CODIGO": "PAB-E",
        "DENOMINACION": "Pabellón de Ingeniería Industrial",
        "CODIGOCAMPUS": "CAMP-01",
        "VIGENCIA": 1,
    },
]


# ============================================================
# PLANES DE ESTUDIO / CARRERAS
#
# La BD real utiliza CLAVEPLANESTUDIOS en diferentes tablas.
# Aquí simulamos la información necesaria para poder mostrar
# la carrera asociada.
# ============================================================

planes_estudio = [
    {
        "CLAVE": "PLAN-SIS-2026",
        "CODIGO": "SIS-2026",
        "DENOMINACION": "Ingeniería de Sistemas",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "PLAN-IDS-2026",
        "CODIGO": "IDS-2026",
        "DENOMINACION": "Ingeniería de Software",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "PLAN-CD-2026",
        "CODIGO": "CD-2026",
        "DENOMINACION": "Ciencia de Datos",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "PLAN-ADM-2026",
        "CODIGO": "ADM-2026",
        "DENOMINACION": "Administración",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "PLAN-IND-2026",
        "CODIGO": "IND-2026",
        "DENOMINACION": "Ingeniería Industrial",
        "VIGENCIA": 1,
    },
]


# ============================================================
# PERSONA
# ============================================================

personas = [
    {
        "CODIGOSAP": "20260001",
        "APELLIDOPATERNO": "PEREZ",
        "APELLIDOMATERNO": "GARCIA",
        "NOMBRES": "JUAN",
        "DNI": "76543210",
        "FECHANACIMIENTO": "2002-03-15",
        "DIRECCION": "Lima",
        "SEXO": "M",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260002",
        "APELLIDOPATERNO": "TORRES",
        "APELLIDOMATERNO": "RAMIREZ",
        "NOMBRES": "MARIA",
        "DNI": "76543211",
        "FECHANACIMIENTO": "2003-05-20",
        "DIRECCION": "Lima",
        "SEXO": "F",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260003",
        "APELLIDOPATERNO": "MENDOZA",
        "APELLIDOMATERNO": "LOPEZ",
        "NOMBRES": "CARLOS",
        "DNI": "76543212",
        "FECHANACIMIENTO": "2002-08-11",
        "DIRECCION": "Callao",
        "SEXO": "M",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260004",
        "APELLIDOPATERNO": "FLORES",
        "APELLIDOMATERNO": "DIAZ",
        "NOMBRES": "ANA",
        "DNI": "76543213",
        "FECHANACIMIENTO": "2003-01-30",
        "DIRECCION": "Lima",
        "SEXO": "F",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260005",
        "APELLIDOPATERNO": "SANCHEZ",
        "APELLIDOMATERNO": "VEGA",
        "NOMBRES": "LUIS",
        "DNI": "76543214",
        "FECHANACIMIENTO": "2002-11-02",
        "DIRECCION": "Lima",
        "SEXO": "M",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260006",
        "APELLIDOPATERNO": "CASTILLO",
        "APELLIDOMATERNO": "RUIZ",
        "NOMBRES": "ROSA",
        "DNI": "76543215",
        "FECHANACIMIENTO": "2003-02-17",
        "DIRECCION": "Lima",
        "SEXO": "F",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260007",
        "APELLIDOPATERNO": "RAMIREZ",
        "APELLIDOMATERNO": "SOTO",
        "NOMBRES": "PEDRO",
        "DNI": "76543216",
        "FECHANACIMIENTO": "2001-09-25",
        "DIRECCION": "Lima",
        "SEXO": "M",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260008",
        "APELLIDOPATERNO": "LOPEZ",
        "APELLIDOMATERNO": "TORRES",
        "NOMBRES": "CARMEN",
        "DNI": "76543217",
        "FECHANACIMIENTO": "2002-12-12",
        "DIRECCION": "Lima",
        "SEXO": "F",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260009",
        "APELLIDOPATERNO": "VARGAS",
        "APELLIDOMATERNO": "PEREZ",
        "NOMBRES": "DIEGO",
        "DNI": "76543218",
        "FECHANACIMIENTO": "2001-06-08",
        "DIRECCION": "Lima",
        "SEXO": "M",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260010",
        "APELLIDOPATERNO": "HERRERA",
        "APELLIDOMATERNO": "CRUZ",
        "NOMBRES": "SOFIA",
        "DNI": "76543219",
        "FECHANACIMIENTO": "2003-04-22",
        "DIRECCION": "Lima",
        "SEXO": "F",
        "CODIGOTIPOPERSONA": "EST",
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # DOCENTES
    # --------------------------------------------------------

    {
        "CODIGOSAP": "900001",
        "APELLIDOPATERNO": "MENDOZA",
        "APELLIDOMATERNO": "LOPEZ",
        "NOMBRES": "LUIS",
        "DNI": "45678901",
        "FECHANACIMIENTO": "1980-04-10",
        "DIRECCION": "Lima",
        "SEXO": "M",
        "CODIGOTIPOPERSONA": "DOC",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "900002",
        "APELLIDOPATERNO": "TORRES",
        "APELLIDOMATERNO": "RAMIREZ",
        "NOMBRES": "ANA",
        "DNI": "45678902",
        "FECHANACIMIENTO": "1982-07-19",
        "DIRECCION": "Lima",
        "SEXO": "F",
        "CODIGOTIPOPERSONA": "DOC",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "900003",
        "APELLIDOPATERNO": "GARCIA",
        "APELLIDOMATERNO": "SILVA",
        "NOMBRES": "CARLOS",
        "DNI": "45678903",
        "FECHANACIMIENTO": "1978-01-25",
        "DIRECCION": "Lima",
        "SEXO": "M",
        "CODIGOTIPOPERSONA": "DOC",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "900004",
        "APELLIDOPATERNO": "RAMOS",
        "APELLIDOMATERNO": "DIAZ",
        "NOMBRES": "MARIA",
        "DNI": "45678904",
        "FECHANACIMIENTO": "1981-09-12",
        "DIRECCION": "Lima",
        "SEXO": "F",
        "CODIGOTIPOPERSONA": "DOC",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "900005",
        "APELLIDOPATERNO": "SOTO",
        "APELLIDOMATERNO": "CASTRO",
        "NOMBRES": "JORGE",
        "DNI": "45678905",
        "FECHANACIMIENTO": "1979-11-30",
        "DIRECCION": "Lima",
        "SEXO": "M",
        "CODIGOTIPOPERSONA": "DOC",
        "VIGENCIA": 1,
    },
]


# ============================================================
# ESTUDIANTE
# ============================================================

estudiantes = [
    {
        "CODIGOSAP": "20260001",
        "CODIGOTESO": "EST001",
        "CLAVEPLANESTUDIOS": "PLAN-SIS-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260002",
        "CODIGOTESO": "EST002",
        "CLAVEPLANESTUDIOS": "PLAN-SIS-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260003",
        "CODIGOTESO": "EST003",
        "CLAVEPLANESTUDIOS": "PLAN-IDS-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260004",
        "CODIGOTESO": "EST004",
        "CLAVEPLANESTUDIOS": "PLAN-IDS-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260005",
        "CODIGOTESO": "EST005",
        "CLAVEPLANESTUDIOS": "PLAN-CD-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260006",
        "CODIGOTESO": "EST006",
        "CLAVEPLANESTUDIOS": "PLAN-CD-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260007",
        "CODIGOTESO": "EST007",
        "CLAVEPLANESTUDIOS": "PLAN-ADM-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260008",
        "CODIGOTESO": "EST008",
        "CLAVEPLANESTUDIOS": "PLAN-ADM-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260009",
        "CODIGOTESO": "EST009",
        "CLAVEPLANESTUDIOS": "PLAN-IND-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260010",
        "CODIGOTESO": "EST010",
        "CLAVEPLANESTUDIOS": "PLAN-IND-2026",
        "CODIGOESTADOESTUDIANTE": "ACT",
        "VIGENCIA": 1,
    },
]


# ============================================================
# DOCENTE
#
# Importante:
# PERSONA continúa siendo la entidad principal.
# DOCENTE solamente representa la relación/rol docente.
# ============================================================

docentes = [
    {
        "CODIGOSAP": "900001",
        "CODIGOTESO": "DOC001",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "900002",
        "CODIGOTESO": "DOC002",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "900003",
        "CODIGOTESO": "DOC003",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "900004",
        "CODIGOTESO": "DOC004",
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "900005",
        "CODIGOTESO": "DOC005",
        "VIGENCIA": 1,
    },
]


# ============================================================
# MODULO
#
# Conceptualmente representa el CURSO / ASIGNATURA.
# ============================================================

modulos = [
    {
        "CLAVE": "301",
        "CODIGO": "IA301",
        "CODIGOCORTO": "IA",
        "DENOMINACION": "INTELIGENCIA ARTIFICIAL",
        "CREDITOS": 4,
        "CODIGOCICLO": "06",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "302",
        "CODIGO": "BD302",
        "CODIGOCORTO": "BD",
        "DENOMINACION": "BASE DE DATOS",
        "CREDITOS": 4,
        "CODIGOCICLO": "05",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "303",
        "CODIGO": "PW303",
        "CODIGOCORTO": "PW",
        "DENOMINACION": "PROGRAMACION WEB",
        "CREDITOS": 4,
        "CODIGOCICLO": "04",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "304",
        "CODIGO": "RC304",
        "CODIGOCORTO": "RC",
        "DENOMINACION": "REDES DE COMPUTADORAS",
        "CREDITOS": 3,
        "CODIGOCICLO": "05",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "305",
        "CODIGO": "ML305",
        "CODIGOCORTO": "ML",
        "DENOMINACION": "MACHINE LEARNING",
        "CREDITOS": 4,
        "CODIGOCICLO": "07",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "306",
        "CODIGO": "EA306",
        "CODIGOCORTO": "EA",
        "DENOMINACION": "ESTADISTICA APLICADA",
        "CREDITOS": 3,
        "CODIGOCICLO": "04",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "307",
        "CODIGO": "GE307",
        "CODIGOCORTO": "GE",
        "DENOMINACION": "GESTION EMPRESARIAL",
        "CREDITOS": 3,
        "CODIGOCICLO": "03",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "308",
        "CODIGO": "CG308",
        "CODIGOCORTO": "CG",
        "DENOMINACION": "CONTABILIDAD GENERAL",
        "CREDITOS": 3,
        "CODIGOCICLO": "03",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "309",
        "CODIGO": "IO309",
        "CODIGOCORTO": "IO",
        "DENOMINACION": "INVESTIGACION DE OPERACIONES",
        "CREDITOS": 4,
        "CODIGOCICLO": "06",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "310",
        "CODIGO": "GP310",
        "CODIGOCORTO": "GP",
        "DENOMINACION": "GESTION DE PROCESOS",
        "CREDITOS": 3,
        "CODIGOCICLO": "05",
        "CODIGOTIPOOBJETO": "AS",
        "VIGENCIA": 1,
    },
]


# ============================================================
# PAQUETEEVENTOS
#
# IMPORTANTE:
# En este proyecto lo tratamos como SECCIÓN.
# ============================================================

paqueteeventos = [
    {
        "CLAVE": "501",
        "ABREVIATURA": "A",
        "DENOMINACION": "SECCION A - INTELIGENCIA ARTIFICIAL",
        "CLAVEMODULO": "301",
        "CLAVEPLANESTUDIOS": "PLAN-SIS-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "502",
        "ABREVIATURA": "B",
        "DENOMINACION": "SECCION B - BASE DE DATOS",
        "CLAVEMODULO": "302",
        "CLAVEPLANESTUDIOS": "PLAN-SIS-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "503",
        "ABREVIATURA": "A",
        "DENOMINACION": "SECCION A - PROGRAMACION WEB",
        "CLAVEMODULO": "303",
        "CLAVEPLANESTUDIOS": "PLAN-IDS-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 30,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "504",
        "ABREVIATURA": "B",
        "DENOMINACION": "SECCION B - REDES DE COMPUTADORAS",
        "CLAVEMODULO": "304",
        "CLAVEPLANESTUDIOS": "PLAN-IDS-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 30,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "505",
        "ABREVIATURA": "A",
        "DENOMINACION": "SECCION A - MACHINE LEARNING",
        "CLAVEMODULO": "305",
        "CLAVEPLANESTUDIOS": "PLAN-CD-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 30,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "506",
        "ABREVIATURA": "B",
        "DENOMINACION": "SECCION B - ESTADISTICA APLICADA",
        "CLAVEMODULO": "306",
        "CLAVEPLANESTUDIOS": "PLAN-CD-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "507",
        "ABREVIATURA": "A",
        "DENOMINACION": "SECCION A - GESTION EMPRESARIAL",
        "CLAVEMODULO": "307",
        "CLAVEPLANESTUDIOS": "PLAN-ADM-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 40,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "508",
        "ABREVIATURA": "B",
        "DENOMINACION": "SECCION B - CONTABILIDAD GENERAL",
        "CLAVEMODULO": "308",
        "CLAVEPLANESTUDIOS": "PLAN-ADM-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 40,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "509",
        "ABREVIATURA": "A",
        "DENOMINACION": "SECCION A - INVESTIGACION DE OPERACIONES",
        "CLAVEMODULO": "309",
        "CLAVEPLANESTUDIOS": "PLAN-IND-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
    },
    {
        "CLAVE": "510",
        "ABREVIATURA": "B",
        "DENOMINACION": "SECCION B - GESTION DE PROCESOS",
        "CLAVEMODULO": "310",
        "CLAVEPLANESTUDIOS": "PLAN-IND-2026",
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOTIPOOBJETO": "SE",
        "VIGENCIA": 1,
        "CODIGOTIPOOBJETO": "SE",
    },
]


# ============================================================
# EVENTOS
#
# Cada EVENTO pertenece a un PAQUETEEVENTOS.
# ============================================================

eventos = [
    {
        "CLAVE": "801",
        "ABREVIATURA": "IA301-A",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "INTELIGENCIA ARTIFICIAL - A",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "CODIGOSAPDOCENTE": "900001",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "501",
    },
    {
        "CLAVE": "802",
        "ABREVIATURA": "BD302-B",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "BASE DE DATOS - B",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "CODIGOSAPDOCENTE": "900002",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "502",
    },
    {
        "CLAVE": "803",
        "ABREVIATURA": "PW303-A",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "PROGRAMACION WEB - A",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 30,
        "CODIGOSAPDOCENTE": "900003",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "503",
    },
    {
        "CLAVE": "804",
        "ABREVIATURA": "RC304-B",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "REDES DE COMPUTADORAS - B",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 30,
        "CODIGOSAPDOCENTE": "900003",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "504",
    },
    {
        "CLAVE": "805",
        "ABREVIATURA": "ML305-A",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "MACHINE LEARNING - A",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 30,
        "CODIGOSAPDOCENTE": "900004",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "505",
    },
    {
        "CLAVE": "806",
        "ABREVIATURA": "EA306-B",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "ESTADISTICA APLICADA - B",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "CODIGOSAPDOCENTE": "900004",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "506",
    },
    {
        "CLAVE": "807",
        "ABREVIATURA": "GE307-A",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "GESTION EMPRESARIAL - A",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 40,
        "CODIGOSAPDOCENTE": "900005",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "507",
    },
    {
        "CLAVE": "808",
        "ABREVIATURA": "CG308-B",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "CONTABILIDAD GENERAL - B",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 40,
        "CODIGOSAPDOCENTE": "900005",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "508",
    },
    {
        "CLAVE": "809",
        "ABREVIATURA": "IO309-A",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "INVESTIGACION DE OPERACIONES - A",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "CODIGOSAPDOCENTE": "900001",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "509",
    },
    {
        "CLAVE": "810",
        "ABREVIATURA": "GP310-B",
        "TIPOEVENTO": "CLASE",
        "DENOMINACION": "GESTION DE PROCESOS - B",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "INSCRIPCIONES": 2,
        "CAPACIDADMAXIMA": 35,
        "CODIGOSAPDOCENTE": "900002",
        "CODIGOTIPOOBJETO": "E",
        "VIGENCIA": 1,
        "clavepaqueteevento": "510",
    },
]


# ============================================================
# AULAS
# ============================================================

aulas = [
    {
        "CLAVE": "AULA001",
        "CODIGO": "LAB-302",
        "DENOMINACION": "Laboratorio de Cómputo 302",
        "CODIGOPABELLON": "PAB-A",
        "CAPACIDAD": 35,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA002",
        "CODIGO": "LAB-303",
        "DENOMINACION": "Laboratorio de Cómputo 303",
        "CODIGOPABELLON": "PAB-A",
        "CAPACIDAD": 35,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA003",
        "CODIGO": "LAB-401",
        "DENOMINACION": "Laboratorio de Software 401",
        "CODIGOPABELLON": "PAB-B",
        "CAPACIDAD": 30,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA004",
        "CODIGO": "LAB-402",
        "DENOMINACION": "Laboratorio de Redes 402",
        "CODIGOPABELLON": "PAB-B",
        "CAPACIDAD": 30,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA005",
        "CODIGO": "LAB-501",
        "DENOMINACION": "Laboratorio de Ciencia de Datos 501",
        "CODIGOPABELLON": "PAB-C",
        "CAPACIDAD": 30,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA006",
        "CODIGO": "AULA-502",
        "DENOMINACION": "Aula de Ciencias 502",
        "CODIGOPABELLON": "PAB-C",
        "CAPACIDAD": 35,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA007",
        "CODIGO": "AULA-201",
        "DENOMINACION": "Aula de Administración 201",
        "CODIGOPABELLON": "PAB-D",
        "CAPACIDAD": 40,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA008",
        "CODIGO": "AULA-202",
        "DENOMINACION": "Aula de Administración 202",
        "CODIGOPABELLON": "PAB-D",
        "CAPACIDAD": 40,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA009",
        "CODIGO": "AULA-601",
        "DENOMINACION": "Aula de Ingeniería Industrial 601",
        "CODIGOPABELLON": "PAB-E",
        "CAPACIDAD": 35,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
    {
        "CLAVE": "AULA010",
        "CODIGO": "AULA-602",
        "DENOMINACION": "Aula de Ingeniería Industrial 602",
        "CODIGOPABELLON": "PAB-E",
        "CAPACIDAD": 35,
        "VIGENCIA": 1,
        "MULTIPLE": 0,
        "virtual": 0,
    },
]


# ============================================================
# MATRICULA
#
# Los 10 estudiantes tienen al menos una matrícula.
# Varios tienen dos para probar múltiples cursos.
# ============================================================

matriculas = [

    # --------------------------------------------------------
    # JUAN - SISTEMAS
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260001",
        "CLAVEPAQUETEEVENTOS": "501",
        "CLAVEPLANESTUDIOS": "PLAN-SIS-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260001",
        "CLAVEPAQUETEEVENTOS": "502",
        "CLAVEPLANESTUDIOS": "PLAN-SIS-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # MARIA - SISTEMAS
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260002",
        "CLAVEPAQUETEEVENTOS": "502",
        "CLAVEPLANESTUDIOS": "PLAN-SIS-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260002",
        "CLAVEPAQUETEEVENTOS": "501",
        "CLAVEPLANESTUDIOS": "PLAN-SIS-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # CARLOS - SOFTWARE
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260003",
        "CLAVEPAQUETEEVENTOS": "503",
        "CLAVEPLANESTUDIOS": "PLAN-IDS-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260003",
        "CLAVEPAQUETEEVENTOS": "504",
        "CLAVEPLANESTUDIOS": "PLAN-IDS-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # ANA - SOFTWARE
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260004",
        "CLAVEPAQUETEEVENTOS": "504",
        "CLAVEPLANESTUDIOS": "PLAN-IDS-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260004",
        "CLAVEPAQUETEEVENTOS": "503",
        "CLAVEPLANESTUDIOS": "PLAN-IDS-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # LUIS - CIENCIA DE DATOS
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260005",
        "CLAVEPAQUETEEVENTOS": "505",
        "CLAVEPLANESTUDIOS": "PLAN-CD-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260005",
        "CLAVEPAQUETEEVENTOS": "506",
        "CLAVEPLANESTUDIOS": "PLAN-CD-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # ROSA - CIENCIA DE DATOS
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260006",
        "CLAVEPAQUETEEVENTOS": "506",
        "CLAVEPLANESTUDIOS": "PLAN-CD-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260006",
        "CLAVEPAQUETEEVENTOS": "505",
        "CLAVEPLANESTUDIOS": "PLAN-CD-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # PEDRO - ADMINISTRACION
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260007",
        "CLAVEPAQUETEEVENTOS": "507",
        "CLAVEPLANESTUDIOS": "PLAN-ADM-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260007",
        "CLAVEPAQUETEEVENTOS": "508",
        "CLAVEPLANESTUDIOS": "PLAN-ADM-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # CARMEN - ADMINISTRACION
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260008",
        "CLAVEPAQUETEEVENTOS": "508",
        "CLAVEPLANESTUDIOS": "PLAN-ADM-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260008",
        "CLAVEPAQUETEEVENTOS": "507",
        "CLAVEPLANESTUDIOS": "PLAN-ADM-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # DIEGO - INDUSTRIAL
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260009",
        "CLAVEPAQUETEEVENTOS": "509",
        "CLAVEPLANESTUDIOS": "PLAN-IND-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260009",
        "CLAVEPAQUETEEVENTOS": "510",
        "CLAVEPLANESTUDIOS": "PLAN-IND-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },

    # --------------------------------------------------------
    # SOFIA - INDUSTRIAL
    # --------------------------------------------------------

    {
        "CODIGOSAP": "20260010",
        "CLAVEPAQUETEEVENTOS": "510",
        "CLAVEPLANESTUDIOS": "PLAN-IND-2026",
        "ABREVIATURAPAQUETEEVENTOS": "B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
    {
        "CODIGOSAP": "20260010",
        "CLAVEPAQUETEEVENTOS": "509",
        "CLAVEPLANESTUDIOS": "PLAN-IND-2026",
        "ABREVIATURAPAQUETEEVENTOS": "A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "VIGENCIA": 1,
    },
]


# ============================================================
# OFERTA
#
# Aquí tenemos:
#
#   evento
#   docente
#   aula
#   día
#   hora inicio
#   hora fin
#
# CODIGODIA:
#
#   1 = Lunes
#   2 = Martes
#   3 = Miércoles
#   4 = Jueves
#   5 = Viernes
#   6 = Sábado
#
# ============================================================

ofertas = [

    # ========================================================
    # LUNES
    # ========================================================

    {
        "CONSECUTIVOOFERTA": "1001",
        "CLAVEEVENTO": "801",
        "ABREVIATURAEVENTO": "IA301-A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "LAB-302",
        "CODIGOSAPDOCENTE": "900001",
        "CODIGODIA": 1,
        "HORAINICIO": "08:00",
        "HORAFIN": "10:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },
    {
        "CONSECUTIVOOFERTA": "1002",
        "CLAVEEVENTO": "802",
        "ABREVIATURAEVENTO": "BD302-B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "LAB-303",
        "CODIGOSAPDOCENTE": "900002",
        "CODIGODIA": 1,
        "HORAINICIO": "10:00",
        "HORAFIN": "12:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },

    # ========================================================
    # MARTES
    # ========================================================

    {
        "CONSECUTIVOOFERTA": "1003",
        "CLAVEEVENTO": "803",
        "ABREVIATURAEVENTO": "PW303-A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "LAB-401",
        "CODIGOSAPDOCENTE": "900003",
        "CODIGODIA": 2,
        "HORAINICIO": "08:00",
        "HORAFIN": "10:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },
    {
        "CONSECUTIVOOFERTA": "1004",
        "CLAVEEVENTO": "804",
        "ABREVIATURAEVENTO": "RC304-B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "LAB-402",
        "CODIGOSAPDOCENTE": "900003",
        "CODIGODIA": 2,
        "HORAINICIO": "10:00",
        "HORAFIN": "12:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },

    # ========================================================
    # MIERCOLES
    # ========================================================

    {
        "CONSECUTIVOOFERTA": "1005",
        "CLAVEEVENTO": "805",
        "ABREVIATURAEVENTO": "ML305-A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "LAB-501",
        "CODIGOSAPDOCENTE": "900004",
        "CODIGODIA": 3,
        "HORAINICIO": "08:00",
        "HORAFIN": "10:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },
    {
        "CONSECUTIVOOFERTA": "1006",
        "CLAVEEVENTO": "806",
        "ABREVIATURAEVENTO": "EA306-B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "AULA-502",
        "CODIGOSAPDOCENTE": "900004",
        "CODIGODIA": 3,
        "HORAINICIO": "10:00",
        "HORAFIN": "12:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },

    # ========================================================
    # JUEVES
    # ========================================================

    {
        "CONSECUTIVOOFERTA": "1007",
        "CLAVEEVENTO": "807",
        "ABREVIATURAEVENTO": "GE307-A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "AULA-201",
        "CODIGOSAPDOCENTE": "900005",
        "CODIGODIA": 4,
        "HORAINICIO": "08:00",
        "HORAFIN": "10:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },
    {
        "CONSECUTIVOOFERTA": "1008",
        "CLAVEEVENTO": "808",
        "ABREVIATURAEVENTO": "CG308-B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "AULA-202",
        "CODIGOSAPDOCENTE": "900005",
        "CODIGODIA": 4,
        "HORAINICIO": "10:00",
        "HORAFIN": "12:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },

    # ========================================================
    # VIERNES
    # ========================================================

    {
        "CONSECUTIVOOFERTA": "1009",
        "CLAVEEVENTO": "809",
        "ABREVIATURAEVENTO": "IO309-A",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "AULA-601",
        "CODIGOSAPDOCENTE": "900001",
        "CODIGODIA": 5,
        "HORAINICIO": "08:00",
        "HORAFIN": "10:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },
    {
        "CONSECUTIVOOFERTA": "1010",
        "CLAVEEVENTO": "810",
        "ABREVIATURAEVENTO": "GP310-B",
        "ANO": 2026,
        "SEMESTRE": 1,
        "CODIGOAULA": "AULA-602",
        "CODIGOSAPDOCENTE": "900002",
        "CODIGODIA": 5,
        "HORAINICIO": "10:00",
        "HORAFIN": "12:00",
        "CODIGOTURNO": "M",
        "VIGENCIA": 1,
    },
]


# ============================================================
# ESTADO DE ASISTENCIA
# ============================================================

estados_asistencia = [
    {
        "CODIGO": "A",
        "DESCRIPCION": "ASISTIO",
        "VIGENCIA": 1,
        "concepto": "Asistencia registrada dentro del horario permitido",
    },
    {
        "CODIGO": "T",
        "DESCRIPCION": "TARDANZA",
        "VIGENCIA": 1,
        "concepto": "Registro posterior al inicio de clase",
    },
    {
        "CODIGO": "F",
        "DESCRIPCION": "FALTA",
        "VIGENCIA": 1,
        "concepto": "No registró asistencia",
    },
]


# ============================================================
# ASISTENCIA_ALUMNO
#
# Inicialmente vacío.
# Durante las pruebas se agregarán registros.
# ============================================================

asistencia_alumno = []


# ============================================================
# ASISTENCIA DOCENTE
#
# Simula marcaciondocente.
# ============================================================

marcaciondocente = []


# ============================================================
# TERMINALES / TABLETS
#
# Esto todavía no corresponde necesariamente a SAP.
# Se incluye solamente para poder probar el flujo completo
# del proyecto.
#
# Una tablet está asociada a un aula.
# ============================================================

terminales = [
    # ========================================================
    # CONFIGURACIÓN FÍSICA DE TABLETS
    #
    # La asociación TERMINAL -> AULA es fija.
    # PABELLON/PISO representan infraestructura física de la
    # terminal y no sustituyen los campos de SAP.
    # ========================================================
    {
        "CODIGO": "TAB-001",
        "NOMBRE": "Tablet 01 - Terminal Biométrico",
        "CODIGOAULA": "AULA-101",
        "PABELLON": "PAB-INFO",
        "PABELLON_NOMBRE": "Pabellón de Informática",
        "PISO": "1",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-002",
        "NOMBRE": "Tablet 02 - Terminal Biométrico",
        "CODIGOAULA": "AULA-201",
        "PABELLON": "PAB-INFO",
        "PABELLON_NOMBRE": "Pabellón de Informática",
        "PISO": "2",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-003",
        "NOMBRE": "Tablet 03 - Terminal Biométrico",
        "CODIGOAULA": "AULA-202",
        "PABELLON": "PAB-INFO",
        "PABELLON_NOMBRE": "Pabellón de Informática",
        "PISO": "2",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },

    # Terminales que ya existían en el entorno de pruebas.
    {
        "CODIGO": "TAB-302",
        "NOMBRE": "Terminal Biométrico LAB-302",
        "CODIGOAULA": "LAB-302",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-303",
        "NOMBRE": "Terminal Biométrico LAB-303",
        "CODIGOAULA": "LAB-303",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-401",
        "NOMBRE": "Terminal Biométrico LAB-401",
        "CODIGOAULA": "LAB-401",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-402",
        "NOMBRE": "Terminal Biométrico LAB-402",
        "CODIGOAULA": "LAB-402",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-501",
        "NOMBRE": "Terminal Biométrico LAB-501",
        "CODIGOAULA": "LAB-501",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-502",
        "NOMBRE": "Terminal Biométrico AULA-502",
        "CODIGOAULA": "AULA-502",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-201",
        "NOMBRE": "Terminal Biométrico AULA-201",
        "CODIGOAULA": "AULA-201",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-202",
        "NOMBRE": "Terminal Biométrico AULA-202",
        "CODIGOAULA": "AULA-202",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-601",
        "NOMBRE": "Terminal Biométrico AULA-601",
        "CODIGOAULA": "AULA-601",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
    {
        "CODIGO": "TAB-602",
        "NOMBRE": "Terminal Biométrico AULA-602",
        "CODIGOAULA": "AULA-602",
        "TIPO": "TABLET",
        "ESTADO": "ACTIVO",
    },
]


# ============================================================
# FUNCIONES AUXILIARES BÁSICAS
# ============================================================

def obtener_persona(codigosap: str):
    """
    Busca una persona por CODIGOSAP.
    """

    return next(
        (
            persona
            for persona in personas
            if persona["CODIGOSAP"] == str(codigosap)
            and persona["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_estudiante(codigosap: str):
    """
    Busca el registro estudiante mediante CODIGOSAP.
    """

    return next(
        (
            estudiante
            for estudiante in estudiantes
            if estudiante["CODIGOSAP"] == str(codigosap)
            and estudiante["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_docente(codigosap: str):
    """
    Busca el registro docente mediante CODIGOSAP.
    """

    return next(
        (
            docente
            for docente in docentes
            if docente["CODIGOSAP"] == str(codigosap)
            and docente["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_modulo(clave: str):
    """
    Busca un módulo/curso por CLAVE.
    """

    return next(
        (
            modulo
            for modulo in modulos
            if modulo["CLAVE"] == str(clave)
            and modulo["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_plan_estudio(clave: str):
    """
    Busca el plan de estudios/carrera.
    """

    return next(
        (
            plan
            for plan in planes_estudio
            if plan["CLAVE"] == str(clave)
            and plan["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_paquete(clave: str):
    """
    Busca PAQUETEEVENTOS.

    En nuestro modelo:
        PAQUETEEVENTOS = SECCIÓN
    """

    return next(
        (
            paquete
            for paquete in paqueteeventos
            if paquete["CLAVE"] == str(clave)
            and paquete["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_evento(clave: str):
    """
    Busca un EVENTO.
    """

    return next(
        (
            evento
            for evento in eventos
            if evento["CLAVE"] == str(clave)
            and evento["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_aula(codigo: str):
    """
    Busca aula mediante CODIGO.
    """

    return next(
        (
            aula
            for aula in aulas
            if aula["CODIGO"] == str(codigo)
            and aula["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_pabellon(codigo: str):
    """
    Busca pabellón mediante CODIGO.
    """

    return next(
        (
            pabellon
            for pabellon in pabellones
            if pabellon["CODIGO"] == str(codigo)
            and pabellon["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_oferta(consecutivo: str):
    """
    Busca oferta/horario.
    """

    return next(
        (
            oferta
            for oferta in ofertas
            if oferta["CONSECUTIVOOFERTA"] == str(consecutivo)
            and oferta["VIGENCIA"] == 1
        ),
        None,
    )


def obtener_terminal(codigo: str):
    """
    Busca una tablet/terminal.
    """

    return next(
        (
            terminal
            for terminal in terminales
            if terminal["CODIGO"] == str(codigo)
            and terminal["ESTADO"] == "ACTIVO"
        ),
        None,
    )


def obtener_matriculas_estudiante(codigosap: str):
    """
    Obtiene todas las matrículas activas de un estudiante.
    """

    return [
        matricula
        for matricula in matriculas
        if matricula["CODIGOSAP"] == str(codigosap)
        and matricula["VIGENCIA"] == 1
    ]


def obtener_nombre_persona(codigosap: str):
    """
    Obtiene nombre completo desde PERSONA.
    """

    persona = obtener_persona(codigosap)

    if not persona:
        return None

    return (
        f'{persona["NOMBRES"]} '
        f'{persona["APELLIDOPATERNO"]} '
        f'{persona["APELLIDOMATERNO"]}'
    )


def obtener_carrera_estudiante(codigosap: str):
    """
    Obtiene la carrera mediante:

        estudiante
            ↓
        CLAVEPLANESTUDIOS
            ↓
        plan_estudio
    """

    estudiante = obtener_estudiante(codigosap)

    if not estudiante:
        return None

    plan = obtener_plan_estudio(
        estudiante["CLAVEPLANESTUDIOS"]
    )

    if not plan:
        return None

    return plan


def obtener_horarios_estudiante(codigosap: str):
    """
    Reconstruye los horarios de un estudiante.

    Flujo:

        PERSONA
          ↓
        ESTUDIANTE
          ↓
        MATRICULA
          ↓
        PAQUETEEVENTOS
          ↓
        MODULO
          ↓
        EVENTO
          ↓
        OFERTA
          ↓
        AULA
          ↓
        PABELLON
    """

    resultado = []

    estudiante = obtener_estudiante(codigosap)

    if not estudiante:
        return resultado

    plan = obtener_plan_estudio(
        estudiante["CLAVEPLANESTUDIOS"]
    )

    matriculas_estudiante = (
        obtener_matriculas_estudiante(codigosap)
    )

    for matricula in matriculas_estudiante:

        paquete = obtener_paquete(
            matricula["CLAVEPAQUETEEVENTOS"]
        )

        if not paquete:
            continue

        # Validar plan de estudios
        if (
            paquete["CLAVEPLANESTUDIOS"]
            != matricula["CLAVEPLANESTUDIOS"]
        ):
            continue

        # Validar periodo
        if paquete["ANO"] != matricula["ANO"]:
            continue

        if paquete["SEMESTRE"] != matricula["SEMESTRE"]:
            continue

        modulo = obtener_modulo(
            paquete["CLAVEMODULO"]
        )

        for evento in eventos:

            if (
                evento["clavepaqueteevento"]
                != paquete["CLAVE"]
            ):
                continue

            if evento["ANO"] != matricula["ANO"]:
                continue

            if evento["SEMESTRE"] != matricula["SEMESTRE"]:
                continue

            for oferta in ofertas:

                if (
                    oferta["CLAVEEVENTO"]
                    != evento["CLAVE"]
                ):
                    continue

                if oferta["ANO"] != matricula["ANO"]:
                    continue

                if oferta["SEMESTRE"] != matricula["SEMESTRE"]:
                    continue

                aula = obtener_aula(
                    oferta["CODIGOAULA"]
                )

                pabellon = None

                if aula:
                    pabellon = obtener_pabellon(
                        aula["CODIGOPABELLON"]
                    )

                docente_persona = obtener_persona(
                    oferta["CODIGOSAPDOCENTE"]
                )

                nombre_docente = None

                if docente_persona:
                    nombre_docente = (
                        f'{docente_persona["NOMBRES"]} '
                        f'{docente_persona["APELLIDOPATERNO"]} '
                        f'{docente_persona["APELLIDOMATERNO"]}'
                    )

                resultado.append(
                    {
                        "CODIGOSAP": codigosap,

                        "CLAVEPLANESTUDIOS": (
                            matricula[
                                "CLAVEPLANESTUDIOS"
                            ]
                        ),

                        "CARRERA": (
                            plan["DENOMINACION"]
                            if plan
                            else None
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

                        "CLAVEMODULO": (
                            paquete["CLAVEMODULO"]
                        ),

                        "CODIGOMODULO": (
                            modulo["CODIGO"]
                            if modulo
                            else None
                        ),

                        "MODULO": (
                            modulo["DENOMINACION"]
                            if modulo
                            else None
                        ),

                        "CLAVEEVENTO": (
                            evento["CLAVE"]
                        ),

                        "EVENTO": (
                            evento["DENOMINACION"]
                        ),

                        "CONSECUTIVOOFERTA": (
                            oferta[
                                "CONSECUTIVOOFERTA"
                            ]
                        ),

                        "CODIGOSAPDOCENTE": (
                            oferta[
                                "CODIGOSAPDOCENTE"
                            ]
                        ),

                        "DOCENTE": nombre_docente,

                        "CODIGOAULA": (
                            oferta["CODIGOAULA"]
                        ),

                        "AULA": (
                            aula["DENOMINACION"]
                            if aula
                            else None
                        ),

                        "CODIGOPABELLON": (
                            aula["CODIGOPABELLON"]
                            if aula
                            else None
                        ),

                        "PABELLON": (
                            pabellon["DENOMINACION"]
                            if pabellon
                            else None
                        ),

                        "CODIGODIA": (
                            oferta["CODIGODIA"]
                        ),

                        "HORAINICIO": (
                            oferta["HORAINICIO"]
                        ),

                        "HORAFIN": (
                            oferta["HORAFIN"]
                        ),

                        "CODIGOTURNO": (
                            oferta["CODIGOTURNO"]
                        ),

                        "ANO": oferta["ANO"],

                        "SEMESTRE": oferta["SEMESTRE"],

                        "VIGENCIA": oferta["VIGENCIA"],
                    }
                )

    return resultado


def obtener_ofertas_aula(codigo_aula: str):
    """
    Obtiene todas las ofertas de una determinada aula.
    """

    return [
        oferta
        for oferta in ofertas
        if oferta["CODIGOAULA"] == codigo_aula
        and oferta["VIGENCIA"] == 1
    ]


def obtener_evento_de_oferta(consecutivo_oferta: str):
    """
    Oferta → Evento → Paquete/Sección.
    """

    oferta = obtener_oferta(
        consecutivo_oferta
    )

    if not oferta:
        return None

    evento = obtener_evento(
        oferta["CLAVEEVENTO"]
    )

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


def estudiante_matriculado_en_oferta(
    codigosap: str,
    consecutivo_oferta: str,
):
    """
    Determina si un estudiante está matriculado
    en el evento/oferta correspondiente.
    """

    oferta = obtener_oferta(
        consecutivo_oferta
    )

    if not oferta:
        return False

    datos = obtener_evento_de_oferta(
        consecutivo_oferta
    )

    if not datos:
        return False

    paquete = datos["paquete"]

    if not paquete:
        return False

    matriculas_estudiante = (
        obtener_matriculas_estudiante(
            codigosap
        )
    )

    for matricula in matriculas_estudiante:

        if (
            matricula["CLAVEPAQUETEEVENTOS"]
            != paquete["CLAVE"]
        ):
            continue

        if matricula["ANO"] != oferta["ANO"]:
            continue

        if matricula["SEMESTRE"] != oferta["SEMESTRE"]:
            continue

        return True

    return False


def obtener_clases_del_aula(codigo_aula: str):
    """
    Devuelve las clases programadas en un aula.
    """

    resultado = []

    for oferta in obtener_ofertas_aula(
        codigo_aula
    ):

        datos = obtener_evento_de_oferta(
            oferta["CONSECUTIVOOFERTA"]
        )

        if not datos:
            continue

        evento = datos["evento"]
        paquete = datos["paquete"]

        modulo = None

        if paquete:
            modulo = obtener_modulo(
                paquete["CLAVEMODULO"]
            )

        resultado.append(
            {
                "CONSECUTIVOOFERTA": (
                    oferta["CONSECUTIVOOFERTA"]
                ),
                "CLAVEEVENTO": (
                    evento["CLAVE"]
                ),
                "EVENTO": (
                    evento["DENOMINACION"]
                ),
                "CLAVEPAQUETEEVENTOS": (
                    paquete["CLAVE"]
                    if paquete
                    else None
                ),
                "SECCION": (
                    paquete["ABREVIATURA"]
                    if paquete
                    else None
                ),
                "CLAVEMODULO": (
                    paquete["CLAVEMODULO"]
                    if paquete
                    else None
                ),
                "MODULO": (
                    modulo["DENOMINACION"]
                    if modulo
                    else None
                ),
                "CODIGOSAPDOCENTE": (
                    oferta[
                        "CODIGOSAPDOCENTE"
                    ]
                ),
                "CODIGOAULA": (
                    oferta["CODIGOAULA"]
                ),
                "CODIGODIA": (
                    oferta["CODIGODIA"]
                ),
                "HORAINICIO": (
                    oferta["HORAINICIO"]
                ),
                "HORAFIN": (
                    oferta["HORAFIN"]
                ),
                "ANO": oferta["ANO"],
                "SEMESTRE": oferta["SEMESTRE"],
            }
        )

    return resultado


def obtener_personas_estudiantes():
    """
    Devuelve estudiantes combinando:

        PERSONA + ESTUDIANTE
    """

    resultado = []

    for estudiante in estudiantes:

        if estudiante["VIGENCIA"] != 1:
            continue

        persona = obtener_persona(
            estudiante["CODIGOSAP"]
        )

        if not persona:
            continue

        plan = obtener_plan_estudio(
            estudiante["CLAVEPLANESTUDIOS"]
        )

        resultado.append(
            {
                "CODIGOSAP": (
                    estudiante["CODIGOSAP"]
                ),

                "DNI": persona["DNI"],

                "NOMBRES": (
                    persona["NOMBRES"]
                ),

                "APELLIDOPATERNO": (
                    persona["APELLIDOPATERNO"]
                ),

                "APELLIDOMATERNO": (
                    persona["APELLIDOMATERNO"]
                ),

                "NOMBRECOMPLETO": (
                    f'{persona["NOMBRES"]} '
                    f'{persona["APELLIDOPATERNO"]} '
                    f'{persona["APELLIDOMATERNO"]}'
                ),

                "CLAVEPLANESTUDIOS": (
                    estudiante[
                        "CLAVEPLANESTUDIOS"
                    ]
                ),

                "CARRERA": (
                    plan["DENOMINACION"]
                    if plan
                    else None
                ),

                "CODIGOESTADOESTUDIANTE": (
                    estudiante[
                        "CODIGOESTADOESTUDIANTE"
                    ]
                ),

                "VIGENCIA": estudiante["VIGENCIA"],
            }
        )

    return resultado


def obtener_personas_docentes():
    """
    Devuelve docentes combinando:

        PERSONA + DOCENTE
    """

    resultado = []

    for docente in docentes:

        if docente["VIGENCIA"] != 1:
            continue

        persona = obtener_persona(
            docente["CODIGOSAP"]
        )

        if not persona:
            continue

        resultado.append(
            {
                "CODIGOSAP": (
                    docente["CODIGOSAP"]
                ),

                "DNI": persona["DNI"],

                "NOMBRES": (
                    persona["NOMBRES"]
                ),

                "APELLIDOPATERNO": (
                    persona["APELLIDOPATERNO"]
                ),

                "APELLIDOMATERNO": (
                    persona["APELLIDOMATERNO"]
                ),

                "NOMBRECOMPLETO": (
                    f'{persona["NOMBRES"]} '
                    f'{persona["APELLIDOPATERNO"]} '
                    f'{persona["APELLIDOMATERNO"]}'
                ),

                "VIGENCIA": docente["VIGENCIA"],
            }
        )

    return resultado