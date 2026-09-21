import {
  CalendarX2,
  ClipboardList,
  GraduationCap,
  UserRound,
  Users,
} from "lucide-react";
import { useMemo } from "react";

import { useAcademic } from "../../context/AcademicContext";
import { useAttendance } from "../../context/AttendanceContext";

const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function Ausentes() {
  const { horarios } = useAcademic();
  const { asistenciasDeHoy } = useAttendance();
  const diaActual = dias[new Date().getDay()];

  const ausentes = useMemo(() => {
    const horariosActivos = horarios.filter((horario) => horario.estado === "Activo" && horario.dia === diaActual);
    return horariosActivos.filter((horario) =>
      !asistenciasDeHoy.some((registro) => registro.cursoId === horario.cursoId && registro.seccion === horario.seccion),
    );
  }, [asistenciasDeHoy, diaActual, horarios]);

  return (
    <div className="page academic-page attendance-insights-page">
      <div className="page-header">
        <div>
          <span className="section-label"><CalendarX2 size={15} /> CONTROL DE ASISTENCIA</span>
          <h1>Ausentes</h1>
          <p>Clases programadas de hoy que todavía no tienen un registro facial.</p>
        </div>
        <div className="insights-date"><ClipboardList size={16} /><span>{new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long" })}</span></div>
      </div>
      <div className="insights-hero insights-hero-danger">
        <div className="insights-hero-icon"><CalendarX2 size={25} /></div>
        <div><strong>{ausentes.length}</strong><span>clases sin asistencia registrada hoy</span></div>
        <div className="insights-hero-note"><Users size={16} /> Revisión por horario</div>
      </div>
      <section className="content-card insight-table-card">
        <div className="content-card-header"><div><h3>Clases pendientes de registro</h3><p>La ausencia se calcula comparando el horario activo con el reconocimiento facial.</p></div></div>
        {ausentes.length === 0 ? (
          <div className="insight-empty"><div className="insight-empty-icon success"><ClipboardList size={28} /></div><strong>Todo está al día</strong><span>No hay clases sin asistencia registrada para hoy.</span></div>
        ) : (
          <div className="table-container"><table className="data-table"><thead><tr><th>Curso</th><th>Docente</th><th>Horario</th><th>Aula</th><th>Estado</th></tr></thead><tbody>{ausentes.map((horario) => <tr key={horario.id}><td><div className="table-person"><div className="table-avatar"><GraduationCap size={17} /></div><div><strong>{horario.cursoNombre}</strong><span>Sección {horario.seccion} · {horario.periodo}</span></div></div></td><td><span className="table-inline-info"><UserRound size={14} />{horario.docente}</span></td><td>{horario.horaInicio} - {horario.horaFin}</td><td>{horario.aulaNombre}</td><td><span className="status-badge status-absent">Sin registro</span></td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
