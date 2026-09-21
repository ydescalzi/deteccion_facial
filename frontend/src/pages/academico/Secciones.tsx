import {
  BookOpen,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type { Seccion } from "../../data/secciones";

import {
  useAcademic,
} from "../../context/AcademicContext";

export default function Secciones() {
  /* =========================================================
     DATOS ACADÉMICOS COMPARTIDOS
     ========================================================= */

  const {
    cursos,
    secciones,
    docentes,
    agregarSeccion,
    actualizarSeccion,
    eliminarSeccion,
  } = useAcademic();

  /* =========================================================
     ESTADOS
     ========================================================= */

  const [busqueda, setBusqueda] =
    useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [seccionEditando, setSeccionEditando] =
    useState<Seccion | null>(null);

  const [formulario, setFormulario] =
    useState({
      codigo: "",
      cursoId: "",
      docenteId: "",
      docente: "",
      periodo: "2026-I",
      turno:
        "Mañana" as Seccion["turno"],
      estado:
        "Activo" as Seccion["estado"],
    });

  /* =========================================================
     CURSOS ACTIVOS
     ========================================================= */

  const cursosActivos = useMemo(
    () =>
      cursos.filter(
        (curso) =>
          curso.estado === "Activo",
      ),
    [cursos],
  );

  /* =========================================================
     FILTRO
     ========================================================= */

  const seccionesFiltradas =
    useMemo(() => {
      const texto = busqueda
        .trim()
        .toLowerCase();

      if (!texto) {
        return secciones;
      }

      return secciones.filter(
        (seccion) =>
          [
            seccion.codigo,
            seccion.cursoNombre,
            seccion.docente,
            seccion.periodo,
            seccion.turno,
          ]
            .join(" ")
            .toLowerCase()
            .includes(texto),
      );
    }, [busqueda, secciones]);

  /* =========================================================
     NUEVA SECCIÓN
     ========================================================= */

  const abrirNuevo = () => {
    setSeccionEditando(null);

    setFormulario({
      codigo: "",
      cursoId:
        cursosActivos[0]?.id ?? "",
      docenteId: "",
      docente: "",
      periodo: "2026-I",
      turno: "Mañana",
      estado: "Activo",
    });

    setModalAbierto(true);
  };

  /* =========================================================
     EDITAR
     ========================================================= */

  const abrirEditar = (
    seccion: Seccion,
  ) => {
    setSeccionEditando(seccion);

    setFormulario({
      codigo: seccion.codigo,
      cursoId: seccion.cursoId,
      docenteId: seccion.docenteId,
      docente: seccion.docente,
      periodo: seccion.periodo,
      turno: seccion.turno,
      estado: seccion.estado,
    });

    setModalAbierto(true);
  };

  /* =========================================================
     CERRAR
     ========================================================= */

  const cerrarModal = () => {
    setModalAbierto(false);
    setSeccionEditando(null);
  };

  /* =========================================================
     GUARDAR
     ========================================================= */

  const guardarSeccion = () => {
    const codigo =
      formulario.codigo
        .trim()
        .toUpperCase();

    const periodo =
      formulario.periodo.trim();

    if (!codigo) {
      alert(
        "Ingresa el código de la sección.",
      );
      return;
    }

    if (!formulario.cursoId) {
      alert(
        "Selecciona un curso.",
      );
      return;
    }

    if (!formulario.docenteId) {
      alert(
        "Selecciona un docente.",
      );
      return;
    }

    const docenteSeleccionado = docentes.find(
      (item) => item.id === formulario.docenteId,
    );

    if (!docenteSeleccionado) {
      alert(
        "El docente seleccionado no existe.",
      );
      return;
    }

    const docente = `${docenteSeleccionado.nombres} ${docenteSeleccionado.apellidos}`.trim();

    if (!periodo) {
      alert(
        "Ingresa el periodo académico.",
      );
      return;
    }

    /* =======================================================
       BUSCAR CURSO
       ======================================================= */

    const cursoSeleccionado =
      cursos.find(
        (curso) =>
          curso.id ===
          formulario.cursoId,
      );

    if (!cursoSeleccionado) {
      alert(
        "El curso seleccionado no existe.",
      );
      return;
    }

    /* =======================================================
       VALIDAR DUPLICADO
       ======================================================= */

    const duplicada =
      secciones.some(
        (seccion) =>
          seccion.cursoId ===
            cursoSeleccionado.id &&
          seccion.codigo
            .trim()
            .toLowerCase() ===
            codigo.toLowerCase() &&
          seccion.periodo
            .trim()
            .toLowerCase() ===
            periodo.toLowerCase() &&
          seccion.id !==
            seccionEditando?.id,
      );

    if (duplicada) {
      alert(
        `Ya existe la sección ${codigo} para ${cursoSeleccionado.nombre} en el periodo ${periodo}.`,
      );
      return;
    }

    /* =======================================================
       EDITAR
       ======================================================= */

    if (seccionEditando) {
      actualizarSeccion({
        ...seccionEditando,

        codigo,

        cursoId:
          cursoSeleccionado.id,

        cursoNombre:
          cursoSeleccionado.nombre,

        docenteId:
          formulario.docenteId,

        docente,

        periodo,

        turno:
          formulario.turno,

        estado:
          formulario.estado,
      });
    }

    /* =======================================================
       NUEVA
       ======================================================= */

    else {
      agregarSeccion({
        codigo,

        cursoId:
          cursoSeleccionado.id,

        cursoNombre:
          cursoSeleccionado.nombre,

        docenteId:
          formulario.docenteId,

        docente,

        periodo,

        turno:
          formulario.turno,

        estado:
          formulario.estado,
      });
    }

    cerrarModal();
  };

  /* =========================================================
     ELIMINAR
     ========================================================= */

  const eliminarSeccionActual = (
    seccion: Seccion,
  ) => {
    const confirmar =
      window.confirm(
        `¿Deseas eliminar la sección "${seccion.codigo}" del curso "${seccion.cursoNombre}"?`,
      );

    if (!confirmar) {
      return;
    }

    eliminarSeccion(seccion.id);
  };

  /* =========================================================
     ESTADÍSTICAS
     ========================================================= */

  const activas =
    secciones.filter(
      (seccion) =>
        seccion.estado === "Activo",
    ).length;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="page academic-page">

      {/* =====================================================
          CABECERA
          ===================================================== */}

      <div className="page-header">
        <div>
          <span className="section-label">
            <BookOpen size={14} />
            GESTIÓN ACADÉMICA
          </span>

          <h1>Secciones</h1>

          <p>
            Administra las secciones y grupos
            asignados a cada curso.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={abrirNuevo}
          disabled={
            cursosActivos.length === 0
          }
        >
          <Plus size={17} />
          Nueva sección
        </button>
      </div>

      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}

      <div className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <span>
              Total de secciones
            </span>

            <strong>
              {secciones.length}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <span>
              Secciones activas
            </span>

            <strong>
              {activas}
            </strong>
          </div>

        </div>

        <div className="stat-card">

          <div className="stat-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <span>
              Cursos disponibles
            </span>

            <strong>
              {cursosActivos.length}
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
              Listado de secciones
            </h3>

            <p>
              Consulta y administra los
              grupos académicos.
            </p>
          </div>

          <div className="search-box">

            <Search size={16} />

            <input
              type="text"
              placeholder="Buscar sección..."
              value={busqueda}
              onChange={(event) =>
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
                <th>Sección</th>
                <th>Curso</th>
                <th>Docente</th>
                <th>Periodo</th>
                <th>Turno</th>
                <th>Estado</th>
                <th className="text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {seccionesFiltradas.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="empty-table"
                  >
                    No se encontraron
                    secciones.
                  </td>

                </tr>

              ) : (

                seccionesFiltradas.map(
                  (seccion) => (

                    <tr
                      key={seccion.id}
                    >

                      {/* SECCIÓN */}

                      <td>
                        <span className="code-badge">
                          Sección{" "}
                          {seccion.codigo}
                        </span>
                      </td>

                      {/* CURSO */}

                      <td>

                        <div className="table-person">

                          <div className="table-avatar">

                            <BookOpen
                              size={16}
                            />

                          </div>

                          <div>

                            <strong>
                              {
                                seccion.cursoNombre
                              }
                            </strong>

                            <span>
                              {
                                seccion.cursoId
                              }
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* DOCENTE */}

                      <td>
                        {seccion.docente}
                      </td>

                      {/* PERIODO */}

                      <td>
                        {seccion.periodo}
                      </td>

                      {/* TURNO */}

                      <td>
                        {seccion.turno}
                      </td>

                      {/* ESTADO */}

                      <td>

                        <span
                          className={
                            seccion.estado ===
                            "Activo"
                              ? "status-badge status-active"
                              : "status-badge status-inactive"
                          }
                        >
                          {
                            seccion.estado
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
                            aria-label={`Editar sección ${seccion.codigo}`}
                            onClick={() =>
                              abrirEditar(
                                seccion,
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
                            aria-label={`Eliminar sección ${seccion.codigo}`}
                            onClick={() =>
                              eliminarSeccionActual(
                                seccion,
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

        {/* ===================================================
            PIE
            =================================================== */}

        <div className="table-footer">

          Mostrando{" "}

          <strong>
            {
              seccionesFiltradas.length
            }
          </strong>{" "}

          de{" "}

          <strong>
            {secciones.length}
          </strong>{" "}

          secciones

        </div>

      </section>

      {/* =====================================================
          MODAL
          ===================================================== */}

      {modalAbierto && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {

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
                  {seccionEditando
                    ? "Editar sección"
                    : "Nueva sección"}
                </h3>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>

            </div>

            {/* BODY */}

            <div className="modal-body">

              {/* =================================================
                  SECCIÓN + PERIODO
                  ================================================= */}

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="seccion">
                    Sección
                  </label>

                  <input
                    id="seccion"
                    type="text"
                    maxLength={5}
                    placeholder="Ej. A"
                    value={
                      formulario.codigo
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          codigo:
                            event.target.value.toUpperCase(),
                        }),
                      )
                    }
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="periodo">
                    Periodo académico
                  </label>

                  <input
                    id="periodo"
                    type="text"
                    placeholder="Ej. 2026-I"
                    value={
                      formulario.periodo
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          periodo:
                            event.target.value,
                        }),
                      )
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  CURSO
                  ================================================= */}

              <div className="form-group">

                <label htmlFor="curso">
                  Curso
                </label>

                <select
                  id="curso"
                  value={
                    formulario.cursoId
                  }
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        cursoId:
                          event.target.value,
                      }),
                    )
                  }
                >

                  <option value="">
                    Selecciona un curso
                  </option>

                  {cursosActivos.map(
                    (curso) => (

                      <option
                        key={curso.id}
                        value={curso.id}
                      >
                        {curso.codigo} —{" "}
                        {curso.nombre}
                      </option>

                    ),
                  )}

                </select>

                {cursosActivos.length ===
                  0 && (
                  <small>
                    No existen cursos
                    activos. Registra
                    primero un curso.
                  </small>
                )}

              </div>

              {/* =================================================
                  DOCENTE
                  ================================================= */}

              <div className="form-group">

                <label htmlFor="docente">
                  Docente
                </label>

                <select
                  id="docente"
                  value={formulario.docenteId}
                  onChange={(event) => {
                    const docenteSeleccionado =
                      docentes.find(
                        (item) => item.id === event.target.value,
                      );

                    setFormulario((actual) => ({
                      ...actual,
                      docenteId: event.target.value,
                      docente: docenteSeleccionado
                        ? `${docenteSeleccionado.nombres} ${docenteSeleccionado.apellidos}`
                        : "",
                    }));
                  }}
                >
                  <option value="">
                    Selecciona un docente
                  </option>

                  {docentes
                    .filter((docente) => docente.estado === "Activo")
                    .map((docente) => (
                      <option key={docente.id} value={docente.id}>
                        {docente.nombres} {docente.apellidos}
                      </option>
                    ))}
                </select>

                {docentes.filter(
                  (docente) => docente.estado === "Activo",
                ).length === 0 && (
                  <small>
                    No existen docentes activos. Registra primero un docente.
                  </small>
                )}

              </div>

              {/* =================================================
                  TURNO + ESTADO
                  ================================================= */}

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="turno">
                    Turno
                  </label>

                  <select
                    id="turno"
                    value={
                      formulario.turno
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          turno:
                            event.target.value as Seccion["turno"],
                        }),
                      )
                    }
                  >

                    <option value="Mañana">
                      Mañana
                    </option>

                    <option value="Tarde">
                      Tarde
                    </option>

                    <option value="Noche">
                      Noche
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label htmlFor="estado">
                    Estado
                  </label>

                  <select
                    id="estado"
                    value={
                      formulario.estado
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          estado:
                            event.target.value as Seccion["estado"],
                        }),
                      )
                    }
                  >

                    <option value="Activo">
                      Activo
                    </option>

                    <option value="Inactivo">
                      Inactivo
                    </option>

                  </select>

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="modal-footer">

              <button
                type="button"
                className="btn-secondary"
                onClick={cerrarModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={guardarSeccion}
                disabled={
                  cursosActivos.length ===
                    0 ||
                  !formulario.cursoId ||
                  !formulario.docenteId
                }
              >
                {seccionEditando
                  ? "Guardar cambios"
                  : "Registrar sección"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}