import { BarChart3, CalendarDays, Download, FileSpreadsheet, FileText, Users } from "lucide-react";
import { useMemo } from "react";

import { useAttendance } from "../../context/AttendanceContext";

function descargarCSV(nombre: string, filas: string[][]) {
  const contenido = filas.map((fila) => fila.map((valor) => `"${valor.replace(/"/g, '""')}"`).join(",")).join("\n");
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8;" }));
  enlace.download = `${nombre}.csv`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

export default function Reportes() {
  const { asistencias } = useAttendance();
  const docentes = useMemo(() => asistencias.filter((registro) => registro.personType === "teacher"), [asistencias]);
  const estudiantes = useMemo(() => asistencias.filter((registro) => registro.personType === "student"), [asistencias]);
  const metricas = useMemo(() => ({
    asistieron: estudiantes.filter((registro) => registro.estado === "Asistió").length,
    presentesDocentes: docentes.filter((registro) => registro.estado === "Temprano" || registro.estado === "Puntual").length,
    tardanzas: asistencias.filter((registro) => registro.estado === "Tardanza").length,
    faltas: asistencias.filter((registro) => registro.estado === "Falta" || registro.estado === "Ausente").length,
  }), [asistencias, docentes, estudiantes]);
  const exportar = (registros: typeof asistencias, nombre: string) => descargarCSV(nombre, [["Persona", "Tipo", "Fecha", "Curso", "Sección", "Horario", "Aula", "Entrada", "Estado", "Salida", "Método"], ...registros.map((registro) => [registro.nombre, registro.personType === "teacher" ? "Docente" : "Estudiante", registro.fecha, registro.cursoNombre, registro.seccion, `${registro.horaInicio} - ${registro.horaFin}`, registro.aulaNombre, registro.horaRegistro, registro.estado, registro.horaSalida ?? "", registro.metodo])]);

  return <div className="page academic-page reports-page"><div className="page-header"><div><span className="section-label"><BarChart3 size={15} /> ANÁLISIS Y RESULTADOS</span><h1>Reportes de asistencia</h1><p>Reportes separados por persona y preparados para exportación administrativa.</p></div><div className="insights-date"><CalendarDays size={16} /><span>{asistencias.length} registros</span></div></div>
    <div className="report-metric-grid"><div><Users size={18} /><span>Asistencias estudiantiles</span><strong>{metricas.asistieron}</strong></div><div><Users size={18} /><span>Entradas docentes</span><strong>{metricas.presentesDocentes}</strong></div><div><CalendarDays size={18} /><span>Tardanzas</span><strong>{metricas.tardanzas}</strong></div><div><FileText size={18} /><span>Faltas</span><strong>{metricas.faltas}</strong></div></div>
    <div className="report-cards"><div className="report-card report-card-featured"><div className="report-card-icon"><Users size={23} /></div><div><h3>Reporte de asistencia docente</h3><p>Entradas, salidas, horarios y tardanzas por clase.</p></div><button type="button" className="report-action" onClick={() => exportar(docentes, "reporte-asistencia-docente")}><Download size={15} /> CSV</button></div><div className="report-card report-card-featured"><div className="report-card-icon blue"><Users size={23} /></div><div><h3>Reporte de asistencia estudiantil</h3><p>Asistió, tardanza y falta por matrícula y horario.</p></div><button type="button" className="report-action" onClick={() => exportar(estudiantes, "reporte-asistencia-estudiantil")}><Download size={15} /> CSV</button></div><div className="report-card"><div className="report-card-icon green"><FileSpreadsheet size={23} /></div><div><h3>Reporte por curso, sección y fecha</h3><p>La estructura CSV queda lista para abrirse en Excel o migrarse a otro sistema.</p></div><button type="button" className="report-action secondary" onClick={() => exportar(asistencias, "reporte-asistencia-general")}><Download size={15} /> Exportar</button></div></div>
  </div>;
}