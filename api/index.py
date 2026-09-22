import json
import os
import time
from typing import Any, Optional
from datetime import datetime

import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

from insightface.app import FaceAnalysis


# ============================================================
# CONFIGURACIÓN
# ============================================================

app = FastAPI(
    title="Asistencia Universitaria - IA Facial",
    version="2.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ],
    allow_origin_regex=r"https?://(([a-zA-Z0-9-]+\.)?vercel\.app|localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ALMACENAMIENTO TEMPORAL
# ============================================================

registered_people: list[dict[str, Any]] = []

# Persistencia local de embeddings faciales.
# Esta capa mantiene los registros después de reiniciar FastAPI.
# Más adelante puede migrarse a MySQL/SAP para producción.
from api.facial_database import (
    init_database,
    save_embedding,
    get_all_embeddings,
    delete_embedding,
)

init_database()


# ============================================================
# MODELO DE DETECCIÓN
# ============================================================

print("=" * 60)
print("Inicializando modelo de DETECCIÓN...")
print("=" * 60)


detector = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection"],
    providers=["CPUExecutionProvider"],
)


detector.prepare(
    ctx_id=-1,
    det_size=(320, 320),
)


print("Detector facial listo.")


# ============================================================
# MODELO DE RECONOCIMIENTO
# ============================================================

print("=" * 60)
print("Inicializando modelo de RECONOCIMIENTO...")
print("=" * 60)


recognizer = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=[
        "detection",
        "recognition",
    ],
    providers=["CPUExecutionProvider"],
)


recognizer.prepare(
    ctx_id=-1,
    det_size=(320, 320),
)


print("Reconocedor facial listo.")
print("=" * 60)

# ============================================================
# DECODIFICAR IMAGEN
# ============================================================

def decode_image(contents: bytes):

    if not contents:
        return None

    image_array = np.frombuffer(
        contents,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR,
    )

    return image


# ============================================================
# REDIMENSIONAR IMAGEN
# ============================================================

def resize_for_detection(
    image: np.ndarray,
    max_side: int = 640,
):

    height, width = image.shape[:2]

    largest_side = max(
        int(width),
        int(height),
    )

    if largest_side <= max_side:
        return image, 1.0

    scale = float(
        max_side / largest_side
    )

    new_width = max(
        1,
        int(width * scale),
    )

    new_height = max(
        1,
        int(height * scale),
    )

    resized = cv2.resize(
        image,
        (
            new_width,
            new_height,
        ),
        interpolation=cv2.INTER_AREA,
    )

    return resized, scale


# ============================================================
# DETECCIÓN FACIAL
# ============================================================

def detect_faces(
    image: np.ndarray,
):

    original_height = int(
        image.shape[0]
    )

    original_width = int(
        image.shape[1]
    )

    processed_image, scale = (
        resize_for_detection(
            image,
            max_side=640,
        )
    )

    faces = detector.get(
        processed_image
    )

    results = []

    for face in faces:

        bbox = np.asarray(
            face.bbox,
            dtype=np.float32,
        )

        x1 = float(bbox[0])
        y1 = float(bbox[1])
        x2 = float(bbox[2])
        y2 = float(bbox[3])

        # ----------------------------------------------------
        # Volver a las coordenadas originales
        # ----------------------------------------------------

        if scale != 1.0:

            x1 /= scale
            y1 /= scale
            x2 /= scale
            y2 /= scale

        # ----------------------------------------------------
        # Convertir explícitamente a int Python
        # ----------------------------------------------------

        x1 = int(round(x1))
        y1 = int(round(y1))
        x2 = int(round(x2))
        y2 = int(round(y2))

        # ----------------------------------------------------
        # Limitar coordenadas
        # ----------------------------------------------------

        x1 = max(
            0,
            min(
                x1,
                original_width,
            ),
        )

        y1 = max(
            0,
            min(
                y1,
                original_height,
            ),
        )

        x2 = max(
            0,
            min(
                x2,
                original_width,
            ),
        )

        y2 = max(
            0,
            min(
                y2,
                original_height,
            ),
        )

        width = int(
            max(
                0,
                x2 - x1,
            )
        )

        height = int(
            max(
                0,
                y2 - y1,
            )
        )

        confidence = float(
            face.det_score
        )

        results.append(
            {
                "x": int(x1),
                "y": int(y1),
                "width": int(width),
                "height": int(height),
                "confidence": float(
                    round(
                        confidence,
                        4,
                    )
                ),
            }
        )

    return results


