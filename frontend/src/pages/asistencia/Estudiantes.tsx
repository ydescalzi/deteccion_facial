import {
  CalendarCheck2,
  ChevronRight,
  Clock3,
  GraduationCap,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAcademic } from "../../context/AcademicContext";
import { useAttendance } from "../../context/AttendanceContext";
import type { RegistroAsistencia } from "../../data/asistencia";
import type { Horario } from "../../data/horarios";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const normalizar = (texto: string) => texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const fechaActual = () => {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
};
const minutos = (hora: string) => {
  const [horas, minutosHora] = hora.split(":").map(Number);
  return horas * 60 + minutosHora;
};

function estadoEstudiante(registro: RegistroAsistencia | undefined, horario: Horario, fecha: string, ahora: Date) {
  if (registro) return registro.estado === "Asistió" ? "ASISTIÓ" : registro.estado.toUpperCase();
  const esHoy = fecha === fechaActual();
  const cierre = minutos(horario.horaInicio) + 20;
  if (esHoy && ahora.getHours() * 60 + ahora.getMinutes() <= cierre) return "PENDIENTE";
  return "FALTA";
}

export default function Estudiantes() {
  const { horarios, matriculas, cursos } = useAcademic();
  const { asistencias } = useAttendance();
  const [fecha, setFecha] = useState(fechaActual);
  const [periodo, setPeriodo] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [seccion, setSeccion] = useState("");
  const [aula, setAula] = useState("");
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [horarioId, setHorarioId] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [detalle, setDetalle] = useState<{ matricula: typeof matriculas[number]; horario: Horario; registro?: RegistroAsistencia } | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const porPagina = 10;

  const horariosDelDia = useMemo(() => {
    const dia = DIAS[new Date(`${fecha}T12:00:00`).getDay()];
    return horarios
      .filter((horario) => horario.estado === "Activo" && horario.dia === dia)
      .filter((horario) => !periodo || horario.periodo === periodo)
      .filter((horario) => !cursoId || horario.cursoId === cursoId)
      .filter((horario) => !seccion || horario.seccion === seccion)
      .filter((horario) => !aula || horario.aulaNombre === aula)
      .sort((a, b) => minutos(a.horaInicio) - minutos(b.horaInicio));
  }, [aula, cursoId, fecha, horarios, periodo, seccion]);

  const horarioSeleccionado = horariosDelDia.find((horario) => horario.id === horarioId) ?? horariosDelDia[0];
  const registrosDeClase = useMemo(() => {
    if (!horarioSeleccionado) return [];
    return matriculas
      .filter((matricula) => matricula.estado === "Activa" && matricula.cursoId === horarioSeleccionado.cursoId && matricula.seccion === horarioSeleccionado.seccion && normalizar(matricula.periodo) === normalizar(horarioSeleccionado.periodo))
      .map((matricula) => ({ matricula, registro: asistencias.find((item) => item.personType === "student" && item.personId === matricula.estudianteId && item.fecha === fecha && item.horarioId === horarioSeleccionado.id) }))
      .filter(({ matricula, registro }) => {
        const texto = normalizar(`${matricula.estudianteNombre} ${matricula.estudianteId} ${matricula.id} ${horarioSeleccionado.cursoNombre} ${horarioSeleccionado.seccion} ${horarioSeleccionado.aulaNombre}`);
        const coincideBusqueda = !busqueda || texto.includes(normalizar(busqueda));
        const estadoFila = estadoEstudiante(registro, horarioSeleccionado, fecha, ahora);
        return coincideBusqueda && (!estado || estadoFila === estado);
      });
  }, [ahora, asistencias, busqueda, estado, fecha, horarioSeleccionado, matriculas]);

  const estadisticas = useMemo(() => {
    const total = registrosDeClase.length;
    const asistieron = registrosDeClase.filter(({ registro }) => registro?.estado === "Asistió").length;
    const tardanzas = registrosDeClase.filter(({ registro }) => registro?.estado === "Tardanza").length;
    const faltas = registrosDeClase.filter(({ registro }) => estadoEstudiante(registro, horarioSeleccionado!, fecha, ahora) === "FALTA").length;
    return { total, asistieron, tardanzas, faltas, porcentaje: total ? ((asistieron + tardanzas) / total) * 100 : 0 };
  }, [ahora, fecha, horarioSeleccionado, registrosDeClase]);

  const paginas = Math.max(1, Math.ceil(registrosDeClase.length / porPagina));
  const filas = registrosDeClase.slice((pagina - 1) * porPagina, pagina * porPagina);
  const periodos = [...new Set(horarios.map((horario) => horario.periodo))];
  const aulas = [...new Set(horarios.map((horario) => horario.aulaNombre))];
  const seccionesDisponibles = [...new Set(horarios.map((horario) => horario.seccion))];

  const seleccionarFecha = (valor: string) => {
    setFecha(valor);
    setHorarioId(null);
    setPagina(1);
  };

  useEffect(() => {
    const timer = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="page academic-page attendance-insights-page">
      <div className="page-header">
        <div>
          <span className="section-label"><GraduationCap size={15} /> ASISTENCIA</span>
          <h1>Asistencia de estudiantes</h1>
          <p>Consulta la asistencia por clase, matrícula, horario y estado.</p>
        </div>
        <div className="insights-date"><CalendarCheck2 size={16} /><span>{registrosDeClase.length} estudiantes</span></div>
      </div>

      <section className="content-card attendance-filter-panel">
        <div className="content-card-header"><div><h3>Filtros de consulta</h3><p>Combina los filtros para encontrar una clase o estudiante específico.</p></div><div className="search-box"><Search size={16} /><input value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPagina(1); }} placeholder="Nombre, código o matrícula..." /></div></div>
        <div className="filters-grid">
          <label>Fecha<input type="date" value={fecha} onChange={(event) => seleccionarFecha(event.target.value)} /></label>
          <label>Periodo<select value={periodo} onChange={(event) => { setPeriodo(event.target.value); setHorarioId(null); }}><option value="">Todos</option>{periodos.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Curso<select value={cursoId} onChange={(event) => { setCursoId(event.target.value); setHorarioId(null); }}><option value="">Todos</option>{cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre}</option>)}</select></label>
          <label>Sección<select value={seccion} onChange={(event) => { setSeccion(event.target.value); setHorarioId(null); }}><option value="">Todas</option>{seccionesDisponibles.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Aula<select value={aula} onChange={(event) => { setAula(event.target.value); setHorarioId(null); }}><option value="">Todas</option>{aulas.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Estado<select value={estado} onChange={(event) => { setEstado(event.target.value); setPagina(1); }}><option value="">Todos</option><option>ASISTIÓ</option><option>TARDANZA</option><option>FALTA</option><option>PENDIENTE</option></select></label>
        </div>
      </section>

      <div className="attendance-split-layout">
        <section className="content-card attendance-class-list">
          <div className="content-card-header"><div><h3>Clases del día</h3><p>{new Date(`${fecha}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long" })}</p></div></div>
          {horariosDelDia.length === 0 ? <div className="insight-empty"><GraduationCap size={28} /><strong>No hay clases programadas</strong><span>Revisa la fecha o los filtros académicos.</span></div> : horariosDelDia.map((horario) => <button type="button" className={`attendance-class-item ${horario.id === horarioSeleccionado?.id ? "is-selected" : ""}`} key={horario.id} onClick={() => { setHorarioId(horario.id); setPagina(1); }}><span className="time-badge"><Clock3 size={13} />{horario.horaInicio} - {horario.horaFin}</span><strong>{horario.cursoNombre}</strong><span>Sección {horario.seccion} · {horario.aulaNombre}</span><ChevronRight size={16} /></button>)}
        </section>

        <section className="attendance-class-detail">
          {horarioSeleccionado ? <>
            <div className="attendance-detail-heading"><div><span className="section-label">RESUMEN POR CLASE</span><h2>{horarioSeleccionado.cursoNombre}</h2><p>{horarioSeleccionado.horaInicio} - {horarioSeleccionado.horaFin} · Sección {horarioSeleccionado.seccion}</p></div><div className="code-badge"><MapPin size={13} /> {horarioSeleccionado.aulaNombre}</div></div>
            <div className="stats-grid attendance-class-stats"><div className="stat-card attendance-stat"><span>Total matriculados</span><strong>{estadisticas.total}</strong></div><div className="stat-card attendance-stat attendance-stat-present"><span>Asistieron</span><strong>{estadisticas.asistieron}</strong></div><div className="stat-card attendance-stat attendance-stat-late"><span>Tardanzas</span><strong>{estadisticas.tardanzas}</strong></div><div className="stat-card attendance-stat attendance-stat-absent"><span>Faltas</span><strong>{estadisticas.faltas}</strong></div><div className="stat-card attendance-stat"><span>Asistencia</span><strong>{estadisticas.porcentaje.toFixed(1)}%</strong></div></div>
            <section className="content-card"><div className="content-card-header"><div><h3>Estudiantes matriculados</h3><p>Primera marcación válida por estudiante y horario.</p></div></div><div className="table-container"><table className="data-table"><thead><tr><th>N.º</th><th>Estudiante</th><th>Matrícula</th><th>Curso</th><th>Sección</th><th>Horario</th><th>Aula</th><th>Ingreso</th><th>Estado</th></tr></thead><tbody>{filas.length === 0 ? <tr><td colSpan={9} className="empty-table">No hay estudiantes que coincidan con los filtros.</td></tr> : filas.map(({ matricula, registro }, index) => { const estadoFila = estadoEstudiante(registro, horarioSeleccionado, fecha, ahora); return <tr key={matricula.id} onClick={() => setDetalle({ matricula, horario: horarioSeleccionado, registro })} className="clickable-row"><td>{(pagina - 1) * porPagina + index + 1}</td><td><strong>{matricula.estudianteNombre}</strong><span className="table-secondary">{matricula.estudianteId}</span></td><td>{matricula.id}</td><td>{horarioSeleccionado.cursoNombre}</td><td>{horarioSeleccionado.seccion}</td><td>{horarioSeleccionado.horaInicio} - {horarioSeleccionado.horaFin}</td><td>{horarioSeleccionado.aulaNombre}</td><td>{registro?.horaRegistro || "-"}</td><td><span className={`status-badge ${estadoFila === "FALTA" ? "status-absent" : estadoFila === "TARDANZA" ? "status-late" : "status-present"}`}>{estadoFila}</span></td></tr>; })}</tbody></table></div><div className="table-pagination"><span>Página {pagina} de {paginas}</span><div><button type="button" disabled={pagina === 1} onClick={() => setPagina((valor) => valor - 1)}>Anterior</button><button type="button" disabled={pagina === paginas} onClick={() => setPagina((valor) => valor + 1)}>Siguiente</button></div></div></section>
          </> : <div className="content-card insight-empty"><GraduationCap size={34} /><strong>Selecciona una clase</strong><span>Las clases programadas aparecerán aquí.</span></div>}
        </section>
      </div>

      {detalle && <div className="modal-backdrop" role="presentation" onClick={() => setDetalle(null)}><div className="content-card attendance-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="content-card-header"><div><span className="section-label">DETALLE DE ASISTENCIA</span><h3>{detalle.matricula.estudianteNombre}</h3></div><button type="button" className="icon-button" onClick={() => setDetalle(null)} aria-label="Cerrar detalle"><X size={18} /></button></div><div className="detail-grid"><span>Tipo de persona<strong>Estudiante</strong></span><span>Curso<strong>{detalle.horario.cursoNombre}</strong></span><span>Sección<strong>{detalle.horario.seccion}</strong></span><span>Docente<strong>{detalle.horario.docente}</strong></span><span>Aula<strong>{detalle.horario.aulaNombre}</strong></span><span>Fecha<strong>{fecha}</strong></span><span>Horario<strong>{detalle.horario.horaInicio} - {detalle.horario.horaFin}</strong></span><span>Hora de ingreso<strong>{detalle.registro?.horaRegistro || "Sin registro"}</strong></span><span>Estado<strong>{estadoEstudiante(detalle.registro, detalle.horario, fecha, ahora)}</strong></span><span>Método<strong>{detalle.registro?.metodo || "Pendiente"}</strong></span><span>Confianza facial<strong>{detalle.registro ? `${detalle.registro.similarityPercent.toFixed(2)}%` : "-"}</strong></span></div></div></div>}
    </div>
  );
}
