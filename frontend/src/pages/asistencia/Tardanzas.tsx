import { AlertTriangle, Clock3, GraduationCap, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { useAttendance } from "../../context/AttendanceContext";

export default function Tardanzas() {
  const { asistenciasDeHoy } = useAttendance();
  const [busqueda, setBusqueda] = useState("");
  const tardanzas = asistenciasDeHoy.filter((registro) => registro.estado === "Tardanza");
  const filtradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    return texto ? tardanzas.filter((registro) => `${registro.nombre} ${registro.cursoNombre} ${registro.aulaNombre}`.toLowerCase().includes(texto)) : tardanzas;
  }, [busqueda, tardanzas]);

  return <div className="page academic-page attendance-insights-page">
    <div className="page-header"><div><span className="section-label"><AlertTriangle size={15} /> CONTROL DE ASISTENCIA</span><h1>Tardanzas</h1><p>Personas que ingresaron después de la hora de inicio de su clase.</p></div><div className="insights-date"><Clock3 size={16} /><span>Control de hoy</span></div></div>
    <div className="insights-hero insights-hero-warning"><div className="insights-hero-icon"><Clock3 size={25} /></div><div><strong>{tardanzas.length}</strong><span>registros con tardanza hoy</span></div><div className="insights-hero-note"><AlertTriangle size={16} /> Atención requerida</div></div>
    <section className="content-card insight-table-card"><div className="content-card-header"><div><h3>Detalle de tardanzas</h3><p>Consulta quién llegó tarde, a qué curso y a qué hora.</p></div><div className="search-box"><Search size={16} /><input placeholder="Buscar persona o curso..." value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></div></div>
      {filtradas.length === 0 ? <div className="insight-empty"><div className="insight-empty-icon success"><Clock3 size={28} /></div><strong>Sin tardanzas registradas</strong><span>El control de hoy no tiene registros fuera de horario.</span></div> : <div className="table-container"><table className="data-table"><thead><tr><th>Persona</th><th>Curso</th><th>Horario</th><th>Ingreso</th><th>Método</th><th>Estado</th></tr></thead><tbody>{filtradas.map((registro) => <tr key={registro.id}><td><div className="table-person"><div className="table-avatar"><UserRound size={17} /></div><div><strong>{registro.nombre}</strong><span>{registro.personType === "teacher" ? "Docente" : "Estudiante"}</span></div></div></td><td><span className="table-inline-info"><GraduationCap size={14} />{registro.cursoNombre}</span></td><td>{registro.horaInicio} - {registro.horaFin}</td><td><span className="time-badge"><Clock3 size={13} />{registro.horaRegistro}</span></td><td>{registro.metodo === "facial" ? "Reconocimiento facial" : "Manual"}</td><td><span className="status-badge status-late">Tardanza</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
