import time
from typing import Any

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
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ALMACENAMIENTO TEMPORAL
# ============================================================

registered_people: list[dict[str, Any]] = []


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

    if (
        len(registered_people)
        == original_count
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