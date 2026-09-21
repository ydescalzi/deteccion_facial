import {
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  MapPin,
  MonitorSmartphone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAcademic } from "../../context/AcademicContext";
import type { Terminal } from "../../data/terminales";

const ESTADOS: Terminal["estado"][] = [
  "Activo",
  "Inactivo",
  "Mantenimiento",
];

function formatearConexion(valor: string): string {
  if (!valor) return "Nunca conectada";
  return new Date(valor).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Terminales() {
  const {
    aulas,
    horarios,
    terminales,
    agregarTerminal,
    actualizarTerminal,
    eliminarTerminal,
  } = useAcademic();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [terminalEditando, setTerminalEditando] = useState<Terminal | null>(null);
  const [formulario, setFormulario] = useState({
    codigo: "",
    aulaId: aulas[0]?.id ?? "",
    horarioIds: [] as string[],
    ubicacion: "",
    estado: "Activo" as Terminal["estado"],
    ultimaConexion: "",
  });

  const horariosDisponibles = useMemo(
    () => horarios.filter((horario) => horario.aulaId === formulario.aulaId),
    [formulario.aulaId, horarios],
  );

  const terminalesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return terminales;
    return terminales.filter((terminal) => {
      const aula = aulas.find((item) => item.id === terminal.aulaId);
      return [terminal.codigo, terminal.ubicacion, terminal.estado, aula?.codigo, aula?.nombre]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [aulas, busqueda, terminales]);

  const abrirNuevo = () => {
    setTerminalEditando(null);
    setFormulario({
      codigo: "",
      aulaId: aulas[0]?.id ?? "",
      horarioIds: [],
      ubicacion: "",
      estado: "Activo",
      ultimaConexion: "",
    });
    setModalAbierto(true);
  };

  const abrirEditar = (terminal: Terminal) => {
    setTerminalEditando(terminal);
    setFormulario({
      codigo: terminal.codigo,
      aulaId: terminal.aulaId,
      horarioIds: terminal.horarioIds ?? [],
      ubicacion: terminal.ubicacion,
      estado: terminal.estado,
      ultimaConexion: terminal.ultimaConexion,
    });
    setModalAbierto(true);
  };

  const alternarHorario = (horarioId: string) => {
    setFormulario((actual) => ({
      ...actual,
      horarioIds: actual.horarioIds.includes(horarioId)
        ? actual.horarioIds.filter((id) => id !== horarioId)
        : [...actual.horarioIds, horarioId],
    }));
  };

  const guardar = () => {
    const codigo = formulario.codigo.trim().toUpperCase();
    const ubicacion = formulario.ubicacion.trim();
    if (!/^TAB-[A-Z0-9-]+$/.test(codigo) || !formulario.aulaId || !ubicacion) {
      alert("Completa un código válido (por ejemplo, TAB-101), aula y ubicación.");
      return;
    }
    const horarioIds = formulario.horarioIds.filter((id) =>
      horariosDisponibles.some((horario) => horario.id === id),
    );
    const horarioDuplicado = horarioIds.some((horarioId) =>
      terminales.some((terminal) =>
        terminal.id !== terminalEditando?.id &&
        (terminal.horarioIds ?? []).includes(horarioId),
      ),
    );
    if (horarioDuplicado) {
      alert("Una o más clases ya están asignadas a otra tablet.");
      return;
    }
    const datos = { ...formulario, codigo, ubicacion, horarioIds };
    if (terminalEditando) {
      actualizarTerminal({ ...terminalEditando, ...datos });
    } else {
      agregarTerminal(datos);
    }
    setModalAbierto(false);
  };

  const confirmarEliminacion = (terminal: Terminal) => {
    if (window.confirm(`¿Deseas eliminar el terminal ${terminal.codigo}?`)) {
      eliminarTerminal(terminal.id);
    }
  };

  return (
    <div className="page academic-page">
      <div className="page-header">
        <div>
          <span className="section-label"><MonitorSmartphone size={14} /> SISTEMA BIOMÉTRICO</span>
          <h1>Terminales biométricos</h1>
          <p>Configura qué tablet controla cada aula, clase y horario.</p>
        </div>
        <button type="button" className="primary-button" onClick={abrirNuevo}>
          <Plus size={17} /> Nueva tablet
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon"><MonitorSmartphone size={20} /></div><div><span>Tablets registradas</span><strong>{terminales.length}</strong></div></div>
        <div className="stat-card"><div className="stat-icon"><CalendarDays size={20} /></div><div><span>Clases asignadas</span><strong>{new Set(terminales.flatMap((item) => item.horarioIds ?? [])).size}</strong></div></div>
        <div className="stat-card"><div className="stat-icon"><Check size={20} /></div><div><span>Tablets activas</span><strong>{terminales.filter((item) => item.estado === "Activo").length}</strong></div></div>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <div><h3>Asignación de tablets</h3><p>Cada horario debe quedar vinculado a una única tablet.</p></div>
          <div className="search-box"><Search size={15} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar tablet o clase..." /></div>
        </div>
        <div className="table-container">
          <table className="data-table terminales-table">
            <thead><tr><th>Tablet</th><th>Aula fija</th><th>Clases y horarios</th><th>Estado</th><th>Última conexión</th><th>Acciones</th></tr></thead>
            <tbody>
              {terminalesFiltrados.map((terminal) => {
                const aula = aulas.find((item) => item.id === terminal.aulaId);
                return <tr key={terminal.id}>
                  <td><div className="table-person"><div className="table-avatar"><MonitorSmartphone size={16} /></div><div><strong>{terminal.codigo}</strong><span>{terminal.ubicacion}</span></div></div></td>
                  <td><div className="table-secondary"><strong>{aula?.codigo ?? "Aula no encontrada"}</strong><span>{aula?.nombre ?? "Revisar asignación"}</span></div></td>
                  <td><div className="terminal-class-list">{(terminal.horarioIds ?? []).length ? (terminal.horarioIds ?? []).map((id) => { const horario = horarios.find((item) => item.id === id); return horario ? <span className="terminal-class" key={id}><strong>{horario.cursoNombre} · Sec. {horario.seccion}</strong><small><CalendarDays size={12} /> {horario.dia} · {horario.horaInicio} - {horario.horaFin}</small></span> : null; }) : <span className="terminal-unassigned">Sin clases asignadas</span>}</div></td>
                  <td><span className={`status-badge ${terminal.estado === "Activo" ? "status-active" : "status-inactive"}`}>{terminal.estado}</span></td>
                  <td>{formatearConexion(terminal.ultimaConexion)}</td>
                  <td><div className="table-actions"><a className="icon-button" href={`/terminal/${encodeURIComponent(terminal.codigo)}`} title="Abrir modo kiosco"><MonitorSmartphone size={15} /></a><button type="button" className="icon-button" onClick={() => abrirEditar(terminal)} title="Editar"><Edit3 size={15} /></button><button type="button" className="icon-button danger" onClick={() => confirmarEliminacion(terminal)} title="Eliminar"><Trash2 size={15} /></button></div></td>
                </tr>;
              })}
            </tbody>
          </table>
          {terminalesFiltrados.length === 0 && <div className="empty-table"><MonitorSmartphone size={28} /><h3>No hay tablets registradas</h3><p>Registra una tablet y asígnale sus clases.</p></div>}
        </div>
      </div>

      {modalAbierto && <div className="modal-overlay" onClick={() => setModalAbierto(false)}><div className="modal terminal-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header"><div><span className="section-label">CONFIGURACIÓN DE TABLET</span><h3>{terminalEditando ? "Editar asignación" : "Registrar tablet"}</h3></div><button type="button" className="modal-close" onClick={() => setModalAbierto(false)}><X size={18} /></button></div>
        <div className="modal-body"><div className="form-grid">
          <div className="form-group"><label>Código único</label><input value={formulario.codigo} onChange={(event) => setFormulario({ ...formulario, codigo: event.target.value })} placeholder="TAB-101" /></div>
          <div className="form-group"><label>Aula fija</label><select value={formulario.aulaId} onChange={(event) => setFormulario({ ...formulario, aulaId: event.target.value, horarioIds: [] })}>{aulas.map((aula) => <option key={aula.id} value={aula.id}>{aula.codigo} - {aula.nombre}</option>)}</select></div>
          <div className="form-group"><label>Ubicación física</label><input value={formulario.ubicacion} onChange={(event) => setFormulario({ ...formulario, ubicacion: event.target.value })} placeholder="Ingreso del laboratorio" /></div>
          <div className="form-group"><label>Estado</label><select value={formulario.estado} onChange={(event) => setFormulario({ ...formulario, estado: event.target.value as Terminal["estado"] })}>{ESTADOS.map((estado) => <option key={estado}>{estado}</option>)}</select></div>
        </div>
        <div className="terminal-schedule-heading"><div><h4>Clases controladas por esta tablet</h4><p>Selecciona los horarios del aula elegida.</p></div><span>{formulario.horarioIds.length} seleccionadas</span></div>
        <div className="terminal-schedule-list">{horariosDisponibles.length ? horariosDisponibles.map((horario) => <label className={`terminal-schedule-option ${formulario.horarioIds.includes(horario.id) ? "selected" : ""}`} key={horario.id}><input type="checkbox" checked={formulario.horarioIds.includes(horario.id)} onChange={() => alternarHorario(horario.id)} /><span className="terminal-check"><Check size={14} /></span><span><strong>{horario.cursoNombre} · Sección {horario.seccion}</strong><small><CalendarDays size={13} /> {horario.dia} · {horario.horaInicio} - {horario.horaFin}<MapPin size={13} /> {horario.aulaNombre}</small></span></label>) : <div className="terminal-schedule-empty"><Clock3 size={18} /> No hay horarios para esta aula.</div>}</div>
        </div>
        <div className="modal-footer"><button type="button" className="btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button><button type="button" className="btn-primary" onClick={guardar}>Guardar configuración</button></div>
      </div></div>}
    </div>
  );
}
