import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useAttendance,
} from "../../context/AttendanceContext";

export default function Presentes() {
  const {
    asistenciasDeHoy,
  } = useAttendance();

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  /* =========================================================
     FILTRAR REGISTROS
     ========================================================= */

  const registrosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return asistenciasDeHoy;
      }

      return asistenciasDeHoy.filter(
        (registro) =>
          [
            registro.nombre,
            registro.cursoNombre,
            registro.seccion,
            registro.docente,
            registro.aulaNombre,
            registro.horaRegistro,
            registro.estado,
          ]
            .join(" ")
            .toLowerCase()
            .includes(texto),
      );
    }, [
      asistenciasDeHoy,
      busqueda,
    ]);

  /* =========================================================
     ESTADÍSTICAS
     ========================================================= */

  const totalPresentes =
    asistenciasDeHoy.filter(
      (registro) =>
        registro.estado ===
          "Temprano" ||
        registro.estado ===
          "Puntual",
    ).length;

  const totalTemprano =
    asistenciasDeHoy.filter(
      (registro) =>
        registro.estado ===
        "Temprano",
    ).length;

  const totalPuntuales =
    asistenciasDeHoy.filter(
      (registro) =>
        registro.estado ===
        "Puntual",
    ).length;

  /* =========================================================
     FECHA
     ========================================================= */

  const fechaActual =
    new Date().toLocaleDateString(
      "es-PE",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="page academic-page attendance-insights-page">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="page-header">

        <div>

          <span className="section-label">

            <CalendarCheck2
              size={15}
            />

            CONTROL DE ASISTENCIA

          </span>

          <h1>
            Presentes
          </h1>

          <p>
            Consulta las asistencias
            registradas mediante
            reconocimiento facial.
          </p>

        </div>

      </div>

      {/* =====================================================
          FECHA
          ===================================================== */}

      <div className="attendance-date-banner">

        <CalendarCheck2
          size={18}
        />

        <div>

          <span>
            FECHA DE CONTROL
          </span>

          <strong>
            {fechaActual}
          </strong>

        </div>

      </div>

      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">

            <UserRound
              size={20}
            />

          </div>

          <div>

            <span>
              Presentes
            </span>

            <strong>
              {totalPresentes}
            </strong>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">

            <CheckCircle2
              size={20}
            />

          </div>

          <div>

            <span>
              Llegaron temprano
            </span>

            <strong>
              {totalTemprano}
            </strong>

          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">

            <Clock3
              size={20}
            />

          </div>

          <div>

            <span>
              Puntuales
            </span>

            <strong>
              {totalPuntuales}
            </strong>

          </div>

        </div>

      </div>

      {/* =====================================================
          TABLA
          ===================================================== */}

      <section className="content-card">

        <div className="content-card-header">

          <div>

            <h3>
              Registro de presentes
            </h3>

            <p>
              Estudiantes que registraron
              su asistencia durante la
              jornada actual.
            </p>

          </div>

          <div className="search-box">

            <Search
              size={16}
            />

            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={
                busqueda
              }
              onChange={(
                event,
              ) =>
                setBusqueda(
                  event.target.value,
                )
              }
            />

          </div>

        </div>

        {/* ===================================================
            TABLA
            =================================================== */}

        <div className="table-container">

          <table className="data-table">

            <thead>

              <tr>

                <th>
                  Estudiante
                </th>

                <th>
                  Curso
                </th>

                <th>
                  Sección
                </th>

                <th>
                  Aula
                </th>

                <th>
                  Hora
                </th>

                <th>
                  Método
                </th>

                <th>
                  Estado
                </th>

              </tr>

            </thead>

            <tbody>

              {registrosFiltrados.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="empty-table"
                  >

                    <div className="attendance-empty">

                      <CalendarCheck2
                        size={32}
                      />

                      <strong>
                        No hay asistencias
                        registradas
                      </strong>

                      <span>
                        Cuando un estudiante
                        sea reconocido mediante
                        el sistema facial,
                        su asistencia aparecerá
                        aquí automáticamente.
                      </span>

                    </div>

                  </td>

                </tr>

              ) : (

                registrosFiltrados.map(
                  (
                    registro,
                  ) => (

                    <tr
                      key={
                        registro.id
                      }
                    >

                      {/* =====================================
                          ESTUDIANTE
                          ===================================== */}

                      <td>

                        <div className="table-person">

                          <div className="table-avatar">

                            <UserRound
                              size={17}
                            />

                          </div>

                          <div>

                            <strong>
                              {
                                registro.nombre
                              }
                            </strong>

                            <span>
                              ID:{" "}
                              {
                                registro.personId
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* =====================================
                          CURSO
                          ===================================== */}

                      <td>

                        <div className="table-person">

                          <div className="table-avatar">

                            <GraduationCap
                              size={16}
                            />

                          </div>

                          <div>

                            <strong>
                              {
                                registro.cursoNombre
                              }
                            </strong>

                            <span>
                              {
                                registro.periodo
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* =====================================
                          SECCIÓN
                          ===================================== */}

                      <td>

                        <span className="code-badge">

                          Sección{" "}

                          {
                            registro.seccion
                          }

                        </span>

                      </td>

                      {/* =====================================
                          AULA
                          ===================================== */}

                      <td>

                        <span className="table-inline-info">

                          <MapPin
                            size={14}
                          />

                          {
                            registro.aulaNombre
                          }

                        </span>

                      </td>

                      {/* =====================================
                          HORA
                          ===================================== */}

                      <td>

                        <span className="time-badge">

                          <Clock3
                            size={13}
                          />

                          {
                            registro.horaRegistro
                          }

                        </span>

                      </td>

                      {/* =====================================
                          MÉTODO
                          ===================================== */}

                      <td>

                        <span className="method-badge">

                          <CheckCircle2
                            size={13}
                          />

                          Reconocimiento facial

                        </span>

                      </td>

                      {/* =====================================
                          ESTADO
                          ===================================== */}

                      <td>

                        <span
                          className={
                            registro.estado ===
                              "Temprano"
                              ? "status-badge status-active"
                              : registro.estado ===
                                  "Puntual"
                                ? "status-badge status-active"
                                : "status-badge status-inactive"
                          }
                        >

                          {registro.estado}

                        </span>

                      </td>

                    </tr>

                  ),
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================
            PIE
            =================================================== */}

        <div className="table-footer">

          Mostrando{" "}

          <strong>
            {
              registrosFiltrados.length
            }
          </strong>

          {" "}de{" "}

          <strong>
            {
              asistenciasDeHoy.length
            }
          </strong>

          {" "}registros de hoy

        </div>

      </section>

    </div>
  );
}