# ============================================================
# ROSTROS PARA RECONOCIMIENTO
# ============================================================

def get_recognition_faces(
    image: np.ndarray,
):

    processed_image, scale = (
        resize_for_detection(
            image,
            max_side=640,
        )
    )

    faces = recognizer.get(
        processed_image
    )

    return (
        faces,
        processed_image,
        scale,
    )


# ============================================================
# OBTENER EMBEDDING
# ============================================================

def get_embedding(face):

    embedding = getattr(
        face,
        "normed_embedding",
        None,
    )

    if embedding is None:

        embedding = getattr(
            face,
            "embedding",
            None,
        )

    if embedding is None:
        return None

    embedding = np.asarray(
        embedding,
        dtype=np.float32,
    )

    norm = float(
        np.linalg.norm(
            embedding
        )
    )

    if norm == 0:
        return None

    embedding = embedding / norm

    return embedding


# ============================================================
# CARGAR EMBEDDINGS PERSISTENTES
# ============================================================

def load_registered_people():
    """Carga los embeddings guardados en SQLite al iniciar FastAPI."""
    global registered_people

    registered_people.clear()

    records = get_all_embeddings()

    for record in records:
        try:
            embedding = np.asarray(
                json.loads(record["embedding"]),
                dtype=np.float32,
            )

            registered_people.append(
                {
                    "person_id": str(record["person_id"]),
                    "name": str(record["name"]),
                    "person_type": str(record["person_type"]),
                    "embedding": embedding.tolist(),
                }
            )

        except Exception as error:
            print(
                f"[WARNING] No se pudo cargar el rostro "
                f"{record.get('person_id')}: {error}"
            )

    print(
        f"[DATABASE] {len(registered_people)} "
        f"rostros cargados."
    )


# Recuperar embeddings después de definir la función de carga.
load_registered_people()


# ============================================================
# SIMILITUD COSENO
# ============================================================

def cosine_similarity(
    embedding_a: np.ndarray,
    embedding_b: np.ndarray,
):

    norm_a = float(
        np.linalg.norm(
            embedding_a
        )
    )

    norm_b = float(
        np.linalg.norm(
            embedding_b
        )
    )

    if norm_a == 0 or norm_b == 0:
        return 0.0

    a = (
        embedding_a / norm_a
    )

    b = (
        embedding_b / norm_b
    )

    similarity = float(
        np.dot(
            a,
            b,
        )
    )

    return similarity


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health():

    return {
        "success": True,
        "message": "Motor de IA funcionando",
        "detector": "InsightFace SCRFD",
        "recognizer": "InsightFace buffalo_l",
        "mode": "detection + recognition",
        "registered_people": int(
            len(
                registered_people
            )
        ),
    }


# ============================================================
# DETECCIÓN DE IMAGEN
# ============================================================

