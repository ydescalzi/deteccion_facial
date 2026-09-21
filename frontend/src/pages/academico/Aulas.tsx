import {
  Building2,
  Camera,
  Edit3,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type { Aula } from "../../data/aulas";

import {
  useAcademic,
} from "../../context/AcademicContext";

export default function Aulas() {
  /* =========================================================
     DATOS ACADÉMICOS COMPARTIDOS
     ========================================================= */

  const {
    aulas,
    agregarAula,
    actualizarAula,
    eliminarAula,
  } = useAcademic();

  /* =========================================================
     ESTADOS
     ========================================================= */

  const [busqueda, setBusqueda] =
    useState("");

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [aulaEditando, setAulaEditando] =
    useState<Aula | null>(null);

  const [formulario, setFormulario] =
    useState({
      codigo: "",
      nombre: "",
      edificio: "",
      piso: 1,
      capacidad: 30,
      camara: "",
      estado:
        "Activo" as Aula["estado"],
    });

  /* =========================================================
     FILTRO
     ========================================================= */

  const aulasFiltradas = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    if (!texto) {
      return aulas;
    }

    return aulas.filter((aula) =>
      [
        aula.codigo,
        aula.nombre,
        aula.edificio,
        aula.camara,
        String(aula.piso),
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto),
    );
  }, [busqueda, aulas]);

  /* =========================================================
     NUEVA AULA
     ========================================================= */

  const abrirNuevo = () => {
    setAulaEditando(null);

    setFormulario({
      codigo: "",
      nombre: "",
      edificio: "",
      piso: 1,
      capacidad: 30,
      camara: "",
      estado: "Activo",
    });

    setModalAbierto(true);
  };

  /* =========================================================
     EDITAR AULA
     ========================================================= */

  const abrirEditar = (
    aula: Aula,
  ) => {
    setAulaEditando(aula);

    setFormulario({
      codigo: aula.codigo,
      nombre: aula.nombre,
      edificio: aula.edificio,
      piso: aula.piso,
      capacidad: aula.capacidad,
      camara: aula.camara,
      estado: aula.estado,
    });

    setModalAbierto(true);
  };

  /* =========================================================
     CERRAR MODAL
     ========================================================= */

  const cerrarModal = () => {
    setModalAbierto(false);
    setAulaEditando(null);
  };

  /* =========================================================
     GUARDAR AULA
     ========================================================= */

  const guardarAula = () => {
    const codigo =
      formulario.codigo
        .trim()
        .toUpperCase();

    const nombre =
      formulario.nombre.trim();

    const edificio =
      formulario.edificio.trim();

    const camara =
      formulario.camara
        .trim()
        .toUpperCase();

    /* -------------------------------------------------------
       VALIDACIONES
       ------------------------------------------------------- */

    if (
      !codigo ||
      !nombre ||
      !edificio
    ) {
      alert(
        "Completa el código, nombre y edificio del aula.",
      );

      return;
    }

    if (
      formulario.piso < 0 ||
      formulario.piso > 100
    ) {
      alert(
        "El piso debe estar entre 0 y 100.",
      );

      return;
    }

    if (
      formulario.capacidad < 1 ||
      formulario.capacidad > 1000
    ) {
      alert(
        "La capacidad debe estar entre 1 y 1000 personas.",
      );

      return;
    }

    /* -------------------------------------------------------
       VALIDAR CÓDIGO DUPLICADO
       ------------------------------------------------------- */

    const codigoDuplicado =
      aulas.some(
        (aula) =>
          aula.codigo
            .trim()
            .toLowerCase() ===
            codigo.toLowerCase() &&
          aula.id !==
            aulaEditando?.id,
      );

    if (codigoDuplicado) {
      alert(
        "Ya existe un aula con ese código.",
      );

      return;
    }

    /* -------------------------------------------------------
       EDITAR
       ------------------------------------------------------- */

    if (aulaEditando) {
      actualizarAula({
        ...aulaEditando,

        codigo,

        nombre,

        edificio,

        piso:
          formulario.piso,

        capacidad:
          formulario.capacidad,

        camara,

        estado:
          formulario.estado,
      });
    }

    /* -------------------------------------------------------
       NUEVA
       ------------------------------------------------------- */

    else {
      agregarAula({
        codigo,

        nombre,

        edificio,

        piso:
          formulario.piso,

        capacidad:
          formulario.capacidad,

        camara,

        estado:
          formulario.estado,
      });
    }

    cerrarModal();
  };

  /* =========================================================
     ELIMINAR
     ========================================================= */

  const eliminarAulaActual = (
    aula: Aula,
  ) => {
    const confirmar =
      window.confirm(
        `¿Deseas eliminar el aula "${aula.nombre}"?`,
      );

    if (!confirmar) {
      return;
    }

    eliminarAula(aula.id);
  };

  /* =========================================================
     ESTADÍSTICAS
     ========================================================= */

  const aulasActivas =
    aulas.filter(
      (aula) =>
        aula.estado === "Activo",
    ).length;

  const capacidadTotal =
    aulas.reduce(
      (total, aula) =>
        total + aula.capacidad,
      0,
    );

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
            <Building2 size={14} />
            GESTIÓN ACADÉMICA
          </span>

          <h1>Aulas</h1>

          <p>
            Administra las aulas, laboratorios
            y cámaras asociadas al sistema.
          </p>

        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={abrirNuevo}
        >
          <Plus size={17} />
          Nueva aula
        </button>

      </div>

      {/* =====================================================
          ESTADÍSTICAS
          ===================================================== */}

      <div className="stats-grid">

        {/* TOTAL */}

        <div className="stat-card">

          <div className="stat-icon">
            <Building2 size={20} />
          </div>

          <div>

            <span>
              Total de aulas
            </span>

            <strong>
              {aulas.length}
            </strong>

          </div>

        </div>

        {/* ACTIVAS */}

        <div className="stat-card">

          <div className="stat-icon">
            <Camera size={20} />
          </div>

          <div>

            <span>
              Aulas activas
            </span>

            <strong>
              {aulasActivas}
            </strong>

          </div>

        </div>

        {/* CAPACIDAD */}

        <div className="stat-card">

          <div className="stat-icon">
            <Users size={20} />
          </div>

          <div>

            <span>
              Capacidad total
            </span>

            <strong>
              {capacidadTotal}
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
              Listado de aulas
            </h3>

            <p>
              Gestiona aulas, capacidad y
              cámaras de reconocimiento.
            </p>

          </div>

          <div className="search-box">

            <Search size={16} />

            <input
              type="text"
              placeholder="Buscar aula..."
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

                <th>
                  Aula
                </th>

                <th>
                  Ubicación
                </th>

                <th>
                  Capacidad
                </th>

                <th>
                  Cámara
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

              {aulasFiltradas.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="empty-table"
                  >
                    No se encontraron aulas.
                  </td>

                </tr>

              ) : (

                aulasFiltradas.map(
                  (aula) => (

                    <tr
                      key={aula.id}
                    >

                      {/* AULA */}

                      <td>

                        <div className="table-person">

                          <div className="table-avatar">

                            <Building2
                              size={16}
                            />

                          </div>

                          <div>

                            <strong>
                              {aula.nombre}
                            </strong>

                            <span>
                              {aula.codigo}
                            </span>

                          </div>

                        </div>

                      </td>

                      {/* UBICACIÓN */}

                      <td>

                        <div>

                          <strong>
                            {aula.edificio}
                          </strong>

                          <span>
                            Piso{" "}
                            {aula.piso}
                          </span>

                        </div>

                      </td>

                      {/* CAPACIDAD */}

                      <td>

                        <span className="table-inline-info">

                          <Users size={14} />

                          {aula.capacidad}

                        </span>

                      </td>

                      {/* CÁMARA */}

                      <td>

                        <span className="code-badge">

                          <Camera size={12} />

                          {aula.camara ||
                            "Sin cámara"}

                        </span>

                      </td>

                      {/* ESTADO */}

                      <td>

                        <span
                          className={
                            aula.estado ===
                            "Activo"
                              ? "status-badge status-active"
                              : "status-badge status-inactive"
                          }
                        >
                          {aula.estado}
                        </span>

                      </td>

                      {/* ACCIONES */}

                      <td>

                        <div className="table-actions">

                          <button
                            type="button"
                            className="icon-button"
                            title="Editar"
                            aria-label={`Editar ${aula.nombre}`}
                            onClick={() =>
                              abrirEditar(
                                aula,
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
                            aria-label={`Eliminar ${aula.nombre}`}
                            onClick={() =>
                              eliminarAulaActual(
                                aula,
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
            {aulasFiltradas.length}
          </strong>{" "}

          de{" "}

          <strong>
            {aulas.length}
          </strong>{" "}

          aulas

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

            {/* =================================================
                HEADER
                ================================================= */}

            <div className="modal-header">

              <div>

                <span className="section-label">
                  GESTIÓN ACADÉMICA
                </span>

                <h3>

                  {aulaEditando
                    ? "Editar aula"
                    : "Nueva aula"}

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

            {/* =================================================
                BODY
                ================================================= */}

            <div className="modal-body">

              {/* CÓDIGO + CAPACIDAD */}

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="codigo-aula">
                    Código del aula
                  </label>

                  <input
                    id="codigo-aula"
                    type="text"
                    placeholder="Ej. LAB-302"
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

                  <label htmlFor="capacidad">
                    Capacidad
                  </label>

                  <input
                    id="capacidad"
                    type="number"
                    min={1}
                    max={1000}
                    value={
                      formulario.capacidad
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          capacidad:
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

                <label htmlFor="nombre-aula">
                  Nombre del aula
                </label>

                <input
                  id="nombre-aula"
                  type="text"
                  placeholder="Ej. Laboratorio de Cómputo 302"
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

              {/* EDIFICIO + PISO */}

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="edificio">
                    Edificio
                  </label>

                  <input
                    id="edificio"
                    type="text"
                    placeholder="Ej. Edificio Principal"
                    value={
                      formulario.edificio
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          edificio:
                            event.target.value,
                        }),
                      )
                    }
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="piso">
                    Piso
                  </label>

                  <input
                    id="piso"
                    type="number"
                    min={0}
                    max={100}
                    value={
                      formulario.piso
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          piso:
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

              {/* CÁMARA + ESTADO */}

              <div className="form-grid">

                <div className="form-group">

                  <label htmlFor="camara">
                    Cámara asociada
                  </label>

                  <input
                    id="camara"
                    type="text"
                    placeholder="Ej. CAM-02"
                    value={
                      formulario.camara
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          camara:
                            event.target.value.toUpperCase(),
                        }),
                      )
                    }
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="estado-aula">
                    Estado
                  </label>

                  <select
                    id="estado-aula"
                    value={
                      formulario.estado
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          estado:
                            event.target.value as Aula["estado"],
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

            {/* =================================================
                FOOTER
                ================================================= */}

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
                onClick={guardarAula}
              >

                {aulaEditando
                  ? "Guardar cambios"
                  : "Registrar aula"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}