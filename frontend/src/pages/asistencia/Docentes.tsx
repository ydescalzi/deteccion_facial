import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Search,
  UserRound,
  UserX,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAcademic } from "../../context/AcademicContext";
import { useAttendance } from "../../context/AttendanceContext";

const DIAS_SEMANA: string[] = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const obtenerFechaActual = () => {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${fecha.getFullYear()}-${mes}-${dia}`;
};

const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function Docentes() {
  const { docentes, horarios } = useAcademic();
  const { asistencias } = useAttendance();
  const [fecha, setFecha] = useState(obtenerFechaActual);
  const [busqueda, setBusqueda] = useState("");

  const registrosDocentes = useMemo(
    () => asistencias.filter((registro) => registro.personType === "teacher"),
    [asistencias],
  );

  const filas = useMemo(() => {
    const diaSeleccionado = DIAS_SEMANA[new Date(`${fecha}T12:00:00`).getDay()];

    if (!diaSeleccionado || diaSeleccionado === "Domingo") {
      return [];
    }

    return horarios
      .filter((horario) => horario.estado === "Activo" && horario.dia === diaSeleccionado)
      .map((horario) => {
        const docente = docentes.find((item) => {
          const nombreDocente = normalizar(`${item.nombres} ${item.apellidos}`);
          const nombreHorario = normalizar(horario.docente);

          return (
            nombreHorario.includes(nombreDocente) ||
            nombreDocente.includes(nombreHorario) ||
            nombreHorario.includes(normalizar(item.apellidos))
          );
        });

        const registro = registrosDocentes.find(
          (item) =>
            item.fecha === fecha &&
            item.cursoId === horario.cursoId &&
            (item.personId === docente?.id ||
              normalizar(item.nombre) === normalizar(horario.docente)),
        );

        return {
          horario,
          docente,
          registro,
        };
      });
  }, [docentes, fecha, horarios, registrosDocentes]);

  const filasFiltradas = useMemo(() => {
    const texto = normalizar(busqueda.trim());

    if (!texto) {
      return filas;
    }

    return filas.filter(({ horario, docente }) =>
      normalizar(
        `${docente?.nombres ?? ""} ${docente?.apellidos ?? ""} ${horario.cursoNombre} ${horario.aulaNombre}`,
      ).includes(texto),
    );
  }, [busqueda, filas]);

  const presentes = filas.filter(
    ({ registro }) => registro?.estado === "Temprano" || registro?.estado === "Puntual",
  ).length;
  const tardanzas = filas.filter(({ registro }) => registro?.estado === "Tardanza").length;
  const ausentes = filas.filter(({ registro }) => !registro).length;

  const fechaTexto = new Date(`${fecha}T12:00:00`).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="page academic-page attendance-teachers-page">
      <div className="page-header">
        <div>
          <span className="section-label">
            <UserRound size={15} />
            CONTROL DE ASISTENCIA
          </span>
          <h1>Asistencia de docentes</h1>
          <p>Consulta el ingreso docente por horario y verifica quién registró su asistencia.</p>
        </div>
      </div>

      <div className="attendance-date-banner">
        <CalendarCheck2 size={18} />
        <div>
          <span>FECHA DE CONTROL</span>
          <strong>{fechaTexto}</strong>
        </div>
        <input
          type="date"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
          aria-label="Seleccionar fecha de control docente"
        />
      </div>

      <div className="stats-grid">
        <div className="stat-card attendance-stat attendance-stat-present">
          <div className="stat-icon"><CheckCircle2 size={20} /></div>
          <div><span>Presentes</span><strong>{presentes}</strong></div>
        </div>
        <div className="stat-card attendance-stat attendance-stat-late">
          <div className="stat-icon"><Clock3 size={20} /></div>
          <div><span>Tardanzas</span><strong>{tardanzas}</strong></div>
        </div>
        <div className="stat-card attendance-stat attendance-stat-absent">
          <div className="stat-icon"><UserX size={20} /></div>
          <div><span>Sin registro</span><strong>{ausentes}</strong></div>
        </div>
      </div>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h3>Control por horario</h3>
            <p>Se muestran únicamente las clases programadas para la fecha seleccionada.</p>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar docente o curso..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Curso</th>
                <th>Horario</th>
                <th>Aula</th>
                <th>Registro</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-table">
                    <div className="attendance-empty">
                      <CalendarCheck2 size={32} />
                      <strong>No hay clases docentes para esta fecha</strong>
                      <span>Selecciona otra fecha o revisa los horarios activos.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filasFiltradas.map(({ horario, docente, registro }) => (
                  <tr key={horario.id}>
                    <td>
                      <div className="table-person">
                        <div className="table-avatar"><UserRound size={17} /></div>
                        <div>
                          <strong>{docente ? `${docente.nombres} ${docente.apellidos}` : horario.docente}</strong>
                          <span>{docente?.codigo ?? "Docente no vinculado"}</span>
                        </div>
                      </div>
                    </td>
                    <td><strong>{horario.cursoNombre}</strong><br /><span>{horario.periodo} · Sección {horario.seccion}</span></td>
                    <td><span className="time-badge"><Clock3 size={13} />{horario.horaInicio} - {horario.horaFin}</span></td>
                    <td>{horario.aulaNombre}</td>
                    <td>{registro?.horaRegistro ?? "Sin registro"}</td>
                    <td>
                      <span className={`status-badge ${registro ? "status-present" : "status-absent"}`}>
                        {registro?.estado ?? "Ausente"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}