@app.post("/api/detect")
async def detect_image(
    file: UploadFile = File(...),
):

    start_time = time.perf_counter()

    try:

        # ----------------------------------------------------
        # Leer archivo
        # ----------------------------------------------------

        contents = await file.read()

        if not contents:

            return {
                "success": False,
                "message": "El archivo está vacío.",
                "faces_detected": 0,
                "faces": [],
            }

        # ----------------------------------------------------
        # Decodificar
        # ----------------------------------------------------

        image = decode_image(
            contents
        )

        if image is None:

            return {
                "success": False,
                "message": (
                    "No se pudo procesar "
                    "la imagen."
                ),
                "faces_detected": 0,
                "faces": [],
            }

        # ----------------------------------------------------
        # Detectar rostros
        # ----------------------------------------------------

        faces = detect_faces(
            image
        )

        # ----------------------------------------------------
        # Tiempo
        # ----------------------------------------------------

        elapsed = float(
            time.perf_counter()
            - start_time
        )

        print(
            f"[DETECT] "
            f"{len(faces)} rostros | "
            f"{elapsed:.3f} segundos | "
            f"{file.filename}"
        )

        # ----------------------------------------------------
        # Respuesta
        # ----------------------------------------------------

        return {
            "success": True,
            "faces_detected": int(
                len(faces)
            ),
            "faces": faces,
            "processing_time_ms": float(
                round(
                    elapsed * 1000,
                    2,
                )
            ),
            "processing_time_seconds": float(
                round(
                    elapsed,
                    3,
                )
            ),
        }

    except Exception as e:

        print(
            "[ERROR /api/detect]",
            str(e),
        )

        return {
            "success": False,
            "message": (
                "Error procesando "
                "la imagen."
            ),
            "faces_detected": 0,
            "faces": [],
            "error": str(e),
        }


# ============================================================
# REGISTRAR PERSONA
# ============================================================

@app.post("/api/register-face")
async def register_face(
    file: UploadFile = File(...),
    person_id: str = Form(...),
    name: str = Form(...),
    person_type: str = Form(...),
):

    start_time = time.perf_counter()

    try:

        contents = await file.read()

        image = decode_image(
            contents
        )

        if image is None:

            return {
                "success": False,
                "message": (
                    "No se pudo procesar "
                    "la imagen."
                ),
            }

        faces, _, _ = (
            get_recognition_faces(
                image
            )
        )

        if len(faces) == 0:

            return {
                "success": False,
                "message": (
                    "No se detectó "
                    "ningún rostro."
                ),
            }

        if len(faces) > 1:

            return {
                "success": False,
                "message": (
                    "La fotografía debe "
                    "contener solamente "
                    "un rostro."
                ),
                "faces_detected": int(
                    len(faces)
                ),
            }

        face = faces[0]

        embedding = get_embedding(
            face
        )

        if embedding is None:

            return {
                "success": False,
                "message": (
                    "No fue posible generar "
                    "el embedding facial."
                ),
            }

        # ----------------------------------------------------
        # Verificar ID duplicado
        # ----------------------------------------------------

        for person in registered_people:

            if (
                person["person_id"]
                == person_id
            ):

                return {
                    "success": False,
                    "message": (
                        "La persona ya se "
                        "encuentra registrada."
                    ),
                }

        # ----------------------------------------------------
        # Crear persona
        # ----------------------------------------------------

        person = {
            "person_id": str(
                person_id
            ),
            "name": str(
                name
            ),
            "person_type": str(
                person_type
            ),
            "embedding": (
                embedding.tolist()
            ),
        }

        # Guardar embedding de forma persistente.
        save_embedding(
            person_id=str(person_id),
            name=str(name),
            person_type=str(person_type),
            embedding=json.dumps(embedding.tolist()),
        )

        registered_people.append(
            person
        )

        elapsed = float(
            time.perf_counter()
            - start_time
        )

        return {
            "success": True,
            "message": (
                "Persona registrada "
                "correctamente."
            ),
            "person": {
                "person_id": str(
                    person_id
                ),
                "name": str(
                    name
                ),
                "person_type": str(
                    person_type
                ),
            },
            "embedding_dimensions": int(
                len(embedding)
            ),
            "registered_people": int(
                len(
                    registered_people
                )
            ),
            "processing_time_ms": float(
                round(
                    elapsed * 1000,
                    2,
                )
            ),
        }

    except Exception as e:

        print(
            "[ERROR /api/register-face]",
            str(e),
        )

        return {
            "success": False,
            "message": (
                "Error registrando "
                "la persona."
            ),
            "error": str(e),
        }


