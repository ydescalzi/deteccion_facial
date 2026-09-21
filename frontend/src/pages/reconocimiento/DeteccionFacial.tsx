import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  ScanFace,
  Upload,
  XCircle,
  Clock3,
  MapPin,
  UserRound,
  GraduationCap,
  Volume2,
} from "lucide-react";

import {
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
} from "react";

import {
  useAcademic,
} from "../../context/AcademicContext";

import {
  useAttendance,
} from "../../context/AttendanceContext";

import type {
  Horario,
} from "../../data/horarios";

import type {
  EstadoAsistencia,
} from "../../data/asistencia";

import {
  determinarAccionAsistenciaDocente,
  determinarEstadoEntrada,
  MINUTOS_INGRESO_DOCENTE,
  type AccionAsistenciaDocente,
} from "../../services/asistenciaDocente";

import {
  determinarAccionAsistenciaEstudiante,
  determinarEstadoEstudiante,
  obtenerVentanaAsistenciaEstudiante,
  ventanaEstudianteFinalizada,
  type AccionAsistenciaEstudiante,
} from "../../services/asistenciaEstudiante";

/* =========================================================
   TIPOS
   ========================================================= */

interface FaceResult {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface RecognitionResult {
  face_index: number;
  recognized: boolean;
  name: string | null;
  person_id: string | null;
  person_type?: string | null;
  similarity: number;
  similarity_percent: number;
}

interface RecognizeResponse {
  success: boolean;
  faces_detected: number;
  recognitions: RecognitionResult[];
  processing_time_ms?: number;
  message?: string;
}

interface SAPEstudiante {
  CODIGOSAP: string;
  NOMBRECOMPLETO: string;
  DNI?: string;
  CARRERA?: string;
  CLAVEPLANESTUDIOS?: string;
  CODIGOESTADOESTUDIANTE?: string;
  VIGENCIA?: number;
}

interface SAPTerminal {
  CODIGO: string;
  NOMBRE: string;
  CODIGOAULA: string;
  TIPO: string;
  ESTADO: string;
  AULA: string;
}

interface SAPAsistenciaResponse {
  success: boolean;
  valido: boolean;
  codigo: string;
  mensaje?: string;
  message?: string;
  estado?: "A" | "T" | null;
  descripcion?: string | null;
  CODIGOSAP?: string;
  CONSECUTIVOOFERTA?: string;
  estudiante?: SAPEstudiante;
  oferta?: {
    CONSECUTIVOOFERTA: string;
    CLAVEEVENTO: string;
    ABREVIATURAEVENTO: string;
    EVENTO?: string;
    CLAVEPAQUETEEVENTOS?: string;
    SECCION?: string;
    CLAVEMODULO?: string;
    MODULO?: string;
    CODIGOSAPDOCENTE?: string;
    DOCENTE?: string;
    CODIGOAULA: string;
    AULA?: string;
    CODIGODIA: number;
    DIA?: string;
    HORAINICIO: string;
    HORAFIN: string;
    CODIGOTURNO?: string;
    ANO: number;
    SEMESTRE: number;
    PERIODO?: string;
    VIGENCIA: number;
  };
  terminal?: SAPTerminal;
  registro?: {
    id_asistencia: string;
    estado_asistencia: "A" | "T";
    hora_registro: string;
  };
}

/* =========================================================
   API
   ========================================================= */

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function hablarMensaje(texto: string): void {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  const voz = new SpeechSynthesisUtterance(texto);
  voz.lang = "es-ES";
  voz.rate = 0.95;
  voz.pitch = 1;
  window.speechSynthesis.speak(voz);
}

/*
 * Ventana permitida para registrar asistencia antes
 * del inicio de la clase. Permite reconocer al estudiante
 * cuando llega anticipadamente.
 */
function normalizarTexto(
  texto: string,
): string {
  return texto
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\\s+/g, " ");
}

  function normalizarNombreDocente(
    nombre: string,
  ): string {
    return normalizarTexto(nombre).replace(
      /^(dr|dra|mg|ing|prof)\.?\s+/,
      "",
    );
  }

  /* =========================================================
     RESOLVER ESTUDIANTE SAP
     ========================================================= */

  function buscarEstudianteSAP(
    estudiantes: SAPEstudiante[],
    recognition: RecognitionResult,
  ): SAPEstudiante | null {
    const personId = (recognition.person_id ?? "").trim();
    const nombreReconocido = normalizarTexto(
      recognition.name ?? "",
    );

    if (!personId && !nombreReconocido) {
      return null;
    }

    // 1. Si InsightFace ya posee el CODIGOSAP, tiene prioridad.
    const porCodigo = estudiantes.find(
      (item) => item.CODIGOSAP === personId,
    );

    if (porCodigo) {
      return porCodigo;
    }

    if (!nombreReconocido) {
      return null;
    }

    // 2. Coincidencia exacta de nombre completo.
    const exactos = estudiantes.filter(
      (item) =>
        normalizarTexto(item.NOMBRECOMPLETO) ===
        nombreReconocido,
    );

    if (exactos.length === 1) {
      return exactos[0];
    }

    // 3. Coincidencia flexible para nombres abreviados.
    // Ejemplo: InsightFace = "Juan Perez"
    //          SAP = "JUAN PEREZ GARCIA"
    const tokensReconocidos = nombreReconocido
      .split(" ")
      .filter(Boolean);

    if (tokensReconocidos.length >= 2) {
      const candidatos = estudiantes.filter((item) => {
        const tokensSAP = new Set(
          normalizarTexto(item.NOMBRECOMPLETO)
            .split(" ")
            .filter(Boolean),
        );

        return tokensReconocidos.every((token) =>
          tokensSAP.has(token),
        );
      });

      if (candidatos.length === 1) {
        return candidatos[0];
      }
    }

    return null;
  }

/* =========================================================
   UTILIDADES DE FECHA
   ========================================================= */

