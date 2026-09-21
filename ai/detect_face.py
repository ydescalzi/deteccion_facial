import cv2
import insightface
from insightface.app import FaceAnalysis


def main():
    print("Inicializando InsightFace...")

    app = FaceAnalysis(
        allowed_modules=["detection"],
        providers=["CPUExecutionProvider"]
    )

    app.prepare(
        ctx_id=-1,
        det_size=(640, 640)
    )

    print("Modelo de detección cargado correctamente.")

    image_path = "images/test.jpg"

    image = cv2.imread(image_path)

    if image is None:
        print(f"No se pudo abrir la imagen: {image_path}")
        return

    faces = app.get(image)

    print(f"Rostros detectados: {len(faces)}")

    for i, face in enumerate(faces, start=1):
        bbox = face.bbox.astype(int)
        confidence = float(face.det_score)

        x1, y1, x2, y2 = bbox

        print(
            f"Rostro {i}: "
            f"bbox=({x1}, {y1}, {x2}, {y2}) "
            f"confianza={confidence:.4f}"
        )

        cv2.rectangle(
            image,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        label = f"Face {i}: {confidence:.2f}"

        cv2.putText(
            image,
            label,
            (x1, max(y1 - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )

    output_path = "results/detection_result.jpg"

    cv2.imwrite(output_path, image)

    print(f"Resultado guardado en: {output_path}")


if __name__ == "__main__":
    main()