# ============================================================
# RECONOCIMIENTO FACIAL
# ============================================================

@app.post("/api/recognize")
async def recognize_face(
    file: UploadFile = File(...),
):

    start_time = time.perf_counter()

    try:

        contents = await file.read()

        image = decode_image(
            contents
        )

        if image is None:

            return {
                "success": False,
                "message": (
                    "No se pudo procesar "
                    "la imagen."
                ),
                "recognitions": [],
            }

        faces, _, _ = (
            get_recognition_faces(
                image
            )
        )

        if len(faces) == 0:

            elapsed = float(
                time.perf_counter()
                - start_time
            )

            return {
                "success": True,
                "faces_detected": 0,
                "recognitions": [],
                "processing_time_ms": float(
                    round(
                        elapsed * 1000,
                        2,
                    )
                ),
            }

        recognitions = []

        for index, face in enumerate(
            faces
        ):

            embedding = get_embedding(
                face
            )

            if embedding is None:

                recognitions.append(
                    {
                        "face_index": int(
                            index + 1
                        ),
                        "recognized": False,
                        "name": None,
                        "person_id": None,
                        "similarity": 0.0,
                        "similarity_percent": 0.0,
                    }
                )

                continue

            best_person = None
            best_similarity = -1.0

            for person in (
                registered_people
            ):

                stored_embedding = (
                    np.asarray(
                        person[
                            "embedding"
                        ],
                        dtype=np.float32,
                    )
                )

                similarity = (
                    cosine_similarity(
                        embedding,
                        stored_embedding,
                    )
                )

                if (
                    similarity
                    > best_similarity
                ):

                    best_similarity = (
                        similarity
                    )

                    best_person = (
                        person
                    )

            # ------------------------------------------------
            # Umbral inicial
            # ------------------------------------------------

            threshold = 0.45

            recognized = (
                best_person is not None
                and best_similarity
                >= threshold
            )

            if recognized:

                recognitions.append(
                    {
                        "face_index": int(
                            index + 1
                        ),
                        "recognized": True,
                        "person_id": str(
                            best_person[
                                "person_id"
                            ]
                        ),
                        "name": str(
                            best_person[
                                "name"
                            ]
                        ),
                        "person_type": str(
                            best_person[
                                "person_type"
                            ]
                        ),
                        "similarity": float(
                            round(
                                best_similarity,
                                4,
                            )
                        ),
                        "similarity_percent": float(
                            round(
                                best_similarity
                                * 100,
                                2,
                            )
                        ),
                    }
                )

            else:

                similarity_value = max(
                    float(
                        best_similarity
                    ),
                    0.0,
                )

                recognitions.append(
                    {
                        "face_index": int(
                            index + 1
                        ),
                        "recognized": False,
                        "person_id": None,
                        "name": None,
                        "person_type": None,
                        "similarity": float(
                            round(
                                similarity_value,
                                4,
                            )
                        ),
                        "similarity_percent": float(
                            round(
                                similarity_value
                                * 100,
                                2,
                            )
                        ),
                    }
                )

        elapsed = float(
            time.perf_counter()
            - start_time
        )

        print(
            f"[RECOGNIZE] "
            f"{len(faces)} rostros | "
            f"{elapsed:.3f} segundos"
        )

        return {
            "success": True,
            "faces_detected": int(
                len(faces)
            ),
            "recognitions": recognitions,
            "processing_time_ms": float(
                round(
                    elapsed * 1000,
                    2,
                )
            ),
            "processing_time_seconds": float(
                round(
                    elapsed,
                    3,
                )
            ),
        }

    except Exception as e:

        print(
            "[ERROR /api/recognize]",
            str(e),
        )

        return {
            "success": False,
            "message": (
                "Error durante "
                "el reconocimiento."
            ),
            "recognitions": [],
            "error": str(e),
        }


