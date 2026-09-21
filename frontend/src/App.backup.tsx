import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileBarChart,
  FileClock,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanFace,
  Settings,
  Trash2,
  Upload,
  UserCheck,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";

import axios from "axios";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
} from "react";

import "./App.css";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const API_URL = "http://127.0.0.1:8000/api";

/* =========================================================
   TIPOS
   ========================================================= */

type Page =
  | "dashboard"
  | "students"
  | "teachers"
  | "detection"
  | "present"
  | "absent"
  | "late"
  | "history"
  | "reports"
  | "settings";

type FaceDetection = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

type DetectionResponse = {
  success: boolean;
  faces_detected: number;
  faces: FaceDetection[];
};

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

const navigation = [
  {
    label: "PRINCIPAL",
    items: [
      {
        id: "dashboard" as Page,
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "PERSONAS",
    items: [
      {
        id: "students" as Page,
        label: "Estudiantes",
        icon: Users,
      },
      {
        id: "teachers" as Page,
        label: "Docentes",
        icon: UserRoundCog,
      },
    ],
  },
  {
    label: "RECONOCIMIENTO",
    items: [
      {
        id: "detection" as Page,
        label: "Detección facial",
        icon: ScanFace,
      },
    ],
  },
  {
    label: "ASISTENCIA",
    items: [
      {
        id: "present" as Page,
        label: "Presentes",
        icon: CheckCircle2,
      },
      {
        id: "absent" as Page,
        label: "Ausentes",
        icon: AlertCircle,
      },
      {
        id: "late" as Page,
        label: "Tardanzas",
        icon: Clock3,
      },
      {
        id: "history" as Page,
        label: "Historial",
        icon: FileClock,
      },
    ],
  },
  {
    label: "ANÁLISIS",
    items: [
      {
        id: "reports" as Page,
        label: "Reportes",
        icon: FileBarChart,
      },
    ],
  },
  {
    label: "SISTEMA",
    items: [
      {
        id: "settings" as Page,
        label: "Configuración",
        icon: Settings,
      },
    ],
  },
];

/* =========================================================
   APP
   ========================================================= */

function App() {
  /* =======================================================
     NAVEGACIÓN
     ======================================================= */

  const [currentPage, setCurrentPage] =
    useState<Page>("dashboard");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  /* =======================================================
     FECHA Y HORA
     ======================================================= */

  const [currentDateTime, setCurrentDateTime] =
    useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const limaDate = new Intl.DateTimeFormat(
    "es-PE",
    {
      timeZone: "America/Lima",
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(currentDateTime);

  const limaTime = new Intl.DateTimeFormat(
    "es-PE",
    {
      timeZone: "America/Lima",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    },
  ).format(currentDateTime);

  /* =======================================================
     DETECCIÓN FACIAL
     ======================================================= */

  const [cameraActive, setCameraActive] =
    useState(false);

  const [imageSelected, setImageSelected] =
    useState(false);

  const [detecting, setDetecting] =
    useState(false);

  const [faces, setFaces] =
    useState<FaceDetection[]>([]);

  const [error, setError] =
    useState("");

  const [imageName, setImageName] =
    useState("");

  /* =======================================================
     REFERENCIAS
     ======================================================= */

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const detectionLoopRef =
    useRef<number | null>(null);

  const isDetectingRef =
    useRef(false);

  const lastDetectionAtRef =
    useRef(0);

  /* =======================================================
     DETECCIÓN - ARCHIVO
     ======================================================= */

  const openImageSelector = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setFaces([]);
    setImageName(file.name);
    setImageSelected(true);
    setCameraActive(false);
    setDetecting(true);

    stopCamera();

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response =
        await axios.post<DetectionResponse>(
          `${API_URL}/detect`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          },
        );

      if (
        response.data &&
        response.data.success
      ) {
        setFaces(
          response.data.faces || [],
        );

        await renderUploadedImage(
          file,
          response.data.faces || [],
        );
      } else {
        setError(
          "La API no pudo procesar la imagen.",
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "No se pudo conectar con el servidor de IA. Verifica que FastAPI esté ejecutándose en http://127.0.0.1:8000.",
      );
    } finally {
      setDetecting(false);
    }

    event.target.value = "";
  };

  /* =======================================================
     RENDERIZAR IMAGEN
     ======================================================= */

  const renderUploadedImage = (
    file: File,
    detections: FaceDetection[],
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      const objectUrl =
        URL.createObjectURL(file);

      image.onload = () => {
        const canvas =
          canvasRef.current;

        if (!canvas) {
          URL.revokeObjectURL(
            objectUrl,
          );

          resolve();
          return;
        }

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(
            objectUrl,
          );

          reject(
            new Error(
              "No se pudo obtener el contexto del canvas.",
            ),
          );

          return;
        }

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(
          image,
          0,
          0,
          image.width,
          image.height,
        );

        drawFaceBoxes(
          ctx,
          detections,
        );

        URL.revokeObjectURL(
          objectUrl,
        );

        resolve();
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl,
        );

        reject(
          new Error(
            "No se pudo cargar la imagen.",
          ),
        );
      };

      image.src = objectUrl;
    });
  };

  /* =======================================================
     DIBUJAR ROSTROS
     ======================================================= */

  const drawFaceBoxes = (
    ctx: CanvasRenderingContext2D,
    detections: FaceDetection[],
  ) => {
    detections.forEach(
      (face, index) => {
        ctx.strokeStyle = "#b5123b";
        ctx.lineWidth = 5;

        ctx.strokeRect(
          face.x,
          face.y,
          face.width,
          face.height,
        );

        const label =
          `Rostro ${index + 1} · ${(
            face.confidence * 100
          ).toFixed(1)}%`;

        ctx.font =
          "bold 18px Arial";

        const textWidth =
          ctx.measureText(label)
            .width;

        ctx.fillStyle =
          "#b5123b";

        ctx.fillRect(
          face.x,
          Math.max(
            0,
            face.y - 32,
          ),
          textWidth + 18,
          30,
        );

        ctx.fillStyle =
          "#ffffff";

        ctx.fillText(
          label,
          face.x + 9,
          Math.max(
            21,
            face.y - 11,
          ),
        );
      },
    );
  };

  /* =======================================================
     CÁMARA
     ======================================================= */

  const sendDetectionRequest = async (
    file: File,
    label: string,
  ) => {
    if (isDetectingRef.current) {
      return;
    }

    isDetectingRef.current = true;
    setDetecting(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response =
        await axios.post<DetectionResponse>(
          `${API_URL}/detect`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          },
        );

      if (response.data.success) {
        const nextFaces =
          response.data.faces || [];

        setFaces(nextFaces);

        if (label === "live") {
          setImageSelected(false);
          setImageName("Cámara activa");
          return;
        }

        setImageSelected(true);
        setImageName("Captura de cámara");

        const resultCanvas =
          canvasRef.current;

        if (resultCanvas) {
          const resultContext =
            resultCanvas.getContext(
              "2d",
            );

          if (resultContext) {
            const sourceCanvas =
              document.createElement(
                "canvas",
              );

            const img =
              new Image();

            const objectUrl =
              URL.createObjectURL(file);

            img.onload = () => {
              sourceCanvas.width =
                img.width;
              sourceCanvas.height =
                img.height;

              const sourceContext =
                sourceCanvas.getContext(
                  "2d",
                );

              if (sourceContext) {
                sourceContext.drawImage(
                  img,
                  0,
                  0,
                  sourceCanvas.width,
                  sourceCanvas.height,
                );
              }

              resultCanvas.width =
                sourceCanvas.width;
              resultCanvas.height =
                sourceCanvas.height;

              resultContext.clearRect(
                0,
                0,
                resultCanvas.width,
                resultCanvas.height,
              );

              resultContext.drawImage(
                sourceCanvas,
                0,
                0,
              );

              drawFaceBoxes(
                resultContext,
                nextFaces,
              );

              URL.revokeObjectURL(
                objectUrl,
              );
            };

            img.onerror = () => {
              URL.revokeObjectURL(
                objectUrl,
              );
            };

            img.src = objectUrl;
          }
        }
      } else {
        setError(
          "La API no pudo procesar la imagen.",
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "No se pudo procesar la captura con el servidor de IA.",
      );
    } finally {
      setDetecting(false);
      isDetectingRef.current = false;
    }
  };

  const startCamera = async () => {
    setError("");
    setFaces([]);
    setImageSelected(false);
    setImageName("");

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: {
              facingMode: "user",
              width: {
                ideal: 480,
                max: 640,
              },
              height: {
                ideal: 360,
                max: 480,
              },
              frameRate: {
                ideal: 24,
                max: 24,
              },
            },
            audio: false,
          },
        );

      streamRef.current =
        stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        await videoRef.current.play();
      }

      setCameraActive(true);

      setTimeout(() => {
        const video =
          videoRef.current;

        if (
          video &&
          video.readyState >= 2
        ) {
          void detectFromLiveVideo();
        }
      }, 180);
    } catch (err) {
      console.error(err);

      setError(
        "No se pudo acceder a la cámara. Verifica los permisos del navegador y que exista una cámara disponible.",
      );

      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (detectionLoopRef.current) {
      window.clearTimeout(
        detectionLoopRef.current,
      );
      detectionLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraActive(false);
    setDetecting(false);
    isDetectingRef.current = false;
  };

  const detectFromLiveVideo = async () => {
    const video = videoRef.current;

    if (!video || !cameraActive) {
      return;
    }

    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return;
    }

    const now = Date.now();

    if (
      now - lastDetectionAtRef.current <
      1200
    ) {
      return;
    }

    lastDetectionAtRef.current = now;

    const captureCanvas =
      document.createElement("canvas");
    const targetWidth = Math.min(
      video.videoWidth,
      480,
    );
    const targetHeight = Math.min(
      video.videoHeight,
      360,
    );

    captureCanvas.width = targetWidth;
    captureCanvas.height = targetHeight;

    const captureContext =
      captureCanvas.getContext("2d");

    if (!captureContext) {
      return;
    }

    captureContext.drawImage(
      video,
      0,
      0,
      targetWidth,
      targetHeight,
    );

    captureCanvas.toBlob(
      async (blob) => {
        if (!blob) {
          return;
        }

        const file = new File(
          [blob],
          "camera-live.jpg",
          {
            type: "image/jpeg",
          },
        );

        await sendDetectionRequest(
          file,
          "live",
        );
      },
      "image/jpeg",
      0.7,
    );
  };

  useEffect(() => {
    if (!cameraActive) {
      if (detectionLoopRef.current) {
        window.clearTimeout(
          detectionLoopRef.current,
        );
        detectionLoopRef.current = null;
      }
      return;
    }

    const scheduleNextDetection = () => {
      detectionLoopRef.current =
        window.setTimeout(() => {
          void detectFromLiveVideo();
          scheduleNextDetection();
        }, 1500);
    };

    scheduleNextDetection();

    return () => {
      if (detectionLoopRef.current) {
        window.clearTimeout(
          detectionLoopRef.current,
        );
        detectionLoopRef.current = null;
      }
    };
  }, [cameraActive]);

  /* =======================================================
     CAPTURAR CÁMARA
     ======================================================= */

  const captureCamera = async () => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setError(
        "La cámara todavía no está lista.",
      );

      return;
    }

    const canvas =
      document.createElement(
        "canvas",
      );

    const targetWidth = Math.min(
      video.videoWidth,
      640,
    );
    const targetHeight = Math.min(
      video.videoHeight,
      480,
    );

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.drawImage(
      video,
      0,
      0,
      targetWidth,
      targetHeight,
    );

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          return;
        }

        const file =
          new File(
            [blob],
            "captura-camara.jpg",
            {
              type: "image/jpeg",
            },
          );

        await sendDetectionRequest(
          file,
          "capture",
        );
      },
      "image/jpeg",
      0.82,
    );
  };

  /* =======================================================
     LIMPIAR
     ======================================================= */

  const clearDetection = () => {
    stopCamera();

    setFaces([]);
    setImageSelected(false);
    setImageName("");
    setError("");

    const canvas =
      canvasRef.current;

    if (canvas) {
      const ctx =
        canvas.getContext(
          "2d",
        );

      if (ctx) {
        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }
    }
  };

  /* =======================================================
     NAVEGACIÓN
     ======================================================= */

  const navigateTo = (
    page: Page,
  ) => {
    setCurrentPage(page);

    if (
      window.innerWidth <= 800
    ) {
      setSidebarOpen(false);
    }
  };

  /* =======================================================
     LIMPIAR CÁMARA AL SALIR
     ======================================================= */

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }
    };
  }, []);

  /* =======================================================
     TÍTULOS
     ======================================================= */

  const pageTitles: Record<
    Page,
    {
      title: string;
      description: string;
    }
  > = {
    dashboard: {
      title: "Dashboard",
      description:
        "Resumen general del sistema de asistencia.",
    },

    students: {
      title: "Estudiantes",
      description:
        "Gestión y registro de estudiantes.",
    },

    teachers: {
      title: "Docentes",
      description:
        "Gestión y registro de docentes.",
    },

    detection: {
      title: "Detección facial",
      description:
        "Identificación de rostros mediante inteligencia artificial.",
    },

    present: {
      title: "Presentes",
      description:
        "Estudiantes y docentes registrados como presentes.",
    },

    absent: {
      title: "Ausentes",
      description:
        "Control de personas ausentes.",
    },

    late: {
      title: "Tardanzas",
      description:
        "Registro y seguimiento de tardanzas.",
    },

    history: {
      title: "Historial",
      description:
        "Historial completo de asistencia.",
    },

    reports: {
      title: "Reportes",
      description:
        "Análisis y generación de reportes.",
    },

    settings: {
      title: "Configuración",
      description:
        "Configuración general del sistema.",
    },
  };

  /* =======================================================
     DASHBOARD
     ======================================================= */

  const renderDashboard =
    () => {
      return (
        <>
          <section className="welcome">
            <div>
              <span>
                SISTEMA UNIVERSITARIO
              </span>

              <h2>
                Control de asistencia
              </h2>

              <p>
                Gestión inteligente de
                asistencia para estudiantes
                y docentes.
              </p>
            </div>

            <div className="welcome-icon">
              <ScanFace
                size={42}
                strokeWidth={1.5}
              />
            </div>
          </section>

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-icon red">
                <Users size={21} />
              </div>

              <div>
                <span>
                  Personas registradas
                </span>

                <strong>
                  1,250
                </strong>

                <small>
                  Estudiantes y docentes
                </small>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon green">
                <UserCheck
                  size={21}
                />
              </div>

              <div>
                <span>
                  Presentes hoy
                </span>

                <strong>
                  1,180
                </strong>

                <small>
                  94.4% del total
                </small>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon orange">
                <Clock3
                  size={21}
                />
              </div>

              <div>
                <span>
                  Tardanzas
                </span>

                <strong>
                  42
                </strong>

                <small>
                  Registradas hoy
                </small>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-icon blue">
                <ScanFace
                  size={21}
                />
              </div>

              <div>
                <span>
                  Reconocimientos
                </span>

                <strong>
                  1,096
                </strong>

                <small>
                  Procesados hoy
                </small>
              </div>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel">
              <div className="panel-header">
                <div>
                  <h3>
                    Resumen de asistencia
                  </h3>

                  <p>
                    Estado registrado durante
                    la jornada actual.
                  </p>
                </div>

                <CalendarCheck
                  size={20}
                />
              </div>

              <div className="attendance-summary">
                <div>
                  <CheckCircle2
                    size={17}
                  />

                  <span>
                    Presentes
                  </span>

                  <strong>
                    1,180
                  </strong>
                </div>

                <div>
                  <AlertCircle
                    size={17}
                  />

                  <span>
                    Ausentes
                  </span>

                  <strong>
                    28
                  </strong>
                </div>

                <div>
                  <Clock3
                    size={17}
                  />

                  <span>
                    Tardanzas
                  </span>

                  <strong>
                    42
                  </strong>
                </div>
              </div>
            </article>

            <article className="panel activity-panel">
              <div className="panel-header">
                <div>
                  <h3>
                    Actividad reciente
                  </h3>

                  <p>
                    Últimos movimientos del
                    sistema.
                  </p>
                </div>

                <Activity
                  size={20}
                />
              </div>

              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon green">
                    <CheckCircle2
                      size={16}
                    />
                  </div>

                  <div>
                    <strong>
                      Asistencia registrada
                    </strong>

                    <span>
                      Estudiante reconocido
                    </span>
                  </div>

                  <time>
                    10:38
                  </time>
                </div>

                <div className="activity-item">
                  <div className="activity-icon green">
                    <ScanFace
                      size={16}
                    />
                  </div>

                  <div>
                    <strong>
                      Reconocimiento facial
                    </strong>

                    <span>
                      Proceso completado
                    </span>
                  </div>

                  <time>
                    10:35
                  </time>
                </div>

                <div className="activity-item">
                  <div className="activity-icon orange">
                    <Clock3
                      size={16}
                    />
                  </div>

                  <div>
                    <strong>
                      Tardanza registrada
                    </strong>

                    <span>
                      Registro automático
                    </span>
                  </div>

                  <time>
                    10:31
                  </time>
                </div>
              </div>
            </article>
          </section>
        </>
      );
    };

  /* =======================================================
     DETECCIÓN FACIAL
     ======================================================= */

  const renderDetection =
    () => {
      return (
        <>
          <section className="page-heading">
            <div>
              <h2>
                Detección facial
              </h2>

              <p>
                Detecta rostros utilizando
                InsightFace ejecutándose
                localmente.
              </p>
            </div>

            <div className="ai-badge">
              <span />
              Motor IA activo
            </div>
          </section>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={
              handleImageUpload
            }
            style={{
              display: "none",
            }}
          />

          <section className="detection-controls">
            {!cameraActive ? (
              <button
                className="primary-button"
                onClick={
                  startCamera
                }
              >
                <Camera
                  size={17}
                />

                Abrir cámara
              </button>
            ) : (
              <button
                className="danger-button"
                onClick={
                  stopCamera
                }
              >
                <X size={17} />

                Detener cámara
              </button>
            )}

            {cameraActive && (
              <button
                className="primary-button"
                onClick={
                  captureCamera
                }
                disabled={detecting}
              >
                <ScanFace
                  size={17}
                />

                {detecting
                  ? "Procesando..."
                  : "Capturar y detectar"}
              </button>
            )}

            <button
              className="secondary-button"
              onClick={
                openImageSelector
              }
              disabled={detecting}
            >
              <Upload
                size={17}
              />

              Subir imagen
            </button>

            <button
              className="danger-button"
              onClick={
                clearDetection
              }
              disabled={
                detecting ||
                (!imageSelected &&
                  faces.length ===
                    0 &&
                  !cameraActive)
              }
            >
              <Trash2
                size={17}
              />

              Limpiar
            </button>
          </section>

          {error && (
            <section className="detection-status">
              <div className="detection-status-main">
                <AlertCircle
                  size={18}
                  color="#b42318"
                />

                <div>
                  <strong>
                    No se pudo completar
                    la operación
                  </strong>

                  <span>
                    {error}
                  </span>
                </div>
              </div>
            </section>
          )}

          <section className="detection-status">
            <div className="detection-status-main">
              <span className="status-indicator" />

              <div>
                <strong>
                  {cameraActive
                    ? "Cámara activa"
                    : imageSelected
                      ? "Imagen procesada"
                      : "Sistema preparado"}
                </strong>

                <span>
                  {imageSelected
                    ? imageName
                    : "Esperando una imagen o cámara."}
                </span>
              </div>
            </div>

            <div className="face-counter">
              <strong>
                {faces.length}
              </strong>

              <span>
                Rostros detectados
              </span>
            </div>
          </section>

          <section className="detection-viewer">
            {cameraActive ? (
              <div className="camera">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                />

                <canvas
                  ref={canvasRef}
                />
              </div>
            ) : imageSelected ? (
              <div className="image-result">
                <canvas
                  ref={canvasRef}
                />
              </div>
            ) : (
              <div className="detection-empty">
                <div className="detection-empty-icon">
                  <ScanFace
                    size={32}
                  />
                </div>

                <h3>
                  Detección facial
                </h3>

                <p>
                  Abre la cámara o selecciona
                  una imagen para comenzar.
                </p>

                <button
                  className="empty-button"
                  onClick={
                    openImageSelector
                  }
                >
                  <Upload
                    size={16}
                  />

                  Seleccionar imagen
                </button>
              </div>
            )}
          </section>

          <section className="results-panel">
            <div className="results-header">
              <div>
                <h3>
                  Rostros detectados
                </h3>

                <p>
                  Resultados generados por
                  InsightFace.
                </p>
              </div>

              <span className="results-count">
                {faces.length}{" "}
                {faces.length === 1
                  ? "rostro"
                  : "rostros"}
              </span>
            </div>

            {faces.length === 0 ? (
              <div className="no-results">
                <ScanFace
                  size={17}
                />

                <span>
                  No hay rostros detectados
                  todavía.
                </span>
              </div>
            ) : (
              <div className="face-grid">
                {faces.map(
                  (
                    face,
                    index,
                  ) => (
                    <div
                      className="face-card"
                      key={`${face.x}-${face.y}-${index}`}
                    >
                      <div className="face-number">
                        {index + 1}
                      </div>

                      <div className="face-data">
                        <strong>
                          Rostro{" "}
                          {index + 1}
                        </strong>

                        <span>
                          Posición:{" "}
                          {Math.round(
                            face.x,
                          )}{" "}
                          ×{" "}
                          {Math.round(
                            face.y,
                          )}
                        </span>
                      </div>

                      <span className="face-confidence">
                        {(
                          face.confidence *
                          100
                        ).toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </>
      );
    };

  /* =======================================================
     PÁGINAS FUTURAS
     ======================================================= */

  const renderModule =
    (
      icon: React.ReactNode,
      title: string,
      description: string,
    ) => {
      return (
        <section className="coming-page">
          <div className="coming-icon">
            {icon}
          </div>

          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>
        </section>
      );
    };

  /* =======================================================
     CONTENIDO PRINCIPAL
     ======================================================= */

  const renderPage =
    () => {
      switch (currentPage) {
        case "dashboard":
          return renderDashboard();

        case "detection":
          return renderDetection();

        case "students":
          return renderModule(
            <Users size={32} />,
            "Estudiantes",
            "Aquí gestionaremos el registro, información académica, fotografía facial y datos de identificación de los estudiantes.",
          );

        case "teachers":
          return renderModule(
            <UserRoundCog
              size={32}
            />,
            "Docentes",
            "Aquí gestionaremos el registro de docentes, fotografía facial, información institucional y control de asistencia.",
          );

        case "present":
          return renderModule(
            <CheckCircle2
              size={32}
            />,
            "Presentes",
            "Módulo para consultar las personas que registraron asistencia durante la jornada.",
          );

        case "absent":
          return renderModule(
            <AlertCircle
              size={32}
            />,
            "Ausentes",
            "Módulo para consultar y gestionar los registros de ausencia.",
          );

        case "late":
          return renderModule(
            <Clock3 size={32} />,
            "Tardanzas",
            "Módulo para controlar las tardanzas y los horarios de ingreso.",
          );

        case "history":
          return renderModule(
            <FileClock
              size={32}
            />,
            "Historial",
            "Consulta histórica de los registros de asistencia de estudiantes y docentes.",
          );

        case "reports":
          return renderModule(
            <BarChart3
              size={32}
            />,
            "Reportes",
            "Generación de reportes, estadísticas y análisis de asistencia.",
          );

        case "settings":
          return renderModule(
            <Settings
              size={32}
            />,
            "Configuración",
            "Configuración general del sistema, reconocimiento facial, usuarios y parámetros de asistencia.",
          );

        default:
          return renderDashboard();
      }
    };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className={`app ${
        sidebarCollapsed
          ? "sidebar-collapsed"
          : ""
      }`}
    >
      {/* ===================================================
          SIDEBAR
          =================================================== */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-symbol">
            USMP
          </div>

          <div className="brand-text">
            <strong>
              Asistencia
            </strong>

            <span>
              Sistema Universitario
            </span>
          </div>

          <button
            className="sidebar-close"
            onClick={() =>
              setSidebarOpen(false)
            }
            aria-label="Cerrar menú"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map(
            (section) => (
              <div
                key={
                  section.label
                }
              >
                <div className="nav-label">
                  {section.label}
                </div>

                {section.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <button
                        key={
                          item.id
                        }
                        className={`nav-item ${
                          currentPage ===
                          item.id
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          navigateTo(
                            item.id,
                          )
                        }
                        title={
                          sidebarCollapsed
                            ? item.label
                            : undefined
                        }
                      >
                        <Icon
                          size={18}
                        />

                        <span>
                          {
                            item.label
                          }
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            ),
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            A
          </div>

          <div className="user-info">
            <strong>
              Administrador
            </strong>

            <span>
              Sistema USMP
            </span>
          </div>

          <LogOut
            size={16}
          />
        </div>
      </aside>

      {/* ===================================================
          MAIN
          =================================================== */}

      <div className="main-wrapper">
        {/* ===============================================
            TOPBAR
            =============================================== */}

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              onClick={() => {
                if (
                  window.innerWidth <=
                  800
                ) {
                  setSidebarOpen(
                    true,
                  );
                } else {
                  setSidebarCollapsed(
                    (value) =>
                      !value,
                  );
                }
              }}
              aria-label="Mostrar u ocultar menú"
              title={
                sidebarCollapsed
                  ? "Mostrar menú"
                  : "Ocultar menú"
              }
            >
              <Menu
                size={21}
              />
            </button>

            <div>
              <span className="breadcrumb">
                SISTEMA UNIVERSITARIO
              </span>

              <h1>
                {
                  pageTitles[
                    currentPage
                  ].title
                }
              </h1>
            </div>
          </div>

          <div className="topbar-right">
            {/* FECHA Y HORA LIMA */}

            <div className="datetime-display">
              <div className="datetime-icon">
                <Clock3
                  size={16}
                />
              </div>

              <div className="datetime-content">
                <strong>
                  {limaTime}
                </strong>

                <span>
                  {limaDate}
                </span>
              </div>
            </div>

            {/* ESTADO IA */}

            <div className="system-status">
              <span className="status-dot" />

              Motor IA activo
            </div>

            {/* USUARIO */}

            <div className="topbar-user">
              <div className="user-avatar small">
                A
              </div>

              <div>
                <strong>
                  Administrador
                </strong>

                <span>
                  USMP
                </span>
              </div>

              <ChevronDown
                size={15}
              />
            </div>
          </div>
        </header>

        {/* ===============================================
            CONTENT
            =============================================== */}

        <main className="main-content">
          <div className="page-heading">
            <div>
              <p>
                {
                  pageTitles[
                    currentPage
                  ].description
                }
              </p>
            </div>
          </div>

          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;

