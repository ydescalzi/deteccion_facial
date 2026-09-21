import {
  Camera,
  CheckCircle2,
  Clock3,
  MapPin,
  MonitorSmartphone,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAcademic } from "../../context/AcademicContext";
import { useAttendance } from "../../context/AttendanceContext";
import type { Horario } from "../../data/horarios";

interface Recognition {
  recognized: boolean;
  name: string | null;
  person_id: string | null;
  person_type?: string | null;
  similarity_percent: number;
}

interface TerminalDB {
  ID?: number;
  CODIGO: string;
  NOMBRE: string;
  CODIGOAULA: string;
  PABELLON?: string | null;
  PISO?: string | null;
  TIPO?: string | null;
  ESTADO?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const dias: Array<Horario["dia"] | null> = [
  null,
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function minutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function ahora() {
  const date = new Date();

  return {
    fecha: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`,
    hora: `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes(),
    ).padStart(2, "0")}`,
    dia: dias[date.getDay()],
  };
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizarNombre(texto: string) {
  return normalizar(texto).replace(/^(dr|dra|mg|ing|prof)\.?\s+/, "");
}

export default function TerminalKiosco({ codigo }: { codigo: string }) {
  /*
   * IMPORTANTE:
   * La terminal ya no se obtiene desde AcademicContext.
   * Su configuración permanente se obtiene desde:
   *
   *   GET /api/terminales-config/{codigo}
   *
   * Así la relación TABLET -> AULA queda en la base de datos.
   */
  const { aulas, horarios, matriculas, docentes, terminales } = useAcademic();

  const {
    buscarAsistenciaPorClase,
    registrarAsistencia,
    registrarSalida,
  } = useAttendance();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mensaje, setMensaje] = useState(
    "Esperando reconocimiento facial",
  );
  const [procesando, setProcesando] = useState(false);
  const [horaActual, setHoraActual] = useState(ahora());
  const [terminal, setTerminal] = useState<TerminalDB | null>(null);
  const [terminalLoading, setTerminalLoading] = useState(true);
  const [terminalError, setTerminalError] = useState("");

  /*
   * Mientras se termina de migrar el servicio académico a SAP real,
   * mantenemos la resolución local de horario como respaldo.
   * La fuente definitiva del terminal ya es la BD.
   */
  const aula = useMemo(
    () =>
      aulas.find(
        (item) =>
          normalizar(item.codigo) === normalizar(terminal?.CODIGOAULA ?? ""),
      ),
    [aulas, terminal?.CODIGOAULA],
  );

  const terminalLocal = useMemo(
    () => terminales.find((item) => normalizar(item.codigo) === normalizar(codigo)),
    [codigo, terminales],
  );

  const clasesDelDia = useMemo(
    () =>
      horarios.filter(
        (item) =>
          item.estado === "Activo" &&
          (terminalLocal?.horarioIds?.length
            ? terminalLocal.horarioIds.includes(item.id)
            : item.aulaId === aula?.id) &&
          item.dia === horaActual.dia,
      ),
    [aula?.id, horarios, horaActual.dia, terminalLocal?.horarioIds],
  );

  const claseActiva = clasesDelDia.find((item) => {
    const actual = minutos(horaActual.hora);

    return (
      actual >= Math.max(0, minutos(item.horaInicio) - 10) &&
      actual <= minutos(item.horaFin) + 20
    );
  });

  const proximaClase = clasesDelDia
    .filter(
      (item) => minutos(item.horaInicio) > minutos(horaActual.hora),
    )
    .sort(
      (a, b) => minutos(a.horaInicio) - minutos(b.horaInicio),
    )[0];

  useEffect(() => {
    const timer = window.setInterval(
      () => setHoraActual(ahora()),
      1000,
    );

    return () => window.clearInterval(timer);
  }, []);

  /*
   * Carga de terminal desde la BD.
   * No usa terminalesIniciales ni localStorage.
   */
  useEffect(() => {
    let activo = true;

    async function cargarTerminal() {
      const codigoNormalizado = codigo.trim().toUpperCase();

      if (!codigoNormalizado) {
        setTerminal(null);
        setTerminalError("Código de terminal no válido.");
        setTerminalLoading(false);
        return;
      }

      setTerminalLoading(true);
      setTerminalError("");

      try {
        const response = await fetch(
          `${API_URL}/api/terminales-config/${encodeURIComponent(
            codigoNormalizado,
          )}`,
        );

        const data = (await response.json()) as
          | TerminalDB
          | { detail?: string; message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in data
              ? data.message || "Terminal no encontrada."
              : "detail" in data
                ? data.detail || "Terminal no encontrada."
                : `HTTP ${response.status}`,
          );
        }

        if (!("CODIGO" in data)) {
          throw new Error("La respuesta de terminal no es válida.");
        }

        if (!activo) return;

        if (
          data.ESTADO &&
          normalizar(data.ESTADO) !== "activo"
        ) {
          setTerminal(null);
          setTerminalError("La terminal está inactiva.");
          return;
        }

        setTerminal(data);
      } catch (error) {
        if (!activo) return;

        console.error("Error cargando terminal desde BD:", error);
        setTerminal(null);

        setTerminalError(
          error instanceof Error
            ? error.message
            : "No se pudo consultar la configuración de la terminal.",
        );
      } finally {
        if (activo) {
          setTerminalLoading(false);
        }
      }
    }

    void cargarTerminal();

    return () => {
      activo = false;
    };
  }, [codigo]);

  const procesarReconocimiento = async (
    recognition: Recognition,
  ) => {
    if (
      !claseActiva ||
      !recognition.recognized ||
      !recognition.person_id ||
      !recognition.name
    ) {
      return;
    }

    const fecha = horaActual.fecha;

    const existente = buscarAsistenciaPorClase(
      recognition.person_id,
      fecha,
      claseActiva.id,
    );

    const esDocente =
      recognition.person_type === "teacher";

    const docenteValido =
      esDocente &&
      docentes.some(
        (docente) =>
          (docente.id === recognition.person_id ||
            normalizarNombre(
              `${docente.nombres} ${docente.apellidos}`,
            ) ===
              normalizarNombre(
                recognition.name ?? "",
              )) &&
          normalizarNombre(
            `${docente.nombres} ${docente.apellidos}`,
          ) === normalizarNombre(claseActiva.docente),
      );

    const matriculaValida =
      !esDocente &&
      matriculas.some(
        (matricula) =>
          (matricula.estudianteId === recognition.person_id ||
            normalizar(
              matricula.estudianteNombre,
            ) ===
              normalizar(
                recognition.name ?? "",
              )) &&
          matricula.estado === "Activa" &&
          matricula.cursoId === claseActiva.cursoId &&
          matricula.seccion === claseActiva.seccion &&
          normalizar(matricula.periodo) ===
            normalizar(claseActiva.periodo),
      );

    if (!(docenteValido || matriculaValida)) {
      setMensaje("No corresponde a esta clase");
      return;
    }

    if (
      !esDocente &&
      minutos(horaActual.hora) >
        minutos(claseActiva.horaInicio) + 20
    ) {
      setMensaje("La ventana de asistencia ha finalizado");
      return;
    }

    if (existente && (!esDocente || existente.horaSalida)) {
      setMensaje("Asistencia ya registrada");
      return;
    }

    if (esDocente && existente) {
      registrarSalida(
        existente.id,
        horaActual.hora,
      );
      setMensaje("Salida registrada");
      return;
    }

    const tardanza =
      minutos(horaActual.hora) >
      minutos(claseActiva.horaInicio);

    registrarAsistencia({
      personId: recognition.person_id,
      nombre: recognition.name,
      personType: esDocente ? "teacher" : "student",
      fecha,
      horaRegistro: horaActual.hora,
      horarioId: claseActiva.id,
      cursoId: claseActiva.cursoId,
      cursoNombre: claseActiva.cursoNombre,
      seccion: claseActiva.seccion,
      docente: claseActiva.docente,
      aulaId: claseActiva.aulaId,
      aulaNombre: claseActiva.aulaNombre,
      horaInicio: claseActiva.horaInicio,
      horaFin: claseActiva.horaFin,
      periodo: claseActiva.periodo,
      estado: tardanza ? "Tardanza" : "Asistió",
      estadoEntrada: tardanza ? "Tardanza" : "Asistió",
      estadoSalida: esDocente
        ? "Pendiente"
        : undefined,
      similarityPercent:
        recognition.similarity_percent,
      metodo: "facial",
    });

    setMensaje(
      tardanza
        ? "Tardanza"
        : "Asistencia registrada",
    );
  };

  useEffect(() => {
    let activo = true;

    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      })
      .then((stream) => {
        if (
          !activo ||
          !videoRef.current
        ) {
          stream
            .getTracks()
            .forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject =
          stream;

        void videoRef.current.play();
      })
      .catch(() =>
        setMensaje(
          "No se pudo activar la cámara frontal",
        ),
      );

    return () => {
      activo = false;
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!claseActiva) return;

    const timer = window.setInterval(
      async () => {
        if (
          procesando ||
          !videoRef.current ||
          videoRef.current.readyState < 2
        ) {
          return;
        }

        setProcesando(true);

        try {
          const canvas =
            document.createElement(
              "canvas",
            );

          canvas.width =
            videoRef.current.videoWidth;
          canvas.height =
            videoRef.current.videoHeight;

          canvas
            .getContext("2d")
            ?.drawImage(
              videoRef.current,
              0,
              0,
            );

          const blob =
            await new Promise<Blob | null>(
              (resolve) =>
                canvas.toBlob(
                  resolve,
                  "image/jpeg",
                  0.85,
                ),
            );

          if (!blob) return;

          const formData =
            new FormData();

          formData.append(
            "file",
            blob,
            "terminal.jpg",
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
            throw new Error("recognize");
          }

          const data =
            (await response.json()) as {
              recognitions?: Recognition[];
            };

          const recognized =
            data.recognitions?.find(
              (item) =>
                item.recognized,
            );

          if (recognized) {
            await procesarReconocimiento(
              recognized,
            );
          }
        } catch {
          setMensaje(
            "Motor facial no disponible",
          );
        } finally {
          setProcesando(false);
        }
      },
      2500,
    );

    return () =>
      window.clearInterval(timer);
  }, [
    claseActiva,
    horaActual.fecha,
    horaActual.hora,
    procesando,
  ]);

  if (terminalLoading) {
    return (
      <div className="terminal-kiosk terminal-kiosk-error">
        <MonitorSmartphone size={42} />
        <h1>Conectando terminal</h1>
        <p>{codigo}</p>
        <small>
          Consultando configuración en la base de datos...
        </small>
      </div>
    );
  }

  if (!terminal) {
    return (
      <div className="terminal-kiosk terminal-kiosk-error">
        <ShieldAlert size={42} />
        <h1>Terminal no configurado</h1>
        <p>{codigo || "SIN CÓDIGO"}</p>
        <small>
          {terminalError ||
            "No existe una configuración activa para esta terminal."}
        </small>
      </div>
    );
  }

  const codigoAula =
    terminal.CODIGOAULA;

  const nombreAula =
    aula?.nombre ||
    codigoAula;

  const ubicacion =
    [
      terminal.PABELLON,
      terminal.PISO
        ? `Piso ${terminal.PISO}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") ||
    "Ubicación no configurada";

  return (
    <div className="terminal-kiosk">
      <header>
        <div className="terminal-brand">
          <MonitorSmartphone size={25} />

          <div>
            <strong>
              {terminal.CODIGO}
            </strong>

            <span>
              {terminal.NOMBRE ||
                "Terminal biométrico"}
            </span>
          </div>
        </div>

        <div className="terminal-clock">
          <Clock3 size={20} />
          {horaActual.hora}
        </div>
      </header>

      <main>
        <div className="terminal-camera">
          <video
            ref={videoRef}
            muted
            playsInline
          />

          <div className="terminal-camera-label">
            <Camera size={16} />
            Cámara activa
          </div>
        </div>

        <section className="terminal-info">
          <div className="terminal-location">
            <MapPin size={18} />

            <div>
              <strong>
                {codigoAula}
              </strong>

              <span>
                {nombreAula} · {ubicacion}
              </span>
            </div>
          </div>

          {claseActiva ? (
            <div className="terminal-class">
              <span>
                CLASE ACTIVA
              </span>

              <h1>
                {claseActiva.cursoNombre}
              </h1>

              <p>
                Sección{" "}
                {claseActiva.seccion} ·{" "}
                {claseActiva.docente}
              </p>

              <strong>
                {claseActiva.horaInicio} -{" "}
                {claseActiva.horaFin}
              </strong>
            </div>
          ) : (
            <div className="terminal-wait">
              <CheckCircle2 size={30} />

              <h1>
                Sin clase activa
              </h1>

              <p>
                {proximaClase
                  ? `Próxima clase: ${proximaClase.cursoNombre} a las ${proximaClase.horaInicio}`
                  : "No hay más clases programadas hoy"}
              </p>
            </div>
          )}

          <div
            className={`terminal-message ${
              mensaje ===
                "Asistencia registrada" ||
              mensaje === "Tardanza"
                ? "success"
                : ""
            }`}
          >
            {mensaje}
          </div>
        </section>
      </main>
    </div>
  );
}