# ============================================================
# LISTAR PERSONAS
# ============================================================

@app.get("/api/registered-people")
def registered_people_list():

    return {
        "success": True,
        "count": int(
            len(
                registered_people
            )
        ),
        "people": [
            {
                "person_id": str(
                    person[
                        "person_id"
                    ]
                ),
                "name": str(
                    person[
                        "name"
                    ]
                ),
                "person_type": str(
                    person[
                        "person_type"
                    ]
                ),
            }
            for person in registered_people
        ],
    }


# ============================================================
# ELIMINAR PERSONA
# ============================================================

@app.delete(
    "/api/registered-people/{person_id}"
)
def delete_registered_person(
    person_id: str,
):

    global registered_people

    original_count = int(
        len(
            registered_people
        )
    )

    registered_people = [
        person
        for person in registered_people
        if person["person_id"]
        != person_id
    ]

    deleted_from_database = delete_embedding(person_id)

    if (
        len(registered_people)
        == original_count
        and not deleted_from_database
    ):

        return {
            "success": False,
            "message": (
                "Persona no encontrada."
            ),
        }

    return {
        "success": True,
        "message": (
            "Persona eliminada "
            "correctamente."
        ),
        "registered_people": int(
            len(
                registered_people
            )
        ),
    }

# ============================================================
# SAP MOCK - CAPA DE PRUEBAS
# ============================================================
#
# Esta capa NO reemplaza InsightFace ni la lógica actual.
# Permite probar la aplicación con la estructura de campos
# del SAP real antes de conectar MySQL.
#
try:
    from ai.sap_mock_service import (
        obtener_persona, obtener_estudiante, obtener_docente,
        listar_estudiantes, listar_docentes, listar_modulos,
        listar_secciones, listar_eventos, listar_ofertas,
        listar_aulas, listar_pabellones, listar_terminales,
        listar_matriculas_estudiante, listar_horarios_estudiante,
        buscar_terminal, clase_activa_para_aula, proxima_clase_aula,
        obtener_resumen,
        validar_asistencia_estudiante,
        determinar_estado_asistencia,
        registrar_asistencia_alumno,
        listar_asistencias_alumno,
    )
    SAP_MOCK_AVAILABLE = True
except ImportError as e:
    SAP_MOCK_AVAILABLE = False
    SAP_MOCK_IMPORT_ERROR = str(e)


def sap_mock_required():
    if not SAP_MOCK_AVAILABLE:
        return {
            "success": False,
            "message": "La capa SAP mock no está disponible.",
            "error": SAP_MOCK_IMPORT_ERROR,
        }
    return None


@app.get("/api/sap-test/resumen")
def sap_test_resumen():
    error = sap_mock_required()
    if error:
        return error
    return {"success": True, "source": "SAP_MOCK", "data": obtener_resumen()}


@app.get("/api/sap-test/estudiantes")
def sap_test_estudiantes():
    error = sap_mock_required()
    if error:
        return error
    estudiantes = listar_estudiantes()
    return {
        "success": True, "source": "SAP_MOCK",
        "count": len(estudiantes), "estudiantes": estudiantes,
    }


@app.get("/api/sap-test/estudiante/{codigosap}")
def sap_test_estudiante(codigosap: str):
    error = sap_mock_required()
    if error:
        return error
    estudiante = obtener_estudiante(codigosap)
    if estudiante is None:
        return {"success": False, "message": "Estudiante no encontrado.", "codigosap": codigosap}
    return {
        "success": True, "source": "SAP_MOCK",
        "persona": obtener_persona(codigosap), "estudiante": estudiante,
    }


