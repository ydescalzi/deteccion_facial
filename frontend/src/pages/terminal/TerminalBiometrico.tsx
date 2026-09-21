import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  ScanFace,
  ShieldCheck,
  UserRound,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { useAcademic } from "../../context/AcademicContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8000`;

interface TerminalInfo {
  CODIGO: string;
  NOMBRE?: string | null;
  CODIGOAULA?: string | null;
  AULA?: string | null;
  TIPO?: string | null;
  ESTADO?: string | null;
  PABELLON?: string | null;
  PABELLON_NOMBRE?: string | null;
  PISO?: string | number | null;
}

interface LocalTerminal {
  id: string;
  codigo: string;
  aulaId: string;
  horarioIds: string[];
  ubicacion: string;
  estado: string;
  ultimaConexion: string;
}

type ClaseActiva = Record<string, unknown>;

interface TerminalResponse {
  success: boolean;
  terminal?: TerminalInfo;
  clase_activa?: ClaseActiva | null;
  proxima_clase?: ClaseActiva | null;
  message?: string;
}

interface Recognition {
  face_index: number;
  recognized: boolean;
  name: string | null;
  person_id: string | null;
  person_type?: string | null;
  similarity?: number;
  similarity_percent?: number;
}

interface RecognizeResponse {
  success: boolean;
  faces_detected: number;
  recognitions: Recognition[];
  processing_time_ms?: number;
  message?: string;
}

interface SAPStudent {
  CODIGOSAP: string;
  NOMBRES?: string | null;
  APELLIDOPATERNO?: string | null;
  APELLIDOMATERNO?: string | null;
  DNI?: string | null;
}

type StatusKind = "idle" | "success" | "warning" | "error";

const terminalInfraFallback: Record<string, Partial<TerminalInfo>> = {
  "TAB-001": {
    PABELLON: "PAB-INFO",
    PABELLON_NOMBRE: "PABELLÓN DE INFORMÁTICA",
    PISO: "1",
    CODIGOAULA: "AULA-101",
    AULA: "AULA 101",
  },
  "TAB-002": {
    PABELLON: "PAB-INFO",
    PABELLON_NOMBRE: "PABELLÓN DE INFORMÁTICA",
    PISO: "2",
    CODIGOAULA: "AULA-201",
    AULA: "AULA 201",
  },
  "TAB-003": {
    PABELLON: "PAB-INFO",
    PABELLON_NOMBRE: "PABELLÓN DE INFORMÁTICA",
    PISO: "2",
    CODIGOAULA: "AULA-202",
    AULA: "AULA 202",
  },
};

function formatTime(value?: string | null) {
  if (!value) return "--:--";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function getStringField(obj: ClaseActiva | null | undefined, ...keys: string[]) {
  if (!obj) return "";
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
}

function getClassOfferId(clase?: ClaseActiva | null) {
  return getStringField(clase, "CONSECUTIVOOFERTA", "consecutivoofer", "CONSECUTIVOOFERTA");
}

function getClassRoomId(clase?: ClaseActiva | null) {
  return getStringField(clase, "CODIGOAULA", "claveaula", "aula");
}

function getClassCourse(clase?: ClaseActiva | null) {
  return getStringField(clase, "curso", "modulo", "DENOMINACION", "denominacion") || "Curso académico";
}

function getClassStart(clase?: ClaseActiva | null) {
  return getStringField(clase, "hora_inicio", "HORAINICIO", "horaInicio");
}

function getClassEnd(clase?: ClaseActiva | null) {
  return getStringField(clase, "hora_fin", "HORAFIN", "horaFin");
}

function diaActual(): string {
  return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][new Date().getDay()];
}

function minutos(hora: string): number {
  const [horas, minutosActuales] = hora.split(":").map(Number);
  return horas * 60 + minutosActuales;
}


