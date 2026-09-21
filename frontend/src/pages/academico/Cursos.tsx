import {
  BookOpen,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";

import type { Curso } from "../../data/cursos";
import { useAcademic } from "../../context/AcademicContext";

export default function Cursos() {
  /* =========================================================
     DATOS ACADÉMICOS COMPARTIDOS
     ========================================================= */

  const {
    cursos,
    agregarCurso,
    actualizarCurso,
    eliminarCurso,
  } = useAcademic();

  /* =========================================================
     ESTADOS DEL COMPONENTE
     ========================================================= */

  const [busqueda, setBusqueda] =
    useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [cursoEditando, setCursoEditando] =
    useState<Curso | null>(null);

  const [formulario, setFormulario] =
    useState({
      codigo: "",
      nombre: "",
      creditos: 4,
      estado: "Activo" as Curso["estado"],
    });

  /* =========================================================
     FILTRO DE CURSOS
     ========================================================= */

  const cursosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return cursos;
    }

    return cursos.filter((curso) =>
      `${curso.codigo} ${curso.nombre}`
        .toLowerCase()
        .includes(texto),
    );
  }, [busqueda, cursos]);

  /* =========================================================
     NUEVO CURSO
     ========================================================= */

  const abrirNuevo = () => {
    setCursoEditando(null);

    setFormulario({
      codigo: "",
      nombre: "",
      creditos: 4,
      estado: "Activo",
    });

    setModalAbierto(true);
  };

  /* =========================================================
     EDITAR CURSO
     ========================================================= */

  const abrirEditar = (curso: Curso) => {
    setCursoEditando(curso);

    setFormulario({
      codigo: curso.codigo,
      nombre: curso.nombre,
      creditos: curso.creditos,
      estado: curso.estado,
    });

    setModalAbierto(true);
  };

  /* =========================================================
     CERRAR MODAL
     ========================================================= */

  const cerrarModal = () => {
    setModalAbierto(false);
    setCursoEditando(null);
  };

  /* =========================================================
     GUARDAR CURSO
     ========================================================= */

  const guardarCurso = () => {
    const codigo = formulario.codigo.trim();
    const nombre = formulario.nombre.trim();

    if (!codigo || !nombre) {
      alert(
        "Completa el código y nombre del curso.",
      );

      return;
    }

    if (
      formulario.creditos < 1 ||
      formulario.creditos > 20
    ) {
      alert(
        "Los créditos deben estar entre 1 y 20.",
      );

      return;
    }

    /* -------------------------------------------------------
       VALIDAR CÓDIGO DUPLICADO
       ------------------------------------------------------- */

    const codigoDuplicado = cursos.some(
      (curso) =>
        curso.codigo
          .trim()
          .toLowerCase() ===
          codigo.toLowerCase() &&
        curso.id !==
          cursoEditando?.id,
    );

    if (codigoDuplicado) {
      alert(
        "Ya existe un curso con ese código.",
      );

      return;
    }

    /* -------------------------------------------------------
       EDITAR
       ------------------------------------------------------- */

    if (cursoEditando) {
      actualizarCurso({
        ...cursoEditando,
        codigo,
        nombre,
        creditos:
          formulario.creditos,
        estado:
          formulario.estado,
      });
    }

    /* -------------------------------------------------------
       NUEVO
       ------------------------------------------------------- */

    else {
      agregarCurso({
        codigo,
        nombre,
        creditos:
          formulario.creditos,
        estado:
          formulario.estado,
      });
    }

    cerrarModal();
  };

  /* =========================================================
     ELIMINAR CURSO
     ========================================================= */

  const eliminarCursoActual = (
    curso: Curso,
  ) => {
    const tieneSecciones =
      false;

    /*
     * Por ahora la validación de dependencias
     * se realizará posteriormente desde
     * AcademicContext.
     */

    if (tieneSecciones) {
      alert(
        "No puedes eliminar este curso porque tiene secciones asociadas.",
      );

      return;
    }

    const confirmar =
      window.confirm(
        `¿Deseas eliminar el curso "${curso.nombre}"?`,
      );

    if (!confirmar) {
      return;
    }

    eliminarCurso(curso.id);
  };

  /* =========================================================
     ESTADÍSTICAS
     ========================================================= */

  const totalCursos =
    cursos.length;

  const cursosActivos =
    cursos.filter(
      (curso) =>
        curso.estado ===
        "Activo",
    ).length;

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
            <BookOpen size={14} />
            GESTIÓN ACADÉMICA
          </span>

          <h1>Cursos</h1>

          <p>
            Administra los cursos disponibles
            para la programación académica.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={abrirNuevo}
        >
          <Plus size={17} />
          Nuevo curso
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
              Total de cursos
            </span>

            <strong>
              {totalCursos}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <span>
              Cursos activos
            </span>

            <strong>
              {cursosActivos}
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
              Listado de cursos
            </h3>

            <p>
              Gestiona códigos, nombres,
              créditos y estado.
            </p>
          </div>

          <div className="search-box">
            <Search size={16} />

            <input
              type="text"
              placeholder="Buscar curso..."
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
                <th>Código</th>
                <th>Curso</th>
                <th>Créditos</th>
                <th>Estado</th>
                <th className="text-right">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {cursosFiltrados.length ===
              0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="empty-table"
                  >
                    No se encontraron
                    cursos.
                  </td>
                </tr>

              ) : (

                cursosFiltrados.map(
                  (curso) => (
                    <tr
                      key={curso.id}
                    >

                      {/* CÓDIGO */}

                      <td>
                        <span className="code-badge">
                          {curso.codigo}
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
                              {curso.nombre}
                            </strong>

                            <span>
                              {curso.id}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* CRÉDITOS */}

                      <td>
                        {curso.creditos}
                      </td>

                      {/* ESTADO */}

                      <td>
                        <span
                          className={
                            curso.estado ===
                            "Activo"
                              ? "status-badge status-active"
                              : "status-badge status-inactive"
                          }
                        >
                          {curso.estado}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td>
                        <div className="table-actions">

                          <button
                            type="button"
                            className="icon-button"
                            title="Editar curso"
                            aria-label={`Editar ${curso.nombre}`}
                            onClick={() =>
                              abrirEditar(
                                curso,
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
                            title="Eliminar curso"
                            aria-label={`Eliminar ${curso.nombre}`}
                            onClick={() =>
                              eliminarCursoActual(
                                curso,
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
            {cursosFiltrados.length}
          </strong>{" "}

          de{" "}

          <strong>
            {cursos.length}
          </strong>{" "}

          cursos

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
                  {cursoEditando
                    ? "Editar curso"
                    : "Nuevo curso"}
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

              <div className="form-grid">

                {/* CÓDIGO */}

                <div className="form-group">

                  <label htmlFor="codigo">
                    Código del curso
                  </label>

                  <input
                    id="codigo"
                    type="text"
                    placeholder="Ej. PROG-101"
                    value={
                      formulario.codigo
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          codigo:
                            event.target
                              .value,
                        }),
                      )
                    }
                  />

                </div>

                {/* CRÉDITOS */}

                <div className="form-group">

                  <label htmlFor="creditos">
                    Créditos
                  </label>

                  <input
                    id="creditos"
                    type="number"
                    min={1}
                    max={20}
                    value={
                      formulario.creditos
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          creditos:
                            Number(
                              event.target
                                .value,
                            ),
                        }),
                      )
                    }
                  />

                </div>

              </div>

              {/* NOMBRE */}

              <div className="form-group">

                <label htmlFor="nombre">
                  Nombre del curso
                </label>

                <input
                  id="nombre"
                  type="text"
                  placeholder="Ej. Programación Web"
                  value={
                    formulario.nombre
                  }
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        nombre:
                          event.target
                            .value,
                      }),
                    )
                  }
                />

              </div>

              {/* ESTADO */}

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
                          event.target
                            .value as Curso["estado"],
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
                onClick={guardarCurso}
              >
                {cursoEditando
                  ? "Guardar cambios"
                  : "Registrar curso"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}