@app.get("/api/sap-test/estudiante/{codigosap}/horarios")
def sap_test_horarios_estudiante(codigosap: str):
    error = sap_mock_required()
    if error:
        return error
    estudiante = obtener_estudiante(codigosap)
    if estudiante is None:
        return {
            "success": False, "message": "Estudiante no encontrado.",
            "codigosap": codigosap, "horarios": [],
        }
    horarios = listar_horarios_estudiante(codigosap)
    return {
        "success": True, "source": "SAP_MOCK", "codigosap": codigosap,
        "estudiante": estudiante, "count": len(horarios), "horarios": horarios,
    }


@app.get("/api/sap-test/estudiante/{codigosap}/matriculas")
def sap_test_matriculas_estudiante(codigosap: str):
    error = sap_mock_required()
    if error:
        return error
    estudiante = obtener_estudiante(codigosap)
    if estudiante is None:
        return {
            "success": False, "message": "Estudiante no encontrado.",
            "codigosap": codigosap, "matriculas": [],
        }
    matriculas = listar_matriculas_estudiante(codigosap)
    return {
        "success": True, "source": "SAP_MOCK", "codigosap": codigosap,
        "count": len(matriculas), "matriculas": matriculas,
    }


@app.get("/api/sap-test/docentes")
def sap_test_docentes():
    error = sap_mock_required()
    if error:
        return error
    docentes = listar_docentes()
    return {
        "success": True, "source": "SAP_MOCK",
        "count": len(docentes), "docentes": docentes,
    }


@app.get("/api/sap-test/docente/{codigosap}")
def sap_test_docente(codigosap: str):
    error = sap_mock_required()
    if error:
        return error
    docente = obtener_docente(codigosap)
    if docente is None:
        return {"success": False, "message": "Docente no encontrado.", "codigosap": codigosap}
    return {
        "success": True, "source": "SAP_MOCK",
        "persona": obtener_persona(codigosap), "docente": docente,
    }


@app.get("/api/sap-test/cursos")
def sap_test_cursos():
    error = sap_mock_required()
    if error:
        return error
    cursos = listar_modulos()
    return {"success": True, "source": "SAP_MOCK", "count": len(cursos), "cursos": cursos}


@app.get("/api/sap-test/secciones")
def sap_test_secciones():
    error = sap_mock_required()
    if error:
        return error
    secciones = listar_secciones()
    return {"success": True, "source": "SAP_MOCK", "count": len(secciones), "secciones": secciones}


@app.get("/api/sap-test/eventos")
def sap_test_eventos():
    error = sap_mock_required()
    if error:
        return error
    eventos = listar_eventos()
    return {"success": True, "source": "SAP_MOCK", "count": len(eventos), "eventos": eventos}


@app.get("/api/sap-test/ofertas")
def sap_test_ofertas():
    error = sap_mock_required()
    if error:
        return error
    ofertas = listar_ofertas()
    return {"success": True, "source": "SAP_MOCK", "count": len(ofertas), "ofertas": ofertas}


@app.get("/api/sap-test/aulas")
def sap_test_aulas():
    error = sap_mock_required()
    if error:
        return error
    aulas = listar_aulas()
    return {"success": True, "source": "SAP_MOCK", "count": len(aulas), "aulas": aulas}


@app.get("/api/sap-test/pabellones")
def sap_test_pabellones():
    error = sap_mock_required()
    if error:
        return error
    pabellones = listar_pabellones()
    return {"success": True, "source": "SAP_MOCK", "count": len(pabellones), "pabellones": pabellones}


@app.get("/api/sap-test/terminales")
def sap_test_terminales():
    error = sap_mock_required()
    if error:
        return error
    terminales = listar_terminales()
    return {"success": True, "source": "SAP_MOCK", "count": len(terminales), "terminales": terminales}