function obtenerFechaActual(): string {
  const ahora = new Date();

  const year =
    ahora.getFullYear();

  const month = String(
    ahora.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    ahora.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================================
   HORA ACTUAL
   ========================================================= */

function obtenerHoraActual(): string {
  const ahora = new Date();

  return `${String(
    ahora.getHours(),
  ).padStart(2, "0")}:${String(
    ahora.getMinutes(),
  ).padStart(2, "0")}`;
}

/* =========================================================
   DÍA ACTUAL
   ========================================================= */

function obtenerDiaActual():
  | Horario["dia"]
  | null {
  const dias: Array<
    Horario["dia"] | null
  > = [
    null,
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  return dias[
    new Date().getDay()
  ];
}

function crearHorarioDesdeSAP(
  oferta: NonNullable<SAPAsistenciaResponse["oferta"]>,
): Horario {
  return {
    id: `SAP-OFERTA-${oferta.CONSECUTIVOOFERTA}`,
    cursoId: `SAP-MOD-${oferta.CLAVEMODULO ?? "SIN-MODULO"}`,
    cursoNombre: oferta.MODULO ?? oferta.EVENTO ?? "Clase académica",
    seccion: oferta.SECCION ?? oferta.ABREVIATURAEVENTO.split("-").pop() ?? "—",
    docente: oferta.DOCENTE ?? oferta.CODIGOSAPDOCENTE ?? "Docente",
    aulaId: `SAP-AULA-${oferta.CODIGOAULA}`,
    aulaNombre: oferta.AULA ?? oferta.CODIGOAULA,
    dia: (oferta.DIA as Horario["dia"]) ?? "Lunes",
    horaInicio: oferta.HORAINICIO,
    horaFin: oferta.HORAFIN,
    periodo: oferta.PERIODO ?? `${oferta.ANO}-${oferta.SEMESTRE === 1 ? "I" : "II"}`,
    estado: oferta.VIGENCIA === 1 ? "Activo" : "Inactivo",
  };
}

/* =========================================================
   MINUTOS DESDE MEDIANOCHE
   ========================================================= */

function minutosDesdeMedianoche(
  hora: string,
): number {
  const [horas, minutos] =
    hora
      .split(":")
      .map(Number);

  return (
    horas * 60 +
    minutos
  );
}

/* =========================================================
   DETERMINAR ESTADO
   ========================================================= */

/* =========================================================
   COMPONENTE
   ========================================================= */

export default function DeteccionFacial() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /* =======================================================
     CONTEXTOS
     ======================================================= */

  const {
    matriculas,
    secciones,
    horarios,
    docentes,
  } = useAcademic();

  const {
    registrarAsistencia,
    buscarAsistenciaPorClase,
    registrarSalida,
    registrarFalta,
    asistencias,
  } = useAttendance();

  /* =======================================================
     ESTADOS
     ======================================================= */

  const [
    selectedImage,
    setSelectedImage,
  ] = useState<
    string | null
  >(null);

  const [
    faces,
    setFaces,
  ] = useState<
    FaceResult[]
  >([]);

  const [
    recognitions,
    setRecognitions,
  ] = useState<
    RecognitionResult[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    fileName,
    setFileName,
  ] = useState("");

  const [
    processingTime,
    setProcessingTime,
  ] = useState<
    number | null
  >(null);

  const [
    terminalesSAP,
    setTerminalesSAP,
  ] = useState<SAPTerminal[]>([]);

  const [
    terminalCodigo,
    setTerminalCodigo,
  ] = useState("TAB-302");

  const [
    terminalLoading,
    setTerminalLoading,
  ] = useState(true);

  const [
    estudiantesSAP,
    setEstudiantesSAP,
  ] = useState<SAPEstudiante[]>([]);

  const [
    modoPruebaSAP,
    setModoPruebaSAP,
  ] = useState(false);

  const [
    fechaPruebaSAP,
    setFechaPruebaSAP,
  ] = useState("2026-09-14");

  const [
    horaPruebaSAP,
    setHoraPruebaSAP,
  ] = useState("07:55");

  const ultimaDeteccionDocenteRef = useRef<{
    personId: string;
    timestamp: number;
  } | null>(null);

  const ultimaDeteccionEstudianteRef = useRef<{
    personId: string;
    timestamp: number;
  } | null>(null);

  /* =======================================================
     RESULTADO DE ASISTENCIA
     ======================================================= */

  const [
    asistenciaResultado,
    setAsistenciaResultado,
  ] = useState<{
    recognition: RecognitionResult;
    horario: Horario | null;
    estado: EstadoAsistencia | null;
    minutosTardanza: number;
    mensaje: string;
    yaRegistrada: boolean;
    ambiguo: boolean;
    accion:
      | AccionAsistenciaDocente
      | AccionAsistenciaEstudiante
      | null;
    horaEntrada?: string;
    horaSalida?: string;
  } | null>(null);

  useEffect(() => {
    if (!asistenciaResultado) {
      return;
    }

    hablarMensaje(asistenciaResultado.mensaje);

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [asistenciaResultado]);

  useEffect(() => {
    let activo = true;

    const cargarDatosSAP = async () => {
      setTerminalLoading(true);

      try {
        const [terminalesResponse, estudiantesResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/sap-test/terminales`),
            fetch(`${API_URL}/api/sap-test/estudiantes`),
          ]);

        if (!terminalesResponse.ok || !estudiantesResponse.ok) {
          throw new Error("No se pudieron cargar los datos SAP Mock.");
        }

        const terminalesData = await terminalesResponse.json();
        const estudiantesData = await estudiantesResponse.json();

        if (!activo) return;

        // Los endpoints SAP Mock devuelven las colecciones en
        // propiedades llamadas `terminales` y `estudiantes`.
        // No usamos `data` porque no existe en esta respuesta.
        const terminales = Array.isArray(terminalesData?.terminales)
          ? (terminalesData.terminales as SAPTerminal[])
          : [];

        const estudiantes = Array.isArray(estudiantesData?.estudiantes)
          ? (estudiantesData.estudiantes as SAPEstudiante[])
          : [];

        setTerminalesSAP(terminales);
        setEstudiantesSAP(estudiantes);

        if (
          terminales.length > 0 &&
          !terminales.some((item) => item.CODIGO === terminalCodigo)
        ) {
          setTerminalCodigo(terminales[0].CODIGO);
        }
      } catch (err) {
        console.error("SAP Mock:", err);
        if (activo) {
          setError(
            "No se pudieron cargar las terminales y estudiantes del SAP Mock.",
          );
        }
      } finally {
        if (activo) {
          setTerminalLoading(false);
        }
      }
    };

    cargarDatosSAP();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const generarFaltasVencidas = () => {
      const diaActual = obtenerDiaActual();
      if (!diaActual) return;

      const fecha = obtenerFechaActual();
      const horaActual = obtenerHoraActual();

      horarios
        .filter((horario) =>
          horario.estado === "Activo" &&
          horario.dia === diaActual &&
          ventanaEstudianteFinalizada(horario, horaActual),
        )
        .forEach((horario) => {
          matriculas
            .filter((matricula) =>
              matricula.estado === "Activa" &&
              matricula.cursoId === horario.cursoId &&
              matricula.seccion === horario.seccion &&
              normalizarTexto(matricula.periodo) ===
                normalizarTexto(horario.periodo),
            )
            .forEach((matricula) => {
              const tieneRegistro = asistencias.some(
                (registro) =>
                  registro.personId === matricula.estudianteId &&
                  registro.fecha === fecha &&
                  registro.horarioId === horario.id,
              );

              if (tieneRegistro) return;

              registrarFalta({
                personId: matricula.estudianteId,
                nombre: matricula.estudianteNombre,
                personType: "student",
                fecha,
                horaRegistro: "",
                horarioId: horario.id,
                cursoId: horario.cursoId,
                cursoNombre: horario.cursoNombre,
                seccion: horario.seccion,
                docente: horario.docente,
                aulaId: horario.aulaId,
                aulaNombre: horario.aulaNombre,
                horaInicio: horario.horaInicio,
                horaFin: horario.horaFin,
                periodo: horario.periodo,
                estado: "Falta",
                estadoEntrada: "Ausente",
                estadoSalida: "Pendiente",
                similarityPercent: 0,
                metodo: "facial",
              });
            });
        });
    };

    generarFaltasVencidas();
    const timer = window.setInterval(generarFaltasVencidas, 1000);

    return () => window.clearInterval(timer);
  }, [asistencias, horarios, matriculas, registrarFalta]);

  /* =======================================================
     ABRIR SELECTOR
     ======================================================= */

  const openImageSelector = () => {
    fileInputRef.current?.click();
  };

  /* =======================================================
     BUSCAR HORARIO ACTUAL
     ======================================================= */

  const buscarHorarioActual = (
    estudianteNombre: string,
  ): {
    horario: Horario | null;
    ambiguo: boolean;
  } => {
    /*
     * RELACIÓN ACADÉMICA:
     *
     * Nombre reconocido
     *      ↓
     * Matrícula activa
     *      ↓
     * seccionId
     *      ↓
     * Sección
     *      ↓
     * Curso + sección + periodo
     *      ↓
     * Horario
     *
     * No utilizamos person_id de FastAPI para localizar
     * la matrícula académica.
     */

    const nombreBuscado =
      normalizarTexto(estudianteNombre);

    if (!nombreBuscado) {
      return {
        horario: null,
        ambiguo: false,
      };
    }

    const matriculasEstudiante =
      matriculas.filter(
        (matricula) =>
          matricula.estado === "Activa" &&
          normalizarTexto(
            matricula.estudianteNombre,
          ) === nombreBuscado,
      );

    if (
      matriculasEstudiante.length === 0
    ) {
      return {
        horario: null,
        ambiguo: false,
      };
    }

    const horariosEstudiante: Horario[] = [];

    matriculasEstudiante.forEach(
      (matricula) => {
        const seccion =
          secciones.find(
            (item) =>
              item.id ===
              matricula.seccionId,
          );

        if (!seccion) {
          return;
        }

        horarios
          .filter(
            (horario) =>
              horario.estado === "Activo" &&
              horario.cursoId ===
                matricula.cursoId &&
              horario.seccion ===
                seccion.codigo &&
              normalizarTexto(
                horario.periodo,
              ) ===
                normalizarTexto(
                  matricula.periodo,
                ),
          )
          .forEach((horario) => {
            if (
              !horariosEstudiante.some(
                (item) =>
                  item.id === horario.id,
              )
            ) {
              horariosEstudiante.push(
                horario,
              );
            }
          });
      },
    );

    const diaActual =
      obtenerDiaActual();

    if (!diaActual) {
      return {
        horario: null,
        ambiguo: false,
      };
    }

    const horaActual =
      obtenerHoraActual();

    const minutosActuales =
      minutosDesdeMedianoche(
        horaActual,
      );

    /*
     * Se acepta:
     * - desde 30 minutos antes del inicio;
     * - hasta la hora de término.
     *
     * Esto permite registrar "Temprano",
     * "Puntual" o "Tardanza".
     */
    const clasesCompatibles =
      horariosEstudiante.filter(
        (horario) => {
          if (
            horario.dia !==
            diaActual
          ) {
            return false;
          }

          const inicio =
            minutosDesdeMedianoche(
              horario.horaInicio,
            );

          const inicioVentana =
            Math.max(
              0,
              inicio - 10,
            );

          return (
            minutosActuales >=
              inicioVentana &&
                minutosActuales <= inicio + 20
          );
        },
      );

    if (
      clasesCompatibles.length === 1
    ) {
      return {
        horario:
          clasesCompatibles[0],
        ambiguo: false,
      };
    }

    if (
      clasesCompatibles.length > 1
    ) {
      return {
        horario: null,
        ambiguo: true,
      };
    }

    const clasesConVentanaCerrada = horariosEstudiante.filter(
      (horario) => {
        if (horario.dia !== diaActual) return false;

        const inicio = minutosDesdeMedianoche(horario.horaInicio);
        const fin = minutosDesdeMedianoche(horario.horaFin);

        return (
          minutosActuales > inicio + 20 &&
          minutosActuales <= fin
        );
      },
    );

    if (clasesConVentanaCerrada.length === 1) {
      return {
        horario: clasesConVentanaCerrada[0],
        ambiguo: false,
      };
    }

    return {
      horario: null,
      ambiguo: false,
    };
  };

  const buscarHorarioDocenteActual = (
    docenteId: string,
    docenteNombre: string,
  ): {
    horario: Horario | null;
    ambiguo: boolean;
  } => {
    const diaActual = obtenerDiaActual();

    if (!diaActual) {
      return { horario: null, ambiguo: false };
    }

    const docente = docentes.find(
      (item) => item.id === docenteId,
    );
    const nombreBuscado = normalizarNombreDocente(
      docente?.nombres && docente?.apellidos
        ? `${docente.nombres} ${docente.apellidos}`
        : docenteNombre,
    );
    const seccionesDocente = new Set(
      secciones
        .filter((seccion) => seccion.docenteId === docenteId)
        .map((seccion) => `${seccion.cursoId}|${seccion.codigo}`),
    );
    const horaActual = minutosDesdeMedianoche(obtenerHoraActual());

    const clasesCompatibles = horarios.filter((horario) => {
      if (horario.estado !== "Activo" || horario.dia !== diaActual) {
        return false;
      }

      const inicio = minutosDesdeMedianoche(horario.horaInicio);
      const fin = minutosDesdeMedianoche(horario.horaFin);
      const dentroDeVentana =
        horaActual >= Math.max(0, inicio - MINUTOS_INGRESO_DOCENTE) &&
        horaActual <= fin + 20;
      const pertenecePorNombre =
        normalizarNombreDocente(horario.docente) === nombreBuscado;
      const pertenecePorSeccion = seccionesDocente.has(
        `${horario.cursoId}|${horario.seccion}`,
      );

      return dentroDeVentana && (pertenecePorNombre || pertenecePorSeccion);
    });

    return {
      horario: clasesCompatibles.length === 1
        ? clasesCompatibles[0]
        : null,
      ambiguo: clasesCompatibles.length > 1,
    };
  };

  /* =======================================================
     REGISTRAR ASISTENCIA
     ======================================================= */

  const obtenerFechaHoraAsistencia = () => ({
    fecha: modoPruebaSAP ? fechaPruebaSAP : obtenerFechaActual(),
    hora: modoPruebaSAP ? horaPruebaSAP : obtenerHoraActual(),
  });

  const procesarAsistencia = async (
    recognition: RecognitionResult,
  ) => {
    /*
     * Debe existir reconocimiento,
     * nombre e ID.
     *
     * El nombre será utilizado para
     * localizar el horario.
     */

    if (
      !recognition.recognized ||
      !recognition.person_id ||
      !recognition.name
    ) {
      return;
    }

    if (recognition.person_type === "teacher") {
      const ultimaDeteccion = ultimaDeteccionDocenteRef.current;
      const ahora = Date.now();

      if (
        ultimaDeteccion?.personId === recognition.person_id &&
        ahora - ultimaDeteccion.timestamp < 3000
      ) {
        return;
      }

      ultimaDeteccionDocenteRef.current = {
        personId: recognition.person_id,
        timestamp: ahora,
      };
    }

    /*
     * =====================================================
     * CAMBIO PRINCIPAL
     * =====================================================
     *
     * Antes:
     *
     * recognition.person_id
     *
     * Ahora:
     *
     * recognition.name
     *
     * Esto permite encontrar la matrícula
     * aunque el ID de FastAPI haya cambiado.
     */

    const esDocente = recognition.person_type === "teacher";

    /*
     * =====================================================
     * INTEGRACIÓN SAP MOCK - ESTUDIANTE
     * =====================================================
     *
     * InsightFace entrega la identidad biométrica.
     * El SAP Mock resuelve esa identidad a CODIGOSAP y
     * valida matrícula, oferta, aula, terminal y horario.
     */
    if (!esDocente) {
      const estudianteSAP = buscarEstudianteSAP(
        estudiantesSAP,
        recognition,
      );

      if (!estudianteSAP) {
        setAsistenciaResultado({
          recognition,
          horario: null,
          estado: null,
          minutosTardanza: 0,
          mensaje:
            "Rostro reconocido, pero la persona no fue encontrada en el SAP académico.",
          yaRegistrada: false,
          ambiguo: false,
          accion: null,
        });
        return;
      }

      const { fecha, hora } = obtenerFechaHoraAsistencia();

      try {
        const claseResponse = await fetch(
          `${API_URL}/api/sap-test/terminal/${encodeURIComponent(
            terminalCodigo,
          )}/clase-activa` +
            `?fecha=${encodeURIComponent(fecha)}` +
            `&hora=${encodeURIComponent(hora)}`,
        );

        if (!claseResponse.ok) {
          throw new Error(
            `Servicio de clase activa respondió con ${claseResponse.status}`,
          );
        }

        const claseData = await claseResponse.json();
        const ofertaActiva = claseData.clase_activa;

        if (!ofertaActiva) {
          setAsistenciaResultado({
            recognition,
            horario: null,
            estado: null,
            minutosTardanza: 0,
            mensaje:
              claseData.proxima_clase
                ? `No hay una clase activa en esta terminal. Próxima clase: ${claseData.proxima_clase.MODULO ?? claseData.proxima_clase.EVENTO ?? "Clase"} a las ${claseData.proxima_clase.HORAINICIO}.`
                : "No existe una clase activa en esta terminal.",
            yaRegistrada: false,
            ambiguo: false,
            accion: null,
          });
          return;
        }

        const horarioSAP = crearHorarioDesdeSAP(ofertaActiva);

        const registroResponse = await fetch(
          `${API_URL}/api/sap-test/asistencia/registrar` +
            `?codigosap=${encodeURIComponent(estudianteSAP.CODIGOSAP)}` +
            `&oferta=${encodeURIComponent(
              ofertaActiva.CONSECUTIVOOFERTA,
            )}` +
            `&terminal=${encodeURIComponent(terminalCodigo)}` +
            `&fecha=${encodeURIComponent(fecha)}` +
            `&hora=${encodeURIComponent(hora)}`,
          {
            method: "POST",
          },
        );

        if (!registroResponse.ok) {
          throw new Error(
            `Servicio de asistencia respondió con ${registroResponse.status}`,
          );
        }

        const registroData =
          (await registroResponse.json()) as SAPAsistenciaResponse;

        const estadoLocal: EstadoAsistencia | null =
          registroData.estado === "A"
            ? "Asistió"
            : registroData.estado === "T"
              ? "Tardanza"
              : null;

        const minutosTardanza =
          registroData.estado === "T"
            ? Math.max(
                0,
                minutosDesdeMedianoche(hora) -
                  minutosDesdeMedianoche(
                    horarioSAP.horaInicio,
                  ),
              )
            : 0;

        /*
         * Solo sincronizamos el registro local cuando SAP confirma
         * que la asistencia fue registrada. Esto evita que React
         * muestre asistencia cuando SAP la rechazó.
         */
        if (registroData.success && registroData.registro) {
          const asistenciaLocalExistente =
            buscarAsistenciaPorClase(
              recognition.person_id,
              fecha,
              horarioSAP.id,
            );

          if (!asistenciaLocalExistente) {
            registrarAsistencia({
              personId: recognition.person_id,
              nombre: recognition.name,
              personType: "student",
              fecha,
              horaRegistro: hora,
              horarioId: horarioSAP.id,
              cursoId: horarioSAP.cursoId,
              cursoNombre: horarioSAP.cursoNombre,
              seccion: horarioSAP.seccion,
              docente: horarioSAP.docente,
              aulaId: horarioSAP.aulaId,
              aulaNombre: horarioSAP.aulaNombre,
              horaInicio: horarioSAP.horaInicio,
              horaFin: horarioSAP.horaFin,
              periodo: horarioSAP.periodo,
              estado: estadoLocal ?? "Asistió",
              estadoEntrada: estadoLocal ?? "Asistió",
              similarityPercent:
                recognition.similarity_percent,
              metodo: "facial",
            });
          }
        }

        let mensaje =
          registroData.mensaje ??
          registroData.message ??
          "No se pudo registrar la asistencia.";

        if (registroData.codigo === "ASISTENCIA_REGISTRADA") {
          mensaje =
            registroData.estado === "T"
              ? `Asistencia registrada con tardanza de ${minutosTardanza} minutos.`
              : "Asistencia registrada correctamente.";
        } else if (registroData.codigo === "YA_REGISTRADO") {
          mensaje = "Usted ya cuenta con asistencia registrada para esta clase.";
        }

        setAsistenciaResultado({
          recognition,
          horario: horarioSAP,
          estado: estadoLocal,
          minutosTardanza,
          mensaje,
          yaRegistrada:
            registroData.codigo === "YA_REGISTRADO",
          ambiguo: false,
          accion:
            registroData.codigo === "ASISTENCIA_REGISTRADA"
              ? "registrar-asistencia"
              : registroData.codigo === "YA_REGISTRADO"
                ? "asistencia-registrada"
                : null,
          horaEntrada:
            registroData.registro?.hora_registro ??
            undefined,
        });

        return;
      } catch (err) {
        console.error("Integración SAP Mock:", err);
        setAsistenciaResultado({
          recognition,
          horario: null,
          estado: null,
          minutosTardanza: 0,
          mensaje:
            "No se pudo completar la validación de asistencia contra el SAP Mock.",
          yaRegistrada: false,
          ambiguo: false,
          accion: null,
        });
        return;
      }
    }

    const resultadoHorario = esDocente
      ? buscarHorarioDocenteActual(
          recognition.person_id,
          recognition.name,
        )
      : buscarHorarioActual(recognition.name);

    /* =====================================================
       SIN HORARIO
       ===================================================== */

    if (
      !resultadoHorario.horario
    ) {
      setAsistenciaResultado({
        recognition,
        horario: null,
        estado: null,
        minutosTardanza: 0,
        mensaje:
          resultadoHorario.ambiguo
            ? `El ${esDocente ? "docente" : "estudiante"} tiene más de una clase compatible en este momento. No se registró la entrada para evitar asignarla al curso equivocado.`
            : esDocente
              ? "El docente no tiene una clase compatible con la fecha y hora actuales."
              : "El estudiante no tiene una clase compatible con la fecha y hora actuales. La asistencia se habilita 10 minutos antes y finaliza 20 minutos después del inicio.",
        yaRegistrada: false,
        ambiguo:
          resultadoHorario.ambiguo,
        accion: null,
      });

      return;
    }

    const horario =
      resultadoHorario.horario;

    const fecha =
      obtenerFechaActual();

    const horaRegistro =
      obtenerHoraActual();

    if (esDocente) {
      const asistenciaExistente = buscarAsistenciaPorClase(
        recognition.person_id,
        fecha,
        horario.id,
      );
      const accion = determinarAccionAsistenciaDocente(
        horario,
        horaRegistro,
        asistenciaExistente,
      );

      if (accion === "registrar-entrada") {
        const estado = determinarEstadoEntrada(
          horaRegistro,
          horario.horaInicio,
        );

        registrarAsistencia({
          personId: recognition.person_id,
          nombre: recognition.name,
          personType: "teacher",
          fecha,
          horaRegistro,
          horarioId: horario.id,
          cursoId: horario.cursoId,
          cursoNombre: horario.cursoNombre,
          seccion: horario.seccion,
          docente: horario.docente,
          aulaId: horario.aulaId,
          aulaNombre: horario.aulaNombre,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          periodo: horario.periodo,
          estado,
          estadoEntrada: estado,
          estadoSalida: "Pendiente",
          similarityPercent: recognition.similarity_percent,
          metodo: "facial",
        });

        setAsistenciaResultado({
          recognition,
          horario,
          estado,
          minutosTardanza: Math.max(
            0,
            minutosDesdeMedianoche(horaRegistro) -
              minutosDesdeMedianoche(horario.horaInicio),
          ),
          mensaje: "Entrada registrada correctamente.",
          yaRegistrada: false,
          ambiguo: false,
          accion,
          horaEntrada: horaRegistro,
        });
        return;
      }

      if (accion === "registrar-salida" && asistenciaExistente) {
        registrarSalida(asistenciaExistente.id, horaRegistro);
        setAsistenciaResultado({
          recognition,
          horario,
          estado: asistenciaExistente.estado,
          minutosTardanza: 0,
          mensaje: "Salida registrada correctamente.",
          yaRegistrada: false,
          ambiguo: false,
          accion,
          horaEntrada: asistenciaExistente.horaRegistro,
          horaSalida: horaRegistro,
        });
        return;
      }

      const mensajePorAccion: Record<AccionAsistenciaDocente, string> = {
        "registrar-entrada": "Entrada registrada correctamente.",
        "registrar-salida": "Salida registrada correctamente.",
        "entrada-registrada": "Usted ya cuenta con una entrada registrada.",
        "salida-no-disponible": `Su salida aún no está disponible. Estará disponible desde las ${horario.horaFin}.`,
        "salida-registrada": "Usted ya cuenta con una salida registrada.",
        "ventana-cerrada": "La ventana de registro ha finalizado.",
      };

      setAsistenciaResultado({
        recognition,
        horario,
        estado: asistenciaExistente?.estado ?? null,
        minutosTardanza: 0,
        mensaje: mensajePorAccion[accion],
        yaRegistrada:
          accion === "entrada-registrada" ||
          accion === "salida-registrada",
        ambiguo: false,
        accion,
        horaEntrada: asistenciaExistente?.horaRegistro,
        horaSalida: asistenciaExistente?.horaSalida,
      });
      return;
    }

    const ultimaDeteccionEstudiante =
      ultimaDeteccionEstudianteRef.current;
    const ahora = Date.now();

    if (
      ultimaDeteccionEstudiante?.personId === recognition.person_id &&
      ahora - ultimaDeteccionEstudiante.timestamp < 3000
    ) {
      return;
    }

    ultimaDeteccionEstudianteRef.current = {
      personId: recognition.person_id,
      timestamp: ahora,
    };

    const asistenciaExistente = buscarAsistenciaPorClase(
      recognition.person_id,
      fecha,
      horario.id,
    );
    const accion = determinarAccionAsistenciaEstudiante(
      horario,
      horaRegistro,
      asistenciaExistente,
    );

    if (accion === "registrar-asistencia") {
      const estado = determinarEstadoEstudiante(
        horaRegistro,
        horario.horaInicio,
      );

      registrarAsistencia({
        personId: recognition.person_id,
        nombre: recognition.name,
        personType: "student",
        fecha,
        horaRegistro,
        horarioId: horario.id,
        cursoId: horario.cursoId,
        cursoNombre: horario.cursoNombre,
        seccion: horario.seccion,
        docente: horario.docente,
        aulaId: horario.aulaId,
        aulaNombre: horario.aulaNombre,
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        periodo: horario.periodo,
        estado,
        estadoEntrada: estado,
        similarityPercent: recognition.similarity_percent,
        metodo: "facial",
      });

      setAsistenciaResultado({
        recognition,
        horario,
        estado,
        minutosTardanza: Math.max(
          0,
          minutosDesdeMedianoche(horaRegistro) -
            minutosDesdeMedianoche(horario.horaInicio),
        ),
        mensaje: "¡Asistencia registrada!",
        yaRegistrada: false,
        ambiguo: false,
        accion,
        horaEntrada: horaRegistro,
      });
      return;
    }

    const ventana = obtenerVentanaAsistenciaEstudiante(horario);
    const mensaje = asistenciaExistente?.estado === "Falta"
      ? "El periodo de registro ha finalizado. El registro corresponde como falta/no ingreso."
      : accion === "asistencia-registrada"
        ? "Usted ya cuenta con asistencia registrada."
        : `El periodo de registro ha finalizado. El registro corresponde como falta/no ingreso. La ventana terminó a las ${String(Math.floor(ventana.hasta / 60)).padStart(2, "0")}:${String(ventana.hasta % 60).padStart(2, "0")}.`;

    setAsistenciaResultado({
      recognition,
      horario,
      estado: asistenciaExistente?.estado ?? null,
      minutosTardanza: 0,
      mensaje,
      yaRegistrada: accion === "asistencia-registrada",
      ambiguo: false,
      accion,
      horaEntrada: asistenciaExistente?.horaRegistro,
    });
    return;
  };

  /* =======================================================
     CAMBIO DE IMAGEN
     ======================================================= */

  const handleImageChange =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      setError(null);
      setFaces([]);
      setRecognitions([]);
      setProcessingTime(null);
      setAsistenciaResultado(
        null,
      );
      setFileName(
        file.name,
      );

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      if (
        !allowedTypes.includes(
          file.type,
        )
      ) {
        setError(
          "Formato no válido. Utiliza JPG, JPEG o PNG.",
        );

        return;
      }

      /*
       * Liberar URL anterior.
       */

      if (selectedImage) {
        URL.revokeObjectURL(
          selectedImage,
        );
      }

      const previewUrl =
        URL.createObjectURL(
          file,
        );

      setSelectedImage(
        previewUrl,
      );

      await detectImage(
        file,
      );
    };

  /* =======================================================
     DETECCIÓN + RECONOCIMIENTO
     ======================================================= */

  const detectImage = async (
    file: File,
  ) => {
    setLoading(true);
    setError(null);
    setAsistenciaResultado(
      null,
    );

    const startTime =
      performance.now();

    try {
      /* ===================================================
         RECONOCIMIENTO
         =================================================== */

      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          `${API_URL}/api/recognize`,
          {
            method: "POST",
            body: formData,
          },
        );

      if (!response.ok) {
        throw new Error(
          `Servidor respondió con ${response.status}`,
        );
      }

      const data: RecognizeResponse =
        await response.json();

      if (!data.success) {
        throw new Error(
          data.message ||
            "No se pudo analizar la imagen.",
        );
      }

      const resultados =
        data.recognitions ||
        [];

      setRecognitions(
        resultados,
      );

      /* ===================================================
         DETECCIÓN
         =================================================== */

      const detectFormData =
        new FormData();

      detectFormData.append(
        "file",
        file,
      );

      const detectResponse =
        await fetch(
          `${API_URL}/api/detect`,
          {
            method: "POST",
            body: detectFormData,
          },
        );

      if (
        detectResponse.ok
      ) {
        const detectData: {
          success: boolean;
          faces?: FaceResult[];
        } =
          await detectResponse.json();

        setFaces(
          detectData.success
            ? detectData.faces ||
                []
            : [],
        );
      } else {
        setFaces([]);
      }

      /* ===================================================
         PROCESAR ASISTENCIA
         =================================================== */

      const reconocidos =
        resultados.filter(
          (item) =>
            item.recognized &&
            item.person_id &&
            item.name,
        );

      /*
       * Fotografía individual:
       * procesar automáticamente.
       */

      if (
        reconocidos.length ===
        1
      ) {
        await procesarAsistencia(
          reconocidos[0],
        );
      } else if (
        reconocidos.length > 1
      ) {
        setAsistenciaResultado({
          recognition:
            reconocidos[0],
          horario: null,
          estado: null,
          minutosTardanza: 0,
          mensaje:
            "Se reconocieron varias personas. El registro automático de asistencia requiere procesarlas individualmente.",
          yaRegistrada: false,
          ambiguo: true,
          accion: null,
        });
      }

      /* ===================================================
         TIEMPO
         =================================================== */

      const elapsed =
        performance.now() -
        startTime;

      setProcessingTime(
        Number(
          (
            elapsed / 1000
          ).toFixed(2),
        ),
      );
    } catch (err) {
      console.error(err);

      setError(
        "No se pudo completar la operación. " +
          "Verifica que FastAPI esté ejecutándose en " +
          "http://127.0.0.1:8000.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LIMPIAR
     ======================================================= */

  const clearImage = () => {
    if (selectedImage) {
      URL.revokeObjectURL(
        selectedImage,
      );
    }

    setSelectedImage(null);
    setFaces([]);
    setRecognitions([]);
    setError(null);
    setFileName("");
    setProcessingTime(null);
    setAsistenciaResultado(
      null,
    );

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="page">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="page-title">

        <div>

          <h2>
            Detección facial
          </h2>

          <p>
            Detecta rostros utilizando
            el motor de inteligencia
            artificial de la USMP.
          </p>

        </div>

        <div className="facial-engine-status">

          <span />

          IA activa

        </div>

      </div>

      {/* =====================================================
          MÓDULO PRINCIPAL
          ===================================================== */}

      <section className="content-card facial-module">

        <div className="facial-module-header">

          <div>

            <div className="section-label">

              <ScanFace size={15} />

              RECONOCIMIENTO FACIAL

            </div>

            <h3>
              Analizar una fotografía
            </h3>

            <p>
              Selecciona una imagen
              para detectar el rostro
              y comprobar si corresponde
              a una persona registrada.
            </p>

          </div>

          {selectedImage && (
            <button
              className="facial-clear-button"
              onClick={
                clearImage
              }
              type="button"
            >

              <XCircle size={16} />

              Limpiar

            </button>
          )}

        </div>

        {/* ===================================================
            TERMINAL BIOMÉTRICO / SAP MOCK
            =================================================== */}

        <div
          className="facial-information"
          style={{
            marginBottom: "18px",
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) auto auto",
            gap: "12px",
            alignItems: "end",
          }}
        >
          <div>
            <label
              htmlFor="terminal-sap"
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              Terminal biométrico
            </label>

            <select
              id="terminal-sap"
              value={terminalCodigo}
              disabled={terminalLoading}
              onChange={(event) =>
                setTerminalCodigo(event.target.value)
              }
              style={{
                width: "100%",
                minHeight: "40px",
                borderRadius: "8px",
                border: "1px solid #d6dbe3",
                padding: "0 10px",
                background: "#fff",
              }}
            >
              {terminalLoading && (
                <option value="">Cargando terminales...</option>
              )}

              {!terminalLoading && terminalesSAP.length === 0 && (
                <option value="">No hay terminales disponibles</option>
              )}

              {terminalesSAP.map((terminal) => (
                <option
                  key={terminal.CODIGO}
                  value={terminal.CODIGO}
                >
                  {terminal.CODIGO} · {terminal.CODIGOAULA} · {terminal.AULA}
                </option>
              ))}
            </select>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minHeight: "40px",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <input
              type="checkbox"
              checked={modoPruebaSAP}
              onChange={(event) =>
                setModoPruebaSAP(event.target.checked)
              }
            />
            Modo prueba SAP
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "130px 90px",
              gap: "8px",
              opacity: modoPruebaSAP ? 1 : 0.55,
            }}
          >
            <input
              type="date"
              value={fechaPruebaSAP}
              disabled={!modoPruebaSAP}
              onChange={(event) =>
                setFechaPruebaSAP(event.target.value)
              }
              aria-label="Fecha de prueba SAP"
              style={{
                minHeight: "40px",
                borderRadius: "8px",
                border: "1px solid #d6dbe3",
                padding: "0 8px",
              }}
            />

            <input
              type="time"
              value={horaPruebaSAP}
              disabled={!modoPruebaSAP}
              onChange={(event) =>
                setHoraPruebaSAP(event.target.value)
              }
              aria-label="Hora de prueba SAP"
              style={{
                minHeight: "40px",
                borderRadius: "8px",
                border: "1px solid #d6dbe3",
                padding: "0 8px",
              }}
            />
          </div>
        </div>

        <div
          style={{
            marginBottom: "18px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#f6f8fb",
            border: "1px solid #e5e9f0",
            fontSize: "13px",
          }}
        >
          <strong>Fuente académica:</strong> SAP Mock ·{" "}
          <strong>Terminal:</strong> {terminalCodigo} ·{" "}
          {modoPruebaSAP
            ? `Simulación ${fechaPruebaSAP} ${horaPruebaSAP}`
            : "fecha y hora reales del equipo"}
        </div>

        {/* ===================================================
            INPUT
            =================================================== */}

        <input
          ref={fileInputRef}
          type="file"
          aria-label="Seleccionar imagen para reconocimiento facial"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={
            handleImageChange
          }
          hidden
        />

        {/* ===================================================
            SELECTOR
            =================================================== */}

        {!selectedImage ? (

          <div
            className="upload-zone"
            onClick={
              openImageSelector
            }
            role="button"
            tabIndex={0}
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                  "Enter" ||
                event.key === " "
              ) {
                openImageSelector();
              }
            }}
          >

            <div className="upload-icon">

              <ImagePlus
                size={32}
              />

            </div>

            <h3>
              Selecciona una imagen
            </h3>

            <p>
              Arrastra una fotografía
              aquí o selecciona un
              archivo desde tu equipo.
            </p>

            <button
              className="btn-primary"
              type="button"
              onClick={(
                event,
              ) => {
                event.stopPropagation();

                openImageSelector();
              }}
            >

              <Upload size={17} />

              Seleccionar imagen

            </button>

            <span className="upload-formats">
              JPG · JPEG · PNG
            </span>

          </div>

        ) : (

          <div className="facial-analysis-area">

            {/* =================================================
                IMAGEN
                ================================================= */}

            <div className="facial-image-panel">

              <div className="facial-image-wrapper">

                <img
                  src={
                    selectedImage
                  }
                  alt="Imagen seleccionada para análisis"
                />

                {faces.map(
                  (
                    face,
                    index,
                  ) => (

                    <div
                      key={`${face.x}-${face.y}-${index}`}
                      className="face-box"
                      style={{
                        left: `${face.x}px`,
                        top: `${face.y}px`,
                        width: `${face.width}px`,
                        height: `${face.height}px`,
                      }}
                    >

                      <span>

                        Rostro{" "}
                        {index + 1}

                        {" · "}

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

                {loading && (

                  <div className="image-loading">

                    <Loader2
                      size={28}
                      className="spin"
                    />

                    <span>
                      Analizando imagen...
                    </span>

                  </div>

                )}

              </div>

            </div>

            {/* =================================================
                RESULTADO
                ================================================= */}

            <div className="facial-result-panel">

              <div className="result-summary">

                <div>

                  <span>
                    Rostros detectados
                  </span>

                  <strong>
                    {loading
                      ? "..."
                      : faces.length}
                  </strong>

                </div>

                {!loading &&
                  processingTime !==
                    null && (

                    <div className="processing-time">

                      <span>
                        Tiempo de análisis
                      </span>

                      <strong>
                        {
                          processingTime
                        }s
                      </strong>

                    </div>

                  )}

              </div>

              {/* =================================================
                  RESULTADO DE ASISTENCIA
                  ================================================= */}

              {!loading &&
                asistenciaResultado && (

                  <div
                    className={`attendance-welcome ${
                      asistenciaResultado.estado ===
                      "Tardanza"
                        ? "attendance-late"
                        : asistenciaResultado.estado ===
                              "Falta"
                          ? "attendance-warning attendance-no-class"
                          : asistenciaResultado.estado ===
                              "Asistió" ||
                            asistenciaResultado.estado ===
                              "Temprano" ||
                            asistenciaResultado.estado ===
                              "Puntual"
                          ? "attendance-success"
                          : "attendance-warning attendance-no-class"
                    }`}
                  >

                    <div className="attendance-welcome-icon">

                      {asistenciaResultado.estado === "Tardanza" ? (

                        <Clock3
                          size={25}
                        />

                      ) : (

                        asistenciaResultado.estado === "Falta" ||
                        !asistenciaResultado.horario ? (
                          <XCircle size={25} />
                        ) : (
                          <CheckCircle2 size={25} />
                        )

                      )}

                    </div>

                    <div>

                      <span className="attendance-kicker">

                        {asistenciaResultado.accion ===
                        "registrar-salida"
                          ? "SALIDA REGISTRADA"
                          : asistenciaResultado.accion ===
                              "salida-registrada"
                            ? "SALIDA YA REGISTRADA"
                            : asistenciaResultado.accion ===
                                "entrada-registrada"
                              ? "ENTRADA YA REGISTRADA"
                              : asistenciaResultado.accion ===
                                  "asistencia-registrada"
                                ? "ASISTENCIA YA REGISTRADA"
                                : asistenciaResultado.estado ===
                                    "Asistió"
                                  ? "ASISTIÓ"
                              : asistenciaResultado.accion ===
                                  "ventana-cerrada"
                                ? "VENTANA CERRADA"
                                : asistenciaResultado.estado ===
                                    "Tardanza"
                          ? "ASISTENCIA CON TARDANZA"
                                  : asistenciaResultado.estado ===
                                      "Temprano" ||
                                    asistenciaResultado.estado ===
                                      "Puntual"
                                    ? "ENTRADA REGISTRADA"
                                    : "CLASE NO ENCONTRADA"}

                      </span>

                      <h3>
                        {
                          asistenciaResultado
                            .recognition
                            .name
                        }
                      </h3>

                      <p>
                        {
                          asistenciaResultado
                            .mensaje
                        }
                      </p>

                      <button
                        type="button"
                        className="attendance-speak-button"
                        onClick={() =>
                          hablarMensaje(
                            asistenciaResultado.mensaje,
                          )
                        }
                        title="Reproducir mensaje"
                      >
                        <Volume2 size={15} />
                        Escuchar mensaje
                      </button>

                    </div>

                  </div>

                )}

              {/* =================================================
                  INFORMACIÓN DE CLASE
                  ================================================= */}

              {!loading &&
                asistenciaResultado?.horario && (

                  <div className="attendance-class-card">

                    <div className="attendance-class-header">

                      <div>

                        <span>
                          CLASE ACTUAL
                        </span>

                        <strong>
                          {
                            asistenciaResultado
                              .horario
                              .cursoNombre
                          }
                        </strong>

                      </div>

                      <span className="code-badge">

                        Sección{" "}

                        {
                          asistenciaResultado
                            .horario
                            .seccion
                        }

                      </span>

                    </div>

                    <div className="attendance-class-grid">

                      <div>

                        <UserRound
                          size={15}
                        />

                        <span>
                          Docente
                        </span>

                        <strong>
                          {
                            asistenciaResultado
                              .horario
                              .docente
                          }
                        </strong>

                      </div>

                      <div>

                        <MapPin
                          size={15}
                        />

                        <span>
                          Aula
                        </span>

                        <strong>
                          {
                            asistenciaResultado
                              .horario
                              .aulaNombre
                          }
                        </strong>

                      </div>

                      <div>

                        <Clock3
                          size={15}
                        />

                        <span>
                          Horario
                        </span>

                        <strong>

                          {
                            asistenciaResultado
                              .horario
                              .horaInicio
                          }

                          {" - "}

                          {
                            asistenciaResultado
                              .horario
                              .horaFin
                          }

                        </strong>

                      </div>

                      <div>

                        <GraduationCap
                          size={15}
                        />

                        <span>
                          Periodo
                        </span>

                        <strong>
                          {
                            asistenciaResultado
                              .horario
                              .periodo
                          }
                        </strong>

                      </div>

                    </div>

                    {asistenciaResultado && (
                      <div className="attendance-entry-summary">
                        <strong>
                          Entrada: {asistenciaResultado.estado
                            ? asistenciaResultado.estado
                            : "Pendiente"}
                        </strong>
                        <strong>
                          Hora: {asistenciaResultado.horaEntrada ?? "Pendiente"}
                        </strong>
                        <strong>
                          Salida: {asistenciaResultado.horaSalida ?? "Pendiente"}
                        </strong>
                      </div>
                    )}

                  </div>

                )}

              {/* =================================================
                  RESULTADOS FACIALES
                  ================================================= */}

              {loading ? (

                <div className="result-loading">

                  <Loader2
                    size={24}
                    className="spin"
                  />

                  <span>
                    Procesando con
                    InsightFace...
                  </span>

                </div>

              ) : faces.length > 0 ? (

                <div className="faces-list">

                  {faces.map(
                    (
                      face,
                      index,
                    ) => {

                      const recognition =
                        recognitions.find(
                          (
                            item,
                          ) =>
                            item.face_index ===
                            index + 1,
                        );

                      const isRecognized =
                        recognition?.recognized ===
                        true;

                      return (

                        <div
                          className="face-result"
                          key={`${face.x}-${face.y}-${index}`}
                        >

                          <div className="face-number">
                            {index + 1}
                          </div>

                          <div className="face-info">

                            <strong>

                              {isRecognized
                                ? recognition?.name
                                : "Rostro no reconocido"}

                            </strong>

                            <span>

                              {isRecognized
                                ? `${
                                    recognition?.person_type ||
                                    "Persona registrada"
                                  } · ID: ${
                                    recognition?.person_id ||
                                    "—"
                                  }`
                                : "No existe una coincidencia suficiente entre las personas registradas."}

                            </span>

                          </div>

                          <div
                            className="face-confidence"
                            title={
                              isRecognized
                                ? "Similitud con la persona registrada"
                                : "Mayor similitud encontrada"
                            }
                          >

                            {isRecognized ? (

                              <CheckCircle2
                                size={16}
                              />

                            ) : (

                              <XCircle
                                size={16}
                              />

                            )}

                            {recognition
                              ? `${recognition.similarity_percent.toFixed(
                                  2,
                                )}%`
                              : `${(
                                  face.confidence *
                                  100
                                ).toFixed(
                                  2,
                                )}%`}

                          </div>

                        </div>

                      );
                    },
                  )}

                </div>

              ) : (

                <div className="no-faces">

                  <ScanFace
                    size={28}
                  />

                  <strong>
                    No se detectaron
                    rostros
                  </strong>

                  <span>
                    Prueba con una
                    fotografía donde
                    los rostros sean
                    visibles.
                  </span>

                </div>

              )}

            </div>

          </div>

        )}

        {/* =====================================================
            ERROR
            ===================================================== */}

        {error && (

          <div className="facial-error">

            <XCircle
              size={18}
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

        )}

        {/* =====================================================
            INFORMACIÓN
            ===================================================== */}

        {!selectedImage &&
          !error && (

            <div className="facial-information">

              <div>

                <CheckCircle2
                  size={16}
                />

                <span>
                  Procesamiento mediante
                  FastAPI
                </span>

              </div>

              <div>

                <CheckCircle2
                  size={16}
                />

                <span>
                  Motor InsightFace /
                  SCRFD
                </span>

              </div>

              <div>

                <CheckCircle2
                  size={16}
                />

                <span>
                  Compatible con JPG,
                  JPEG y PNG
                </span>

              </div>

            </div>

          )}

        {/* =====================================================
            ARCHIVO
            ===================================================== */}

        {fileName && (

          <div className="selected-file">

            <ImagePlus
              size={15}
            />

            <span>
              {fileName}
            </span>

          </div>

        )}

      </section>

    </div>
  );
}