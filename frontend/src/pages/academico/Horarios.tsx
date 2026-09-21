import {
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const dias = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

type Dia = (typeof dias)[number];

interface SAPEstudiante {
  CODIGOSAP: string;
  CODIGOTESO?: string | null;
  DNI?: string | null;
  NOMBRES?: string | null;
  APELLIDOPATERNO?: string | null;
  APELLIDOMATERNO?: string | null;
  NOMBRECOMPLETO?: string | null;
  CLAVEPLANESTUDIOS?: string | null;
  CARRERA?: string | null;
  CODIGOESTADOESTUDIANTE?: string | null;
  VIGENCIA?: number | boolean | null;
}

interface SAPHorario {
  CONSECUTIVOOFERTA?: string | number | null;
  CLAVEEVENTO?: string | number | null;
  EVENTO?: string | null;
  CLAVEPAQUETEEVENTOS?: string | number | null;
  SECCION?: string | null;
  SECCION_NOMBRE?: string | null;
  CLAVEMODULO?: string | number | null;
  MODULO?: string | null;
  CODIGOSAPDOCENTE?: string | null;
  DOCENTE?: string | null;
  CODIGOAULA?: string | null;
  AULA?: string | null;
  CODIGODIA?: number | string | null;
  DIA?: string | null;
  HORAINICIO?: string | null;
  HORAFIN?: string | null;
  CODIGOTURNO?: string | number | null;
  ANO?: number | string | null;
  SEMESTRE?: number | string | null;
  PERIODO?: string | null;
  VIGENCIA?: number | boolean | null;
  CODIGOSAP?: string | null;
  CARRERA?: string | null;
}

interface SAPAula {
  CLAVE?: string | number | null;
  CODIGO?: string | null;
  DENOMINACION?: string | null;
  PABELLON?: string | null;
  CAMPUS?: string | null;
  CAPACIDAD?: number | null;
  virtual?: boolean | number | null;
  VIGENCIA?: number | boolean | null;
}

function esVigente(valor: number | boolean | null | undefined): boolean {
  return valor === undefined || valor === null || valor === 1 || valor === true;
}

function texto(valor: unknown, fallback = "—"): string {
  const resultado = String(valor ?? "").trim();
  return resultado || fallback;
}

function nombreEstudiante(item: SAPEstudiante): string {
  const completo = String(item.NOMBRECOMPLETO ?? "").trim();
  if (completo) return completo;

  return [
    item.NOMBRES,
    item.APELLIDOPATERNO,
    item.APELLIDOMATERNO,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || item.CODIGOSAP;
}

function normalizarDia(horario: SAPHorario): Dia | null {
  const dia = String(horario.DIA ?? "").trim();

  const encontrado = dias.find(
    (item) => item.toLowerCase() === dia.toLowerCase(),
  );
  if (encontrado) return encontrado;

  const codigo = Number(horario.CODIGODIA);
  const porCodigo: Record<number, Dia> = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
  };

  return porCodigo[codigo] ?? null;
}

function convertirHorario(item: SAPHorario, indice: number): SAPHorario & { id: string } {
  return {
    ...item,
    id: String(
      item.CONSECUTIVOOFERTA ??
        `${item.CLAVEEVENTO ?? "HOR"}-${item.CODIGOSAP ?? ""}-${indice}`,
    ),
  };
}

export default function Horarios() {
  const [estudiantes, setEstudiantes] = useState<SAPEstudiante[]>([]);
  const [horarios, setHorarios] = useState<(SAPHorario & { id: string })[]>([]);
  const [aulas, setAulas] = useState<SAPAula[]>([]);

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [cargandoHorario, setCargandoHorario] = useState(false);
  const [error, setError] = useState("");
  const [errorHorario, setErrorHorario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarCatalogos = async () => {
    setCargando(true);
    setError("");

    try {
      const [estudiantesResponse, ofertasResponse, aulasResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/sap-test/estudiantes`),
          fetch(`${API_URL}/api/sap-test/ofertas`),
          fetch(`${API_URL}/api/sap-test/aulas`),
        ]);

      if (!estudiantesResponse.ok || !ofertasResponse.ok || !aulasResponse.ok) {
        throw new Error("No fue posible consultar los servicios académicos SAP.");
      }

      const estudiantesData = await estudiantesResponse.json();
      const ofertasData = await ofertasResponse.json();
      const aulasData = await aulasResponse.json();

      if (estudiantesData.success === false) {
        throw new Error(estudiantesData.message ?? "Error al obtener estudiantes.");
      }
      if (ofertasData.success === false) {
        throw new Error(ofertasData.message ?? "Error al obtener horarios.");
      }

      const listaEstudiantes: SAPEstudiante[] = Array.isArray(
        estudiantesData.estudiantes,
      )
        ? estudiantesData.estudiantes
        : [];

      const listaOfertas: SAPHorario[] = Array.isArray(ofertasData.ofertas)
        ? ofertasData.ofertas
        : [];

      const listaAulas: SAPAula[] = Array.isArray(aulasData.aulas)
        ? aulasData.aulas
        : [];

      setEstudiantes(listaEstudiantes.filter((item) => esVigente(item.VIGENCIA)));
      setHorarios(
        listaOfertas
          .filter((item) => esVigente(item.VIGENCIA))
          .map(convertirHorario),
      );
      setAulas(listaAulas.filter((item) => esVigente(item.VIGENCIA)));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar la información de SAP.",
      );
      setEstudiantes([]);
      setHorarios([]);
      setAulas([]);
    } finally {
      setCargando(false);
    }
  };

  const cargarHorarioEstudiante = async (codigosap: string) => {
    if (!codigosap) {
      setMensaje("");
      setErrorHorario("");
      return;
    }

    setCargandoHorario(true);
    setErrorHorario("");
    setMensaje("");

    try {
      const response = await fetch(
        `${API_URL}/api/sap-test/estudiante/${encodeURIComponent(
          codigosap,
        )}/horarios`,
      );

      if (!response.ok) {
        throw new Error("No fue posible consultar el horario del estudiante.");
      }

      const data = await response.json();

      if (data.success === false) {
        throw new Error(data.message ?? "Estudiante no encontrado en SAP.");
      }

      const lista: SAPHorario[] = Array.isArray(data.horarios)
        ? data.horarios
        : [];

      setHorariosEstudiante(
        lista
          .filter((item) => esVigente(item.VIGENCIA))
          .map(convertirHorario),
      );
    } catch (err) {
      setHorariosEstudiante([]);
      setErrorHorario(
        err instanceof Error
          ? err.message
          : "No fue posible cargar el horario del estudiante.",
      );
    } finally {
      setCargandoHorario(false);
    }
  };

  const [horariosEstudiante, setHorariosEstudiante] = useState<
    (SAPHorario & { id: string })[]
  >([]);

  useEffect(() => {
    void cargarCatalogos();
  }, []);

  useEffect(() => {
    void cargarHorarioEstudiante(estudianteSeleccionado);
  }, [estudianteSeleccionado]);

  const estudianteActual = useMemo(
    () =>
      estudiantes.find(
        (item) => String(item.CODIGOSAP) === estudianteSeleccionado,
      ),
    [estudiantes, estudianteSeleccionado],
  );

  const horariosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();
    if (!textoBusqueda) return horarios;

    return horarios.filter((horario) =>
      [
        horario.MODULO,
        horario.EVENTO,
        horario.SECCION,
        horario.SECCION_NOMBRE,
        horario.DOCENTE,
        horario.CODIGOSAPDOCENTE,
        horario.AULA,
        horario.CODIGOAULA,
        horario.DIA,
        horario.HORAINICIO,
        horario.HORAFIN,
        horario.PERIODO,
      ]
        .map((valor) => String(valor ?? ""))
        .join(" ")
        .toLowerCase()
        .includes(textoBusqueda),
    );
  }, [busqueda, horarios]);

  const horarioPorDia = useMemo(() => {
    const resultado: Record<Dia, (SAPHorario & { id: string })[]> = {
      Lunes: [],
      Martes: [],
      Miércoles: [],
      Jueves: [],
      Viernes: [],
      Sábado: [],
    };

    horariosEstudiante.forEach((horario) => {
      const dia = normalizarDia(horario);
      if (dia) resultado[dia].push(horario);
    });

    dias.forEach((dia) => {
      resultado[dia].sort((a, b) =>
        String(a.HORAINICIO ?? "").localeCompare(String(b.HORAINICIO ?? "")),
      );
    });

    return resultado;
  }, [horariosEstudiante]);

  const horariosActivos = horarios.filter((item) => esVigente(item.VIGENCIA)).length;
  const aulasActivas = aulas.length;

  const actualizar = async () => {
    setMensaje("");
    await cargarCatalogos();
    if (estudianteSeleccionado) {
      await cargarHorarioEstudiante(estudianteSeleccionado);
    }
    setMensaje("Información académica actualizada desde SAP.");
  };

  return (
    <div className="page academic-page">
      <div className="page-header">
        <div>
          <span className="section-label">
            <CalendarDays size={14} />
            GESTIÓN ACADÉMICA
          </span>

          <h1>Horarios</h1>

          <p>
            Programación académica obtenida desde SAP para cursos, secciones,
            docentes, aulas y control de asistencia.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => void actualizar()}
          disabled={cargando}
        >
          <RefreshCw size={17} />
          {cargando ? "Actualizando..." : "Actualizar desde SAP"}
        </button>
      </div>

      {error && (
        <div className="content-card" style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CalendarDays size={22} />
            <div>
              <strong>No se pudo cargar la programación académica</strong>
              <p style={{ margin: "4px 0 0" }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {mensaje && !error && (
        <div className="content-card" style={{ marginBottom: 18 }}>
          <strong>{mensaje}</strong>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <CalendarDays size={20} />
          </div>
          <div>
            <span>Total de horarios SAP</span>
            <strong>{horarios.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Horarios vigentes</span>
            <strong>{horariosActivos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <UserRound size={20} />
          </div>
          <div>
            <span>Estudiantes SAP</span>
            <strong>{estudiantes.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <MapPin size={20} />
          </div>
          <div>
            <span>Aulas vigentes</span>
            <strong>{aulasActivas}</strong>
          </div>
        </div>
      </div>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h3>Horario individual</h3>
            <p>
              Selecciona un estudiante y consulta directamente su programación
              académica según sus matrículas SAP.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="estudiante-horario">Estudiante</label>
            <select
              id="estudiante-horario"
              value={estudianteSeleccionado}
              onChange={(event) => setEstudianteSeleccionado(event.target.value)}
              disabled={cargando || estudiantes.length === 0}
            >
              <option value="">Selecciona un estudiante</option>
              {estudiantes.map((estudiante) => (
                <option
                  key={estudiante.CODIGOSAP}
                  value={String(estudiante.CODIGOSAP)}
                >
                  {nombreEstudiante(estudiante)} — {estudiante.CODIGOSAP}
                </option>
              ))}
            </select>

            {estudiantes.length === 0 && !cargando && (
              <small>No existen estudiantes vigentes en SAP.</small>
            )}
          </div>

          <div className="form-group">
            <label>Fuente</label>
            <div
              className="status-badge status-active"
              style={{
                display: "inline-flex",
                alignItems: "center",
                width: "fit-content",
                minHeight: "42px",
                padding: "0 14px",
              }}
            >
              SAP — programación académica
            </div>
          </div>
        </div>

        {estudianteActual && (
          <div
            className="attendance-class-card"
            style={{ marginTop: 18 }}
          >
            <div className="attendance-class-header">
              <div>
                <span>ESTUDIANTE SELECCIONADO</span>
                <strong>{nombreEstudiante(estudianteActual)}</strong>
              </div>

              <span className="code-badge">
                {estudianteActual.CODIGOSAP}
              </span>
            </div>
          </div>
        )}
      </section>

      {estudianteSeleccionado && (
        <section className="content-card">
          <div className="content-card-header">
            <div>
              <h3>Horario semanal</h3>
              <p>
                Programación recuperada de SAP mediante estudiante → matrícula
                → paquete/evento → oferta.
              </p>
            </div>
          </div>

          {cargandoHorario ? (
            <div className="no-faces">
              <RefreshCw size={28} />
              <strong>Consultando horario en SAP...</strong>
              <span>Estamos obteniendo la programación del estudiante.</span>
            </div>
          ) : errorHorario ? (
            <div className="no-faces">
              <CalendarDays size={28} />
              <strong>No fue posible consultar el horario</strong>
              <span>{errorHorario}</span>
            </div>
          ) : horariosEstudiante.length === 0 ? (
            <div className="no-faces">
              <CalendarDays size={28} />
              <strong>No tiene horarios asignados</strong>
              <span>
                El estudiante no presenta ofertas académicas asociadas a sus
                matrículas vigentes en SAP.
              </span>
            </div>
          ) : (
            <div
              className="form-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                alignItems: "stretch",
              }}
            >
              {dias.map((dia) => (
                <div
                  key={dia}
                  className="stat-card"
                  style={{ display: "block", minHeight: "170px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <CalendarDays size={17} />
                    <strong>{dia}</strong>
                  </div>

                  {horarioPorDia[dia].length === 0 ? (
                    <span style={{ opacity: 0.6, fontSize: "0.85rem" }}>
                      Sin clases
                    </span>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {horarioPorDia[dia].map((horario) => (
                        <div
                          key={horario.id}
                          style={{
                            padding: 12,
                            border: "1px solid var(--border-color, #e5e7eb)",
                            borderRadius: 10,
                          }}
                        >
                          <strong
                            style={{ display: "block", marginBottom: 5 }}
                          >
                            {texto(horario.MODULO, texto(horario.EVENTO))}
                          </strong>

                          <span
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              marginBottom: 5,
                            }}
                          >
                            Sección {texto(horario.SECCION)}
                          </span>

                          <span className="time-badge">
                            <Clock3 size={12} />
                            {texto(horario.HORAINICIO)} — {texto(horario.HORAFIN)}
                          </span>

                          <span
                            style={{
                              display: "block",
                              marginTop: 7,
                              fontSize: "0.8rem",
                            }}
                          >
                            <MapPin
                              size={12}
                              style={{
                                verticalAlign: "middle",
                                marginRight: 4,
                              }}
                            />
                            {texto(horario.AULA, texto(horario.CODIGOAULA))}
                          </span>

                          <span
                            style={{
                              display: "block",
                              marginTop: 5,
                              fontSize: "0.78rem",
                              opacity: 0.8,
                            }}
                          >
                            {texto(horario.DOCENTE)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h3>Programación académica</h3>
            <p>
              Ofertas vigentes de SAP. Esta tabla es de consulta y no modifica
              la base académica.
            </p>
          </div>

          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar curso, docente, aula, sección..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Curso / Evento</th>
                <th>Sección</th>
                <th>Docente</th>
                <th>Aula</th>
                <th>Día</th>
                <th>Horario</th>
                <th>Periodo</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {horariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table">
                    {cargando
                      ? "Cargando programación académica..."
                      : "No se encontraron horarios."}
                  </td>
                </tr>
              ) : (
                horariosFiltrados.map((horario) => (
                  <tr key={horario.id}>
                    <td>
                      <div className="table-person">
                        <div className="table-avatar">
                          <CalendarDays size={16} />
                        </div>
                        <div>
                          <strong>
                            {texto(horario.MODULO, texto(horario.EVENTO))}
                          </strong>
                          <span>{texto(horario.EVENTO)}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="code-badge">
                        {texto(horario.SECCION)}
                      </span>
                    </td>

                    <td>
                      <span className="table-inline-info">
                        <UserRound size={14} />
                        {texto(horario.DOCENTE)}
                      </span>
                    </td>

                    <td>
                      <span className="table-inline-info">
                        <MapPin size={14} />
                        {texto(horario.AULA, texto(horario.CODIGOAULA))}
                      </span>
                    </td>

                    <td>{texto(horario.DIA)}</td>

                    <td>
                      <span className="time-badge">
                        <Clock3 size={13} />
                        {texto(horario.HORAINICIO)} — {texto(horario.HORAFIN)}
                      </span>
                    </td>

                    <td>{texto(horario.PERIODO)}</td>

                    <td>
                      <span className="status-badge status-active">
                        Vigente
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          Mostrando <strong>{horariosFiltrados.length}</strong> de{" "}
          <strong>{horarios.length}</strong> horarios SAP
        </div>
      </section>
    </div>
  );
}