@app.get("/api/sap-test/terminal/{codigo}/clase-activa")
def sap_test_terminal_clase_activa(
    codigo: str,
    fecha: Optional[str] = None,
    hora: Optional[str] = None,
):
    error = sap_mock_required()
    if error:
        return error

    terminal = buscar_terminal(codigo)
    if terminal is None:
        return {"success": False, "message": "Terminal no encontrada.", "codigo": codigo}

    codigoaula = terminal.get("CODIGOAULA")

    # Hora de simulacion opcional para pruebas.
    fecha_hora_prueba = None
    if fecha or hora:
        if not fecha or not hora:
            return {
                "success": False,
                "message": "Para simular el tiempo debes enviar fecha y hora.",
                "ejemplo": "?fecha=2026-09-14&hora=07:55",
            }
        try:
            fecha_hora_prueba = datetime.strptime(
                f"{fecha} {hora}", "%Y-%m-%d %H:%M"
            )
        except ValueError:
            return {
                "success": False,
                "message": "Formato invalido. Usa fecha=YYYY-MM-DD y hora=HH:MM.",
                "ejemplo": "?fecha=2026-09-14&hora=07:55",
            }

    return {
        "success": True,
        "source": "SAP_MOCK",
        "terminal": terminal,
        "clase_activa": clase_activa_para_aula(
            codigoaula, fecha_hora=fecha_hora_prueba
        ),
        "proxima_clase": proxima_clase_aula(
            codigoaula, fecha_hora=fecha_hora_prueba
        ),
        "simulacion": (
            {
                "activa": True,
                "fecha": fecha,
                "hora": hora,
                "fecha_hora": fecha_hora_prueba.isoformat(sep=" "),
            }
            if fecha_hora_prueba is not None
            else {
                "activa": False,
                "mensaje": "Se utiliza la fecha y hora real del equipo.",
            }
        ),
    }


# ============================================================
# SAP MOCK - VALIDACION Y REGISTRO DE ASISTENCIA
# ============================================================

@app.get("/api/sap-test/asistencia/validar")
def sap_test_validar_asistencia(
    codigosap: str,
    oferta: str,
    terminal: str,
    fecha: Optional[str] = None,
    hora: Optional[str] = None,
):
    """Valida estudiante + oferta + terminal + ventana horaria."""
    error = sap_mock_required()
    if error:
        return error

    terminal_data = buscar_terminal(terminal)
    if terminal_data is None:
        return {
            "success": False,
            "valido": False,
            "codigo": "TERMINAL_NO_ENCONTRADA",
            "message": "Terminal no encontrada.",
            "terminal": terminal,
        }

    fecha_hora_prueba = None
    if fecha or hora:
        if not fecha or not hora:
            return {
                "success": False,
                "valido": False,
                "codigo": "FECHA_HORA_INCOMPLETAS",
                "message": "Debes enviar fecha y hora para simular.",
            }
        try:
            fecha_hora_prueba = datetime.strptime(
                f"{fecha} {hora}", "%Y-%m-%d %H:%M"
            )
        except ValueError:
            return {
                "success": False,
                "valido": False,
                "codigo": "FECHA_HORA_INVALIDAS",
                "message": "Usa fecha=YYYY-MM-DD y hora=HH:MM.",
            }

    codigoaula_terminal = terminal_data.get("CODIGOAULA")
    oferta_data = None
    for item in listar_ofertas():
        if str(item.get("CONSECUTIVOOFERTA")) == str(oferta):
            oferta_data = item
            break

    if oferta_data is None:
        return {
            "success": False,
            "valido": False,
            "codigo": "OFERTA_NO_ENCONTRADA",
            "message": "La oferta no existe.",
        }

    if str(oferta_data.get("CODIGOAULA")) != str(codigoaula_terminal):
        return {
            "success": True,
            "valido": False,
            "codigo": "AULA_NO_CORRESPONDE",
            "message": "La terminal no corresponde al aula de la clase.",
            "CODIGOSAP": codigosap,
            "CONSECUTIVOOFERTA": oferta,
            "terminal": terminal_data,
            "oferta": oferta_data,
        }

    validacion = validar_asistencia_estudiante(codigosap, oferta)
    if not validacion.get("valido"):
        return {
            "success": True,
            **validacion,
            "terminal": terminal_data,
            "oferta": oferta_data,
        }

    estado = determinar_estado_asistencia(
        oferta,
        fecha_hora=fecha_hora_prueba,
    )

    return {
        "success": True,
        "valido": bool(estado.get("valido")),
        "codigo": estado.get("codigo"),
        "message": estado.get("mensaje") or validacion.get("mensaje"),
        "estado": estado.get("estado"),
        "descripcion": estado.get("descripcion"),
        "CODIGOSAP": codigosap,
        "CONSECUTIVOOFERTA": oferta,
        "terminal": terminal_data,
        "estudiante": validacion.get("estudiante"),
        "seccion": validacion.get("seccion"),
        "evento": validacion.get("evento"),
        "oferta": validacion.get("oferta"),
        "simulacion": (
            {
                "activa": True,
                "fecha": fecha,
                "hora": hora,
                "fecha_hora": fecha_hora_prueba.isoformat(sep=" "),
            }
            if fecha_hora_prueba is not None
            else {
                "activa": False,
                "mensaje": "Se utiliza la fecha y hora real del equipo.",
            }
        ),
    }


