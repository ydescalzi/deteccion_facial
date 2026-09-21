import {
  CalendarCheck2,
  Clock3,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

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
const nombreCompatible = (horario: Horario, docente?: { nombres: string; apellidos: string }) => {
  if (!docente) return normalizar(horario.docente);
  const nombre = normalizar(`${docente.nombres} ${docente.apellidos}`);
  const horarioNombre = normalizar(horario.docente);
  return horarioNombre.includes(nombre) || nombre.includes(horarioNombre) || horarioNombre.includes(normalizar(docente.apellidos));
};

export default function DocentesAdministracion() {
  const { horarios, docentes, cursos } = useAcademic();
  const { asistencias } = useAttendance();
  const [fecha, setFecha] = useState(fechaActual);
  const [periodo, setPeriodo] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [seccion, setSeccion] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [detalle, setDetalle] = useState<{ horario: Horario; registro?: RegistroAsistencia; docente?: typeof docentes[number] } | null>(null);
  const porPagina = 10;

  const filas = useMemo(() => {
    const dia = DIAS[new Date(`${fecha}T12:00:00`).getDay()];
    return horarios.filter((horario) => horario.estado === "Activo" && horario.dia === dia)
      .filter((horario) => !periodo || horario.periodo === periodo)
      .filter((horario) => !cursoId || horario.cursoId === cursoId)
      .filter((horario) => !seccion || horario.seccion === seccion)
      .map((horario) => {
        const docente = docentes.find((item) => !docenteId || item.id === docenteId ? nombreCompatible(horario, item) : false);
        const registro = asistencias.find((item) => item.personType === "teacher" && item.fecha === fecha && (item.horarioId === horario.id || (item.cursoId === horario.cursoId && item.seccion === horario.seccion && nombreCompatible(horario, { nombres: item.nombre, apellidos: "" }))));
        const estadoFila = registro?.estado === "Tardanza" ? "Tardanza" : registro?.estado === "Falta" ? "Falta" : registro ? "Presente" : "Falta";
        const texto = normalizar(`${horario.docente} ${docente?.codigo ?? ""} ${horario.cursoNombre} ${horario.seccion} ${horario.aulaNombre} ${estadoFila}`);
        return { horario, docente, registro, estadoFila, texto };
      })
      .filter(({ docente, estadoFila, texto }) => (!docenteId || docente) && (!estado || estadoFila === estado) && (!busqueda || texto.includes(normalizar(busqueda))));
  }, [asistencias, busqueda, cursoId, docenteId, docentes, estado, fecha, horarios, periodo, seccion]);

  const estadisticas = useMemo(() => {
    const clases = filas.length;
    const entradas = filas.filter(({ registro }) => registro && registro.estado !== "Falta").length;
    const tardanzas = filas.filter(({ registro }) => registro?.estado === "Tardanza").length;
    const faltas = filas.filter(({ estadoFila }) => estadoFila === "Falta").length;
    const salidas = filas.filter(({ registro }) => Boolean(registro?.horaSalida)).length;
    return { clases, entradas, tardanzas, faltas, salidas, porcentaje: clases ? (entradas / clases) * 100 : 0 };
  }, [filas]);

  const paginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const filasPagina = filas.slice((pagina - 1) * porPagina, pagina * porPagina);
  const periodos = [...new Set(horarios.map((horario) => horario.periodo))];
  const secciones = [...new Set(horarios.map((horario) => horario.seccion))];

  return (
    <div className="page academic-page attendance-insights-page">
      <div className="page-header"><div><span className="section-label"><UserRound size={15} /> ASISTENCIA</span><h1>Asistencia de docentes</h1><p>Control de entradas y salidas organizado por fecha, curso, horario y aula.</p></div><div className="insights-date"><CalendarCheck2 size={16} /><span>{filas.length} clases</span></div></div>
      <section className="content-card attendance-filter-panel"><div className="content-card-header"><div><h3>Filtros de consulta</h3><p>Los filtros se aplican conjuntamente sobre las clases programadas.</p></div><div className="search-box"><Search size={16} /><input value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPagina(1); }} placeholder="Docente, código, curso o aula..." /></div></div><div className="filters-grid"><label>Fecha<input type="date" value={fecha} onChange={(event) => { setFecha(event.target.value); setPagina(1); }} /></label><label>Periodo<select value={periodo} onChange={(event) => setPeriodo(event.target.value)}><option value="">Todos</option>{periodos.map((item) => <option key={item}>{item}</option>)}</select></label><label>Curso<select value={cursoId} onChange={(event) => setCursoId(event.target.value)}><option value="">Todos</option>{cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre}</option>)}</select></label><label>Sección<select value={seccion} onChange={(event) => setSeccion(event.target.value)}><option value="">Todas</option>{secciones.map((item) => <option key={item}>{item}</option>)}</select></label><label>Docente<select value={docenteId} onChange={(event) => setDocenteId(event.target.value)}><option value="">Todos</option>{docentes.map((item) => <option key={item.id} value={item.id}>{item.nombres} {item.apellidos}</option>)}</select></label><label>Estado<select value={estado} onChange={(event) => setEstado(event.target.value)}><option value="">Todos</option><option>Presente</option><option>Tardanza</option><option>Falta</option><option>Justificado</option></select></label></div></section>
      <div className="stats-grid"><div className="stat-card attendance-stat"><span>Clases programadas</span><strong>{estadisticas.clases}</strong></div><div className="stat-card attendance-stat attendance-stat-present"><span>Entradas registradas</span><strong>{estadisticas.entradas}</strong></div><div className="stat-card attendance-stat attendance-stat-late"><span>Tardanzas</span><strong>{estadisticas.tardanzas}</strong></div><div className="stat-card attendance-stat attendance-stat-absent"><span>Faltas</span><strong>{estadisticas.faltas}</strong></div><div className="stat-card attendance-stat"><span>Salidas registradas</span><strong>{estadisticas.salidas}</strong></div><div className="stat-card attendance-stat"><span>Asistencia</span><strong>{estadisticas.porcentaje.toFixed(1)}%</strong></div></div>
      <section className="content-card"><div className="content-card-header"><div><h3>Control docente por horario</h3><p>Una fila representa una clase programada para la fecha seleccionada.</p></div></div><div className="table-container"><table className="data-table"><thead><tr><th>Hora</th><th>Docente</th><th>Curso</th><th>Sección</th><th>Aula</th><th>Entrada</th><th>Estado</th><th>Salida</th></tr></thead><tbody>{filasPagina.length === 0 ? <tr><td colSpan={8} className="empty-table">No hay clases que coincidan con los filtros.</td></tr> : filasPagina.map(({ horario, docente, registro, estadoFila }) => <tr className="clickable-row" key={horario.id} onClick={() => setDetalle({ horario, registro, docente })}><td><span className="time-badge"><Clock3 size={13} />{horario.horaInicio} - {horario.horaFin}</span></td><td><strong>{docente ? `${docente.nombres} ${docente.apellidos}` : horario.docente}</strong><span className="table-secondary">{docente?.codigo ?? "Sin vincular"}</span></td><td>{horario.cursoNombre}</td><td>{horario.seccion}</td><td>{horario.aulaNombre}</td><td>{registro?.horaRegistro || "-"}</td><td><span className={`status-badge ${estadoFila === "Falta" ? "status-absent" : estadoFila === "Tardanza" ? "status-late" : "status-present"}`}>{estadoFila}</span></td><td>{registro?.horaSalida || "-"}</td></tr>)}</tbody></table></div><div className="table-pagination"><span>Página {pagina} de {paginas}</span><div><button type="button" disabled={pagina === 1} onClick={() => setPagina((valor) => valor - 1)}>Anterior</button><button type="button" disabled={pagina === paginas} onClick={() => setPagina((valor) => valor + 1)}>Siguiente</button></div></div></section>
      {detalle && <div className="modal-backdrop" role="presentation" onClick={() => setDetalle(null)}><div className="content-card attendance-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="content-card-header"><div><span className="section-label">DETALLE DE ASISTENCIA</span><h3>{detalle.docente ? `${detalle.docente.nombres} ${detalle.docente.apellidos}` : detalle.horario.docente}</h3></div><button type="button" className="icon-button" onClick={() => setDetalle(null)} aria-label="Cerrar detalle"><X size={18} /></button></div><div className="detail-grid"><span>Tipo de persona<strong>Docente</strong></span><span>Curso<strong>{detalle.horario.cursoNombre}</strong></span><span>Sección<strong>{detalle.horario.seccion}</strong></span><span>Aula<strong>{detalle.horario.aulaNombre}</strong></span><span>Fecha<strong>{fecha}</strong></span><span>Horario<strong>{detalle.horario.horaInicio} - {detalle.horario.horaFin}</strong></span><span>Hora de entrada<strong>{detalle.registro?.horaRegistro || "Sin registro"}</strong></span><span>Estado<strong>{detalle.registro?.estado || "Falta"}</strong></span><span>Hora de salida<strong>{detalle.registro?.horaSalida || "Pendiente"}</strong></span><span>Método<strong>{detalle.registro?.metodo || "Pendiente"}</strong></span><span>Confianza facial<strong>{detalle.registro ? `${detalle.registro.similarityPercent.toFixed(2)}%` : "-"}</strong></span></div></div></div>}
    </div>
  );
}