export default function TerminalBiometrico() {
  const { aulas, horarios, terminales } = useAcademic();
  const terminalCode = String(
    window.location.pathname.match(/^\/terminal\/([^/]+)/i)?.[1] ?? ""
  )
    .trim()
    .toUpperCase();

  // Modo de prueba opcional:
  // /terminal/TAB-002?fecha=2026-09-17&hora=07:55
  // Sin parámetros se utiliza la fecha/hora real de la tablet.
  const searchParams = new URLSearchParams(window.location.search);
  const testDate = searchParams.get("fecha");
  const testTime = searchParams.get("hora");

  const buildClassQuery = () => {
    if (!testDate || !testTime) return "";
    return `?fecha=${encodeURIComponent(testDate)}&hora=${encodeURIComponent(testTime)}`;
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionBusyRef = useRef(false);
  const lastRecognitionRef = useRef("");
  const lastRecognitionAtRef = useRef(0);

  const [terminal, setTerminal] = useState<TerminalInfo | null>(null);
  const [activeClass, setActiveClass] = useState<ClaseActiva | null>(null);
  const [nextClass, setNextClass] = useState<ClaseActiva | null>(null);
  const [students, setStudents] = useState<SAPStudent[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(true);
  const [classLoading, setClassLoading] = useState(false);
  const [status, setStatus] = useState<StatusKind>("idle");
  const [statusMessage, setStatusMessage] = useState(
    "Acérquese a la cámara para registrar su asistencia."
  );
  const [recognized, setRecognized] = useState<Recognition | null>(null);
  const [registeredAt, setRegisteredAt] = useState("");
  const [processing, setProcessing] = useState(false);

  const terminalLocal = terminales.find(
    (item) => item.codigo.trim().toUpperCase() === terminalCode,
  ) as LocalTerminal | undefined;

  const aulaLocal = aulas.find((item) => item.id === terminalLocal?.aulaId);

  const claseLocal = horarios
    .filter((horario) =>
      terminalLocal?.horarioIds?.includes(horario.id) &&
      horario.estado === "Activo" &&
      horario.dia === diaActual(),
    )
    .find((horario) => {
      const ahora = new Date();
      const hora = ahora.getHours() * 60 + ahora.getMinutes();
      return hora >= minutos(horario.horaInicio) - 10 && hora <= minutos(horario.horaFin) + 20;
    });

  const applyTerminalInfra = useCallback(
    (data: TerminalInfo) => ({
      ...data,
      ...(terminalInfraFallback[terminalCode] ?? {}),
    }),
    [terminalCode]
  );

  const loadTerminal = useCallback(async () => {
    if (!terminalCode) {
      setLoading(false);
      setStatus("error");
      setStatusMessage("Código de terminal no válido.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/sap-test/terminal/${encodeURIComponent(
          terminalCode
        )}/clase-activa${buildClassQuery()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: TerminalResponse = await response.json();

      if (!data.success || !data.terminal) {
        throw new Error(data.message || "Terminal no encontrada.");
      }

      const terminalRespuesta = applyTerminalInfra(data.terminal);
      setTerminal(terminalRespuesta);
      setActiveClass(data.clase_activa ?? null);
      setNextClass(data.proxima_clase ?? null);
      setStatus("idle");
      setStatusMessage(
        data.clase_activa
          ? "Acérquese a la cámara para registrar su asistencia."
          : "No hay una clase activa en este momento."
      );
    } catch (error) {
      if (terminalLocal) {
        setTerminal({
          CODIGO: terminalLocal.codigo,
          NOMBRE: terminalLocal.codigo,
          CODIGOAULA: aulaLocal?.codigo ?? "",
          AULA: aulaLocal?.nombre ?? terminalLocal.ubicacion,
          ESTADO: terminalLocal.estado,
        });
        setActiveClass(
          claseLocal
            ? {
                curso: claseLocal.cursoNombre,
                SECCION: claseLocal.seccion,
                DIA: claseLocal.dia,
                HORAINICIO: claseLocal.horaInicio,
                HORAFIN: claseLocal.horaFin,
                CODIGOAULA: aulaLocal?.codigo,
              }
            : null,
        );
        setNextClass(null);
        setStatus("warning");
        setStatusMessage("Configuración local activa. Conecta el servicio SAP para registrar asistencia.");
      } else {
        setTerminal(null);
        setActiveClass(null);
        setNextClass(null);
        setStatus("error");
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "No fue posible consultar la terminal."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [aulaLocal?.codigo, aulaLocal?.nombre, applyTerminalInfra, claseLocal, terminalCode, terminalLocal, testDate, testTime]);

  const loadStudents = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/sap-test/estudiantes`);
      if (!response.ok) return;

      const data = await response.json();
      setStudents(Array.isArray(data?.estudiantes) ? data.estudiantes : []);
    } catch {
      setStudents([]);
    }
  }, []);

  const refreshActiveClass = useCallback(async () => {
    if (!terminalCode) return;

    setClassLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/sap-test/terminal/${encodeURIComponent(
          terminalCode
        )}/clase-activa${buildClassQuery()}`
      );
      if (!response.ok) return;

      const data: TerminalResponse = await response.json();
      if (data.success) {
        if (data.terminal) setTerminal(applyTerminalInfra(data.terminal));
        setActiveClass(data.clase_activa ?? null);
        setNextClass(data.proxima_clase ?? null);
      }
    } finally {
      setClassLoading(false);
    }
  }, [applyTerminalInfra, terminalCode, testDate, testTime]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Este dispositivo no permite acceder a la cámara.");
      return;
    }

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "No se pudo activar la cámara."
      );
      setCameraActive(false);
    }
  }, [stopCamera]);

  const registerAttendance = useCallback(
    async (personId: string, recognition: Recognition) => {
      if (!activeClass || !terminal) {
        setStatus("warning");
        setStatusMessage(
          "No existe una clase activa para registrar asistencia."
        );
        return;
      }

      const offerId = getClassOfferId(activeClass);
      if (!offerId) {
        setStatus("error");
        setStatusMessage(
          "La clase activa no tiene una oferta académica válida."
        );
        return;
      }

      const roomId = getClassRoomId(activeClass);
      const terminalRoomId = String(terminal.CODIGOAULA ?? "");

      if (roomId && terminalRoomId && roomId !== terminalRoomId) {
        setStatus("error");
        setStatusMessage(
          "El aula de la clase no coincide con el aula configurada en esta tablet."
        );
        return;
      }

      try {
        const params = new URLSearchParams({
          codigosap: personId,
          oferta: offerId,
          terminal: terminalCode,
        });

        const response = await fetch(
          `${API_URL}/api/sap-test/asistencia/registrar?${params.toString()}`,
          { method: "POST" }
        );

        const data = await response.json();

        if (!response.ok || data?.success === false) {
          setStatus("error");
          setStatusMessage(
            data?.message || "No fue posible registrar la asistencia."
          );
          return;
        }

        setRecognized(recognition);
        setRegisteredAt(
          new Date().toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
        setStatus("success");
        setStatusMessage("Asistencia registrada correctamente.");
      } catch {
        setStatus("error");
        setStatusMessage(
          "No se pudo comunicar con el servicio de asistencia SAP."
        );
      }
    },
    [activeClass, terminal, terminalCode]
  );

  const recognizeCurrentFrame = useCallback(async () => {
    if (
      !cameraActive ||
      !videoRef.current ||
      !canvasRef.current ||
      recognitionBusyRef.current
    ) {
      return;
    }

    if (!activeClass) return;

    recognitionBusyRef.current = true;
    setProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < 2 || video.videoWidth === 0) return;

      const maxWidth = 960;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const context = canvas.getContext("2d");
      if (!context) return;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.86)
      );

      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, `${terminalCode}-captura.jpg`);

      const response = await fetch(`${API_URL}/api/recognize`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) return;

      const data: RecognizeResponse = await response.json();
      const match = data.recognitions?.find(
        (item) => item.recognized && item.person_id
      );

      if (!match?.person_id) {
        setRecognized(null);
        setStatus("idle");
        setStatusMessage("Rostro no identificado. Manténgase frente a la cámara.");
        return;
      }

      const personId = String(match.person_id);
      const now = Date.now();

      if (
        lastRecognitionRef.current === personId &&
        now - lastRecognitionAtRef.current < 8000
      ) {
        return;
      }

      const student = students.find(
        (item) => String(item.CODIGOSAP) === personId
      );

      if (!student) {
        setRecognized(match);
        setStatus("error");
        setStatusMessage(
          `Rostro reconocido como ${match.name || personId}, pero no figura como estudiante SAP.`
        );
        return;
      }

      lastRecognitionRef.current = personId;
      lastRecognitionAtRef.current = now;

      const normalizedMatch = {
        ...match,
        name:
          match.name ||
          `${student.NOMBRES ?? ""} ${student.APELLIDOPATERNO ?? ""} ${
            student.APELLIDOMATERNO ?? ""
          }`.replace(/\s+/g, " ").trim(),
      };

      await registerAttendance(personId, normalizedMatch);
    } catch {
      setStatus("error");
      setStatusMessage("Ocurrió un error durante el reconocimiento facial.");
    } finally {
      recognitionBusyRef.current = false;
      setProcessing(false);
    }
  }, [
    activeClass,
    cameraActive,
    registerAttendance,
    students,
    terminalCode,
  ]);

  useEffect(() => {
    loadTerminal();
    loadStudents();

    const interval = window.setInterval(refreshActiveClass, 30000);
    return () => window.clearInterval(interval);
  }, [loadStudents, loadTerminal, refreshActiveClass]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (!cameraActive || !activeClass) return;

    const interval = window.setInterval(() => {
      recognizeCurrentFrame();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [activeClass, cameraActive, recognizeCurrentFrame]);

  useEffect(() => {
    if (status !== "success") return;

    const timeout = window.setTimeout(() => {
      setStatus("idle");
      setRecognized(null);
      setRegisteredAt("");
      setStatusMessage(
        activeClass
          ? "Acérquese a la cámara para registrar su asistencia."
          : "No hay una clase activa en este momento."
      );
    }, 7000);

    return () => window.clearTimeout(timeout);
  }, [activeClass, status]);

  const displayName = terminal?.NOMBRE || terminalCode;
  const pavilion =
    terminal?.PABELLON_NOMBRE || terminal?.PABELLON || "PABELLÓN NO CONFIGURADO";
  const floor = terminal?.PISO != null ? String(terminal.PISO) : "—";
  const room =
    terminal?.AULA || terminal?.CODIGOAULA || "AULA NO CONFIGURADA";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin" />
          <p className="text-lg font-semibold">Inicializando terminal</p>
          <p className="mt-1 text-sm text-slate-400">{terminalCode}</p>
        </div>
      </div>
    );
  }

  if (!terminal) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-red-500/30 bg-slate-900 p-8 text-center shadow-2xl">
          <XCircle className="mx-auto h-16 w-16 text-red-400" />
          <h1 className="mt-5 text-2xl font-bold">Terminal no disponible</h1>
          <p className="mt-3 text-slate-400">
            {terminalCode || "SIN CÓDIGO"} · {statusMessage}
          </p>
          <button
            type="button"
            onClick={loadTerminal}
            className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col">
        <header className="border-b border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg">
                <ScanFace className="h-8 w-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                    Terminal biométrica
                  </span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    {terminalCode}
                  </span>
                </div>
                <h1 className="mt-1 text-xl font-bold md:text-2xl">
                  {displayName}
                </h1>
                {testDate && testTime && (
                  <p className="mt-1 text-xs font-medium text-amber-300">
                    Modo prueba · {testDate} · {testTime}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Pabellón
                </p>
                <p className="mt-1 text-sm font-semibold">{pavilion}</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Piso
                </p>
                <p className="mt-1 text-sm font-semibold">{floor}</p>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-2">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Aula
                </p>
                <p className="mt-1 text-sm font-semibold">{room}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-5 p-4 md:p-6 lg:grid-cols-[1.5fr_0.8fr]">
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full min-h-[480px] w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-sm font-semibold backdrop-blur">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    cameraActive ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                {cameraActive ? "Cámara activa" : "Cámara detenida"}
              </div>

              <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-[35%] border-2 border-white/60 md:h-80 md:w-80">
                <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-white/70" />
                <div className="absolute bottom-0 left-1/2 h-5 w-px -translate-x-1/2 bg-white/70" />
                <div className="absolute left-0 top-1/2 h-px w-5 -translate-y-1/2 bg-white/70" />
                <div className="absolute right-0 top-1/2 h-px w-5 -translate-y-1/2 bg-white/70" />
              </div>

              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2 text-center text-sm backdrop-blur">
                Centre su rostro dentro del marco
              </div>
            </div>

            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6">
                <div className="max-w-md text-center">
                  <CameraOff className="mx-auto h-14 w-14 text-slate-400" />
                  <p className="mt-4 font-semibold">Cámara no disponible</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {cameraError || "Active la cámara para iniciar el reconocimiento."}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-5 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900"
                  >
                    Activar cámara
                  </button>
                </div>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Control de asistencia
                  </p>
                  <h2 className="mt-1 text-lg font-bold">
                    {activeClass ? "Clase activa" : "Sin clase activa"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={refreshActiveClass}
                  disabled={classLoading}
                  className="ml-auto rounded-xl bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                  title="Actualizar clase"
                  aria-label="Actualizar clase"
                >
                  <RefreshCw className={`h-5 w-5 ${classLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {activeClass ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs uppercase text-slate-500">Curso</p>
                    <p className="mt-1 font-semibold">
                      {getClassCourse(activeClass)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-xs uppercase text-slate-500">Inicio</p>
                      <p className="mt-1 text-lg font-bold">
                        {formatTime(getClassStart(activeClass))}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-xs uppercase text-slate-500">Fin</p>
                      <p className="mt-1 text-lg font-bold">
                        {formatTime(getClassEnd(activeClass))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span>{room}</span>
                    {classLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <div>
                      <p className="font-semibold text-amber-200">
                        Esperando la siguiente clase
                      </p>
                      {nextClass && (
                        <p className="mt-1 text-sm text-slate-400">
                          {String(
                            nextClass.curso ??
                              nextClass.modulo ??
                              "Próxima clase"
                          )}{" "}
                          · {formatTime(getClassStart(nextClass))}
                        </p>
                      )}
                    </div>
                  </div>
                </div> 
              )}
            </div>

            <div
              className={`rounded-3xl border p-5 shadow-xl ${
                status === "success"
                  ? "border-emerald-400/30 bg-emerald-400/10"
                  : status === "error"
                  ? "border-red-400/30 bg-red-400/10"
                  : status === "warning"
                  ? "border-amber-400/30 bg-amber-400/10"
                  : "border-white/10 bg-slate-900"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-black/20 p-3">
                  {status === "success" ? (
                    <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                  ) : status === "error" ? (
                    <XCircle className="h-7 w-7 text-red-300" />
                  ) : status === "warning" ? (
                    <Clock3 className="h-7 w-7 text-amber-300" />
                  ) : processing ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <UserRound className="h-7 w-7" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">
                    Estado
                  </p>
                  <p className="mt-1 text-base font-semibold leading-6">
                    {statusMessage}
                  </p>

                  {recognized && status === "success" && (
                    <div className="mt-4 rounded-2xl bg-black/15 p-4">
                      <p className="text-xs uppercase opacity-60">
                        Estudiante identificado
                      </p>
                      <p className="mt-1 text-xl font-bold">
                        {recognized.name || recognized.person_id}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-black/15 px-3 py-1">
                          SAP: {recognized.person_id}
                        </span>
                        {recognized.similarity_percent != null && (
                          <span className="rounded-full bg-black/15 px-3 py-1">
                            Coincidencia:{" "}
                            {Number(recognized.similarity_percent).toFixed(1)}%
                          </span>
                        )}
                        {registeredAt && (
                          <span className="rounded-full bg-black/15 px-3 py-1">
                            {registeredAt}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto rounded-3xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Camera className="h-5 w-5" />
                <span>
                  Reconocimiento automático cada 3 segundos
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                La tablet está asociada de forma fija a esta aula. La asistencia
                solamente se registra cuando SAP confirma la clase y la
                correspondencia terminal–aula.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
