import {
  CheckCircle2,
  Edit3,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useAcademic,
} from "../../context/AcademicContext";

import type {
  Matricula,
} from "../../data/matriculas";

interface EstudianteRegistrado {
  person_id: string;
  name: string;
  person_type: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Matriculas() {
  const {
    cursos,
    secciones,
    matriculas,
    agregarMatricula,
    actualizarMatricula,
    eliminarMatricula,
  } = useAcademic();

  /* =========================================================
     ESTUDIANTES
     ========================================================= */

  const [
    estudiantes,
    setEstudiantes,
  ] = useState<EstudianteRegistrado[]>([]);

  const [
    cargandoEstudiantes,
    setCargandoEstudiantes,
  ] = useState(false);

  /* =========================================================
     BÚSQUEDA
     ========================================================= */

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  /* =========================================================
     MODAL
     ========================================================= */

  const [
    modalAbierto,
    setModalAbierto,
  ] = useState(false);

  const [
    matriculaEditando,
    setMatriculaEditando,
  ] = useState<Matricula | null>(null);

  /* =========================================================
     FORMULARIO
     ========================================================= */

  const [
    formulario,
    setFormulario,
  ] = useState({
    estudianteId: "",
    estudianteNombre: "",
    cursoId: "",
    seccionId: "",
    periodo: "2026-I",
    estado: "Activa" as Matricula["estado"],
  });

  /* =========================================================
     CARGAR ESTUDIANTES DESDE FASTAPI
     ========================================================= */

  const cargarEstudiantes = async () => {
    setCargandoEstudiantes(true);

    try {
      const response = await fetch(
        `${API_URL}/api/registered-people`,
      );

      if (!response.ok) {
        throw new Error(
          `Servidor respondió con ${response.status}`,
        );
      }

      const data: {
        success: boolean;
        count: number;
        people: EstudianteRegistrado[];
      } = await response.json();

      if (!data.success) {
        throw new Error(
          "No se pudieron obtener los estudiantes.",
        );
      }

      const estudiantesRegistrados =
        (data.people || []).filter(
          (persona) =>
            persona.person_type === "student",
        );

      setEstudiantes(
        estudiantesRegistrados,
      );
    } catch (error) {
      console.error(
        "Error cargando estudiantes:",
        error,
      );

      alert(
        "No se pudieron cargar los estudiantes registrados en FastAPI.",
      );
    } finally {
      setCargandoEstudiantes(false);
    }
  };

  /* =========================================================
     SECCIONES DISPONIBLES
     ========================================================= */

  const seccionesDisponibles =
    useMemo(() => {
      if (!formulario.cursoId) {
        return [];
      }

      return secciones.filter(
        (seccion) =>
          seccion.cursoId === formulario.cursoId &&
          seccion.periodo.trim().toLowerCase() ===
            formulario.periodo.trim().toLowerCase() &&
          seccion.estado === "Activo",
      );
    }, [
      formulario.cursoId,
      secciones,
    ]);

  /* =========================================================
     MATRÍCULAS FILTRADAS
     ========================================================= */

  const matriculasFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return matriculas;
      }

