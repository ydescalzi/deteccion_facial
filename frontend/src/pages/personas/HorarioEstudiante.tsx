import {
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAcademic } from "../../context/AcademicContext";
import type { Horario } from "../../data/horarios";

interface EstudianteHorario {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
}

interface HorarioEstudianteProps {
  estudiante: EstudianteHorario;
  onClose: () => void;
  onOpenRecognition: () => void;
}

const dias: Horario["dia"][] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const fechaActual = () => {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
};

const normalizar = (texto: string) =>
  texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function HorarioEstudiante({
  estudiante,
  onClose,
  onOpenRecognition,
}: HorarioEstudianteProps) {
  const {
    horarios,
    matriculas,
    secciones,
    agregarMatricula,
  } = useAcademic();
  const [mensaje, setMensaje] = useState("");
  const [seccionAAsignar, setSeccionAAsignar] = useState("");

  const horariosEstudiante = useMemo(
    () => {
      const nombreEstudiante = normalizar(`${estudiante.firstName} ${estudiante.lastName}`);
      const matriculasEstudiante = matriculas.filter((matricula) =>
        matricula.estado === "Activa" &&
        (matricula.estudianteId === estudiante.id ||
          normalizar(matricula.estudianteNombre) === nombreEstudiante),
      );

      return horarios
        .filter((horario) => horario.estado === "Activo")
        .filter((horario) => matriculasEstudiante.some((matricula) => {
          const seccion = secciones.find((item) => item.id === matricula.seccionId);

          return matricula.cursoId === horario.cursoId &&
            matricula.seccion === horario.seccion &&
            matricula.periodo.trim().toLowerCase() === horario.periodo.trim().toLowerCase() &&
            (!seccion || seccion.codigo === horario.seccion);
        }))
        .sort((a, b) => {
          const diaA = dias.indexOf(a.dia);
          const diaB = dias.indexOf(b.dia);
          return diaA - diaB || a.horaInicio.localeCompare(b.horaInicio);
        });
    },
    [estudiante.firstName, estudiante.id, estudiante.lastName, horarios, matriculas, secciones],
  );

  const seccionesDisponibles = useMemo(
    () => secciones.filter((seccion) =>
      seccion.estado === "Activo" &&
      horarios.some((horario) =>
        horario.estado === "Activo" &&
        horario.cursoId === seccion.cursoId &&
        horario.seccion === seccion.codigo &&
        horario.periodo.trim().toLowerCase() === seccion.periodo.trim().toLowerCase(),
      ),
    ),
    [horarios, secciones],
  );

  const asignarHorario = () => {
    const seccion = seccionesDisponibles.find((item) => item.id === seccionAAsignar);

    if (!seccion) {
      setMensaje("Selecciona una sección para asignar el horario.");
      return;
    }

    const nombreEstudiante = `${estudiante.firstName} ${estudiante.lastName}`;
    const yaMatriculado = matriculas.some((matricula) =>
      matricula.estado === "Activa" &&
      (matricula.estudianteId === estudiante.id ||
        normalizar(matricula.estudianteNombre) === normalizar(nombreEstudiante)) &&
      matricula.seccionId === seccion.id,
    );

    if (yaMatriculado) {
      setMensaje("El estudiante ya tiene asignada esta sección.");
      return;
    }

    agregarMatricula({
      estudianteId: estudiante.id,
      estudianteNombre: nombreEstudiante,
      cursoId: seccion.cursoId,
      cursoNombre: seccion.cursoNombre,
      seccionId: seccion.id,
      seccion: seccion.codigo,
      periodo: seccion.periodo,
      fechaMatricula: fechaActual(),
      estado: "Activa",
    });
    setSeccionAAsignar("");
    setMensaje(`Horario asignado: ${seccion.cursoNombre}, sección ${seccion.codigo}.`);
  };

  const horariosPorDia = useMemo(
    () => dias.map((dia) => ({
      dia,
      horarios: horariosEstudiante.filter((horario) => horario.dia === dia),
    })).filter((grupo) => grupo.horarios.length > 0),
    [horariosEstudiante],
  );

  return (
    <div className="student-schedule-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="student-schedule-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="student-schedule-header">
          <div className="student-schedule-title">
            <div className="student-schedule-icon"><CalendarDays size={22} /></div>
            <div>
              <span>HORARIO ACADÉMICO</span>
              <h2>{estudiante.firstName} {estudiante.lastName}</h2>
              <p>Código {estudiante.code}</p>
            </div>
          </div>
          <button type="button" className="student-schedule-close" onClick={onClose} aria-label="Cerrar horario">
            <X size={19} />
          </button>
        </header>

        <div className="student-schedule-body">
          <div className="student-schedule-callout">
            <GraduationCap size={18} />
            <span>Consulta todos sus horarios. La asistencia se registra únicamente mediante reconocimiento facial.</span>
          </div>

          {mensaje && <div className="student-schedule-message">{mensaje}</div>}

          {horariosPorDia.length === 0 ? (
            <div className="student-schedule-empty">
              <GraduationCap size={34} />
              <strong>No tiene horarios asignados</strong>
              <span>Asígnale una sección activa para generar su horario.</span>
            </div>
          ) : (
            <div className="student-schedule-list">
              {horariosPorDia.map(({ dia, horarios: horariosDelDia }) => (
                <section key={dia} className="student-schedule-day">
                  <div className="student-schedule-day-title"><CalendarDays size={15} />{dia}</div>
                  {horariosDelDia.map((horario) => (
                      <div className="student-schedule-item" key={horario.id}>
                        <div className="student-schedule-item-main">
                          <div className="student-schedule-course-icon"><GraduationCap size={17} /></div>
                          <div>
                            <strong>{horario.cursoNombre}</strong>
                            <span>Sección {horario.seccion} · {horario.periodo}</span>
                          </div>
                        </div>
                        <div className="student-schedule-meta">
                          <span><Clock3 size={14} />{horario.horaInicio} - {horario.horaFin}</span>
                          <span><MapPin size={14} />{horario.aulaNombre}</span>
                        </div>
                        <button
                          type="button"
                          className="student-attendance-button"
                          onClick={onOpenRecognition}
                        >
                          <GraduationCap size={15} />
                          Abrir reconocimiento facial
                        </button>
                      </div>
                  ))}
                </section>
              ))}
            </div>
          )}

          <div className="student-schedule-assign">
            <div>
              <strong>Agregar otro curso u horario</strong>
              <span>No hay límite de secciones asignadas al estudiante.</span>
            </div>
            <div className="student-schedule-assign-controls">
              <select
                value={seccionAAsignar}
                onChange={(event) => setSeccionAAsignar(event.target.value)}
                aria-label="Seleccionar sección para asignar"
              >
                <option value="">Seleccionar sección</option>
                {seccionesDisponibles.map((seccion) => (
                  <option key={seccion.id} value={seccion.id}>
                    {seccion.cursoNombre} · Sección {seccion.codigo} · {seccion.periodo}
                  </option>
                ))}
              </select>
              <button type="button" className="student-attendance-button" onClick={asignarHorario}>
                <Plus size={15} />
                Asignar horario
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}