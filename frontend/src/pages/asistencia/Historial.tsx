import { CalendarRange, ClipboardCheck, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { useAttendance } from "../../context/AttendanceContext";

export default function Historial() {
  const { asistencias } = useAttendance();
  const [busqueda, setBusqueda] = useState("");
  const registros = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    const resultado = texto ? asistencias.filter((registro) => `${registro.nombre} ${registro.cursoNombre} ${registro.fecha} ${registro.estado}`.toLowerCase().includes(texto)) : asistencias;
    return [...resultado].sort((a, b) => `${b.fecha} ${b.horaRegistro}`.localeCompare(`${a.fecha} ${a.horaRegistro}`));
  }, [asistencias, busqueda]);

  return <div className="page academic-page attendance-insights-page"><div className="page-header"><div><span className="section-label"><ClipboardCheck size={15} /> CONTROL DE ASISTENCIA</span><h1>Historial</h1><p>Consulta cronológica de todos los registros de estudiantes y docentes.</p></div><div className="insights-date"><CalendarRange size={16} /><span>{asistencias.length} registros</span></div></div>
    <div className="history-summary"><div><strong>{asistencias.length}</strong><span>registros acumulados</span></div><div><strong>{new Set(asistencias.map((registro) => registro.fecha)).size}</strong><span>días con actividad</span></div><div><strong>{new Set(asistencias.map((registro) => registro.personId)).size}</strong><span>personas controladas</span></div></div>
    <section className="content-card insight-table-card"><div className="content-card-header"><div><h3>Todos los registros</h3><p>Usa el buscador para encontrar una persona, curso, fecha o estado.</p></div><div className="search-box"><Search size={16} /><input placeholder="Buscar en el historial..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></div></div>{registros.length === 0 ? <div className="insight-empty"><div className="insight-empty-icon"><ClipboardCheck size={28} /></div><strong>No hay registros todavía</strong><span>Las asistencias aparecerán aquí después del reconocimiento facial.</span></div> : <div className="table-container"><table className="data-table"><thead><tr><th>Persona</th><th>Fecha</th><th>Curso</th><th>Ingreso</th><th>Estado</th><th>Método</th></tr></thead><tbody>{registros.map((registro) => <tr key={registro.id}><td><div className="table-person"><div className="table-avatar"><UserRound size={17} /></div><div><strong>{registro.nombre}</strong><span>{registro.personType === "teacher" ? "Docente" : "Estudiante"}</span></div></div></td><td>{registro.fecha}</td><td>{registro.cursoNombre}</td><td>{registro.horaRegistro}</td><td><span className={`status-badge ${registro.estado === "Tardanza" ? "status-late" : "status-present"}`}>{registro.estado}</span></td><td>{registro.metodo === "facial" ? "Facial" : "Manual"}</td></tr>)}</tbody></table></div>}</section>
  </div>;
}