      return matriculas.filter(
        (matricula) =>
          [
            matricula.estudianteNombre,
            matricula.estudianteId,
            matricula.cursoNombre,
            matricula.cursoId,
            matricula.seccion,
            matricula.periodo,
            matricula.estado,
          ]
            .join(" ")
            .toLowerCase()
            .includes(texto),
      );
    }, [
      busqueda,
      matriculas,
    ]);

  /* =========================================================
     ESTADÍSTICAS
     ========================================================= */

  const activas =
    matriculas.filter(
      (item) =>
        item.estado === "Activa",
    ).length;

  const anuladas =
    matriculas.filter(
      (item) =>
        item.estado === "Anulada",
    ).length;

  const estudiantesMatriculados =
    useMemo(() => {
      return new Set(
        matriculas
          .filter(
            (item) =>
              item.estado === "Activa",
          )
          .map(
            (item) =>
              item.estudianteId,
          ),
      ).size;
    }, [matriculas]);

  /* =========================================================
     NUEVA MATRÍCULA
     ========================================================= */

  const abrirNueva = async () => {
    setMatriculaEditando(null);

    setFormulario({
      estudianteId: "",
      estudianteNombre: "",
      cursoId: "",
      seccionId: "",
      periodo: "2026-I",
      estado: "Activa",
    });

    setModalAbierto(true);

    if (estudiantes.length === 0) {
      await cargarEstudiantes();
    }
  };

  /* =========================================================
     EDITAR MATRÍCULA
     ========================================================= */

  const abrirEditar = async (
    matricula: Matricula,
  ) => {
    setMatriculaEditando(
      matricula,
    );

    setFormulario({
      estudianteId:
        matricula.estudianteId,

      estudianteNombre:
        matricula.estudianteNombre,

      cursoId:
        matricula.cursoId,

      seccionId:
        matricula.seccionId,

      periodo:
        matricula.periodo,

      estado:
        matricula.estado,
    });

    setModalAbierto(true);

    if (estudiantes.length === 0) {
      await cargarEstudiantes();
    }
  };

  /* =========================================================
     CERRAR MODAL
     ========================================================= */

  const cerrarModal = () => {
    setModalAbierto(false);
    setMatriculaEditando(null);
  };

  /* =========================================================
     CAMBIAR ESTUDIANTE
     ========================================================= */

  const cambiarEstudiante = (
    estudianteId: string,
  ) => {
    const estudiante =
      estudiantes.find(
        (item) =>
          item.person_id ===
          estudianteId,
      );

    setFormulario(
      (actual) => ({
        ...actual,
        estudianteId,
        estudianteNombre:
          estudiante?.name ?? "",
      }),
    );
  };

  /* =========================================================
     CAMBIAR CURSO
     ========================================================= */

  const cambiarCurso = (
    cursoId: string,
  ) => {
    setFormulario(
      (actual) => ({
        ...actual,
        cursoId,
        seccionId: "",
      }),
    );
  };

  /* =========================================================
     GUARDAR MATRÍCULA
     ========================================================= */

  const guardarMatricula = () => {
    const estudiante =
      estudiantes.find(
        (item) =>
          item.person_id ===
          formulario.estudianteId,
      );

    const curso =
      cursos.find(
        (item) =>
          item.id ===
          formulario.cursoId,
      );

    const seccion =
      secciones.find(
        (item) =>
          item.id ===
          formulario.seccionId,
      );

    /* -------------------------------------------------------
       VALIDACIONES
       ------------------------------------------------------- */

    if (!estudiante) {
      alert(
        "Selecciona un estudiante.",
      );
      return;
    }

    if (!curso) {
      alert(
        "Selecciona un curso.",
      );
      return;
    }

    if (!seccion) {
      alert(
        "Selecciona una sección.",
      );
      return;
    }

    const periodo =
      formulario.periodo.trim();

    if (!periodo) {
      alert(
        "Ingresa el periodo académico.",
      );
      return;
    }

    if (seccion.cursoId !== curso.id) {
      alert(
        "La sección seleccionada no pertenece al curso.",
      );
      return;
    }

    if (
      seccion.periodo.trim().toLowerCase() !==
      periodo.toLowerCase()
    ) {
      alert(
        "La sección seleccionada no pertenece al periodo académico indicado.",
      );
      return;
    }

    /* -------------------------------------------------------
       VALIDAR DUPLICADOS
       ------------------------------------------------------- */

    const duplicada =
      matriculas.some(
        (item) =>
          item.id !==
            matriculaEditando?.id &&
          item.estudianteId ===
            estudiante.person_id &&
          item.cursoId ===
            curso.id &&
          item.seccionId ===
            seccion.id &&
          item.periodo
            .trim()
            .toLowerCase() ===
            periodo
              .toLowerCase() &&
          item.estado ===
            "Activa",
      );

    if (duplicada) {
      alert(
        "El estudiante ya está matriculado en este curso y sección para el periodo seleccionado.",
      );
      return;
    }

    /* -------------------------------------------------------
       CONSTRUIR MATRÍCULA
       ------------------------------------------------------- */

    const datos: Omit<
      Matricula,
      "id"
    > = {
      estudianteId:
        estudiante.person_id,

      estudianteNombre:
        estudiante.name.trim(),

      cursoId:
        curso.id,

      cursoNombre:
        curso.nombre,

      seccionId:
        seccion.id,

      seccion:
        seccion.codigo,

      periodo,

      fechaMatricula:
        matriculaEditando?.fechaMatricula ??
        new Date()
          .toISOString()
          .split("T")[0],

      estado:
        formulario.estado,
    };

    /* -------------------------------------------------------
       ACTUALIZAR / CREAR
       ------------------------------------------------------- */

    if (matriculaEditando) {
      actualizarMatricula({
        id:
          matriculaEditando.id,
        ...datos,
      });
    } else {
      agregarMatricula(
        datos,
      );
    }

    cerrarModal();
  };

  /* =========================================================
     ELIMINAR
     ========================================================= */

  const eliminar = (
    matricula: Matricula,
  ) => {
    const confirmar =
      window.confirm(
        `¿Deseas eliminar la matrícula de ${matricula.estudianteNombre} en ${matricula.cursoNombre}?`,
      );

    if (!confirmar) {
      return;
    }

    eliminarMatricula(
      matricula.id,
    );
  };

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="page academic-page">

      {/* =====================================================
          ENCABEZADO
          ===================================================== */}

      <div className="page-header">

        <div>

          <span className="section-label">
            <GraduationCap
              size={15}
            />

            GESTIÓN ACADÉMICA
          </span>

          <h1>
            Matrículas
          </h1>

          <p>
            Relaciona estudiantes con
            cursos, secciones y periodos
            académicos.
          </p>

        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={
            abrirNueva
          }
        >
          <Plus size={17} />

          Nueva matrícula
        </button>

      </div>

      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <GraduationCap
              size={20}
            />
          </div>

          <div>
            <span>
              Total de matrículas
            </span>

            <strong>
              {
                matriculas.length
              }
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
              Matrículas activas
            </span>

            <strong>
              {activas}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <UserRound
              size={20}
            />
          </div>

          <div>
            <span>
              Estudiantes matriculados
            </span>

            <strong>
              {
                estudiantesMatriculados
              }
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <Trash2
              size={20}
            />
          </div>

          <div>
            <span>
              Matrículas anuladas
            </span>

            <strong>
              {anuladas}
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
              Registro de matrículas
            </h3>

            <p>
              Consulta las relaciones
              académicas de los estudiantes.
            </p>

          </div>

          <div className="search-box">

            <Search
              size={16}
            />

            <input
              type="text"
              placeholder="Buscar estudiante, curso, sección..."
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
                  Periodo
                </th>

                <th>
                  Fecha
                </th>

                <th>
                  Estado
                </th>

                <th className="text-right">
                  Acciones
                </th>

              </tr>

            </thead>

            <tbody>

              {matriculasFiltradas.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="empty-table"
                  >

                    <div className="attendance-empty">

                      <GraduationCap
                        size={30}
                      />

                      <strong>
                        No hay matrículas
                      </strong>

                      <span>
                        Registra una matrícula
                        para relacionar un
                        estudiante con su curso.
                      </span>

                    </div>

                  </td>

                </tr>

              ) : (

                matriculasFiltradas.map(
                  (
                    matricula,
                  ) => (

                    <tr
                      key={
                        matricula.id
                      }
                    >

                      {/* ESTUDIANTE */}

                      <td>

                        <div className="table-person">

                          <div className="table-avatar">

                            <UserRound
                              size={16}
                            />

                          </div>

                          <div>

                            <strong>
                              {
                                matricula.estudianteNombre
                              }
                            </strong>

                            <span>
                              {
                                matricula.estudianteId
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* CURSO */}

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
                                matricula.cursoNombre
                              }
                            </strong>

                            <span>
                              {
                                matricula.cursoId
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* SECCIÓN */}

                      <td>

                        <span className="code-badge">

                          Sección{" "}

                          {
                            matricula.seccion
                          }

                        </span>

                      </td>

                      {/* PERIODO */}

                      <td>
                        {
                          matricula.periodo
                        }
                      </td>

                      {/* FECHA */}

                      <td>
                        {
                          matricula.fechaMatricula
                        }
                      </td>

                      {/* ESTADO */}

                      <td>

                        <span
                          className={
                            matricula.estado ===
                            "Activa"
                              ? "status-badge status-active"
                              : "status-badge status-inactive"
                          }
                        >
                          {
                            matricula.estado
                          }
                        </span>

                      </td>

                      {/* ACCIONES */}

                      <td>

                        <div className="table-actions">

                          <button
                            type="button"
                            className="icon-button"
                            title="Editar"
                            onClick={() =>
                              abrirEditar(
                                matricula,
                              )
                            }
                          >

                            <Edit3
                              size={15}
                            />

                          </button>

                          <button
                            type="button"
                            className="icon-button danger"
                            title="Eliminar"
                            onClick={() =>
                              eliminar(
                                matricula,
                              )
                            }
                          >

                            <Trash2
                              size={15}
                            />

                          </button>

                        </div>

                      </td>

                    </tr>

                  ),
                )

              )}

            </tbody>

          </table>

        </div>

        <div className="table-footer">

          Mostrando{" "}

          <strong>
            {
              matriculasFiltradas.length
            }
          </strong>

          {" "}de{" "}

          <strong>
            {
              matriculas.length
            }
          </strong>

          {" "}matrículas

        </div>

      </section>

      {/* =====================================================
          MODAL
          ===================================================== */}

      {modalAbierto && (

        <div
          className="modal-overlay"
          onMouseDown={(
            event,
          ) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarModal();
            }

          }}
        >

          <div className="modal">

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <span className="section-label">
                  GESTIÓN ACADÉMICA
                </span>

                <h3>
                  {matriculaEditando
                    ? "Editar matrícula"
                    : "Nueva matrícula"}
                </h3>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  cerrarModal
                }
              >

                <X size={18} />

              </button>

            </div>

            {/* BODY */}

            <div className="modal-body">

              {/* =================================================
                  ESTUDIANTE
                  ================================================= */}

              <div className="form-group">

                <label htmlFor="estudiante-matricula">
                  Estudiante
                </label>

                <select
                  id="estudiante-matricula"
                  value={
                    formulario.estudianteId
                  }
                  onChange={(
                    event,
                  ) =>
                    cambiarEstudiante(
                      event.target.value,
                    )
                  }
                  disabled={
                    cargandoEstudiantes
                  }
                >

                  <option value="">

                    {cargandoEstudiantes
                      ? "Cargando estudiantes..."
                      : "Selecciona un estudiante"}

                  </option>

                  {estudiantes.map(
                    (
                      estudiante,
                    ) => (

                      <option
                        key={
                          estudiante.person_id
                        }
                        value={
                          estudiante.person_id
                        }
                      >
                        {
                          estudiante.name
                        }
                      </option>

                    ),
                  )}

                </select>

                <small className="form-help">

                  Los estudiantes se obtienen
                  desde el registro facial de
                  FastAPI.

                </small>

              </div>

              {/* =================================================
                  CURSO
                  ================================================= */}

              <div className="form-group">

                <label htmlFor="curso-matricula">
                  Curso
                </label>

                <select
                  id="curso-matricula"
                  value={
                    formulario.cursoId
                  }
                  onChange={(
                    event,
                  ) =>
                    cambiarCurso(
                      event.target.value,
                    )
                  }
                >

                  <option value="">
                    Selecciona un curso
                  </option>

                  {cursos
                    .filter(
                      (curso) =>
                        curso.estado ===
                        "Activo",
                    )
                    .map(
                      (
                        curso,
                      ) => (

                        <option
                          key={
                            curso.id
                          }
                          value={
                            curso.id
                          }
                        >

                          {
                            curso.codigo
                          }

                          {" — "}

                          {
                            curso.nombre
                          }

                        </option>

                      ),
                    )}

                </select>

              </div>

              {/* =================================================
                  SECCIÓN + PERIODO
                  ================================================= */}

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="seccion-matricula">
                    Sección
                  </label>

                  <select
                    id="seccion-matricula"
                    value={
                      formulario.seccionId
                    }
                    onChange={(
                      event,
                    ) =>
                      setFormulario(
                        (
                          actual,
                        ) => ({
                          ...actual,
                          seccionId:
                            event.target
                              .value,
                        }),
                      )
                    }
                    disabled={
                      !formulario.cursoId
                    }
                  >

                    <option value="">

                      {!formulario.cursoId
                        ? "Primero selecciona un curso"
                        : "Selecciona una sección"}

                    </option>

                    {seccionesDisponibles.map(
                      (
                        seccion,
                      ) => (

                        <option
                          key={
                            seccion.id
                          }
                          value={
                            seccion.id
                          }
                        >

                          Sección{" "}

                          {
                            seccion.codigo
                          }

                          {" — "}

                          {
                            seccion.docente
                          }

                        </option>

                      ),
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label htmlFor="periodo-matricula">
                    Periodo académico
                  </label>

                  <input
                    id="periodo-matricula"
                    type="text"
                    placeholder="Ej. 2026-I"
                    value={
                      formulario.periodo
                    }
                    onChange={(event) => {
                      const periodo =
                        event.target.value.toUpperCase();

                      setFormulario((actual) => ({
                        ...actual,
                        periodo,
                        seccionId: "",
                      }));
                    }}
                  />

                </div>

              </div>

              {/* =================================================
                  ESTADO
                  ================================================= */}

              <div className="form-group">

                <label htmlFor="estado-matricula">
                  Estado
                </label>

                <select
                  id="estado-matricula"
                  value={
                    formulario.estado
                  }
                  onChange={(
                    event,
                  ) =>
                    setFormulario(
                      (
                        actual,
                      ) => ({
                        ...actual,
                        estado:
                          event.target
                            .value as Matricula["estado"],
                      }),
                    )
                  }
                >

                  <option value="Activa">
                    Activa
                  </option>

                  <option value="Anulada">
                    Anulada
                  </option>

                </select>

              </div>

              {/* =================================================
                  RESUMEN
                  ================================================= */}

              {formulario.estudianteNombre &&
                formulario.cursoId &&
                formulario.seccionId && (

                  <div
                    className="form-help"
                    style={{
                      padding:
                        "12px 14px",
                      marginTop:
                        "4px",
                      borderRadius:
                        "10px",
                      background:
                        "rgba(15, 23, 42, 0.04)",
                    }}
                  >

                    <strong>
                      Matrícula:
                    </strong>

                    <br />

                    {
                      formulario.estudianteNombre
                    }

                    {" → "}

                    {
                      cursos.find(
                        (curso) =>
                          curso.id ===
                          formulario.cursoId,
                      )?.nombre
                    }

                    {" → Sección "}

                    {
                      secciones.find(
                        (seccion) =>
                          seccion.id ===
                          formulario.seccionId,
                      )?.codigo
                    }

                    {" → "}

                    {
                      formulario.periodo
                    }

                  </div>

                )}

            </div>

            {/* FOOTER */}

            <div className="modal-footer">

              <button
                type="button"
                className="btn-secondary"
                onClick={
                  cerrarModal
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={
                  guardarMatricula
                }
                disabled={
                  cargandoEstudiantes ||
                  !formulario.estudianteId ||
                  !formulario.cursoId ||
                  !formulario.seccionId ||
                  !formulario.periodo.trim()
                }
              >

                {matriculaEditando
                  ? "Guardar cambios"
                  : "Registrar matrícula"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}