@app.post("/api/sap-test/asistencia/registrar")
def sap_test_registrar_asistencia(
    codigosap: str,
    oferta: str,
    terminal: str,
    fecha: Optional[str] = None,
    hora: Optional[str] = None,
):
    """Registra asistencia usando la misma lógica que luego conectaremos a SAP."""
    error = sap_mock_required()
    if error:
        return error

    terminal_data = buscar_terminal(terminal)
    if terminal_data is None:
        return {
            "success": False,
            "valido": False,
            "codigo": "TERMINAL_NO_ENCONTRADA",
            "message": "Terminal no encontrada.",
        }

    oferta_data = None
    for item in listar_ofertas():
        if str(item.get("CONSECUTIVOOFERTA")) == str(oferta):
            oferta_data = item
            break

    if oferta_data is None:
        return {
            "success": False,
            "valido": False,
            "codigo": "OFERTA_NO_ENCONTRADA",
            "message": "La oferta no existe.",
        }

    if str(oferta_data.get("CODIGOAULA")) != str(terminal_data.get("CODIGOAULA")):
        return {
            "success": True,
            "valido": False,
            "codigo": "AULA_NO_CORRESPONDE",
            "message": "La terminal no corresponde al aula de la clase.",
        }

    fecha_hora_prueba = None
    if fecha or hora:
        if not fecha or not hora:
            return {
                "success": False,
                "valido": False,
                "codigo": "FECHA_HORA_INCOMPLETAS",
                "message": "Debes enviar fecha y hora para simular.",
            }
        try:
            fecha_hora_prueba = datetime.strptime(
                f"{fecha} {hora}", "%Y-%m-%d %H:%M"
            )
        except ValueError:
            return {
                "success": False,
                "valido": False,
                "codigo": "FECHA_HORA_INVALIDAS",
                "message": "Usa fecha=YYYY-MM-DD y hora=HH:MM.",
            }

    resultado = registrar_asistencia_alumno(
        codigosap,
        oferta,
        fecha_hora=fecha_hora_prueba,
    )

    return {
        "success": bool(resultado.get("valido")),
        **resultado,
        "source": "SAP_MOCK",
        "terminal": terminal_data,
        "simulacion": (
            {
                "activa": True,
                "fecha": fecha,
                "hora": hora,
                "fecha_hora": fecha_hora_prueba.isoformat(sep=" "),
            }
            if fecha_hora_prueba is not None
            else {
                "activa": False,
                "mensaje": "Se utiliza la fecha y hora real del equipo.",
            }
        ),
    }


@app.get("/api/sap-test/asistencia")
def sap_test_asistencias():
    error = sap_mock_required()
    if error:
        return error
    registros = listar_asistencias_alumno()
    return {
        "success": True,
        "source": "SAP_MOCK",
        "count": len(registros),
        "asistencias": registros,
    }
