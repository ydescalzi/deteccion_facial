import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import {
  cursosIniciales,
  type Curso,
} from "../data/cursos";

import {
  seccionesIniciales,
  type Seccion,
} from "../data/secciones";

import {
  aulasIniciales,
  type Aula,
} from "../data/aulas";

import {
  horariosIniciales,
  type Horario,
} from "../data/horarios";

import {
  matriculasIniciales,
  type Matricula,
} from "../data/matriculas";

import {
  docentesIniciales,
  type Docente,
} from "../data/docentes";

import {
  terminalesIniciales,
  type Terminal,
} from "../data/terminales";

/* =========================================================
   TIPOS DEL CONTEXTO
   ========================================================= */

interface AcademicContextValue {
  /* =======================================================
     DATOS ACADÉMICOS
     ======================================================= */

  cursos: Curso[];
  secciones: Seccion[];
  aulas: Aula[];
  horarios: Horario[];
  matriculas: Matricula[];
  docentes: Docente[];
  terminales: Terminal[];

  /* =======================================================
     CURSOS
     ======================================================= */

  agregarCurso: (
    curso: Omit<Curso, "id">,
  ) => void;

  actualizarCurso: (
    curso: Curso,
  ) => void;

  eliminarCurso: (
    cursoId: string,
  ) => void;

  /* =======================================================
     SECCIONES
     ======================================================= */

  agregarSeccion: (
    seccion: Omit<Seccion, "id">,
  ) => void;

  actualizarSeccion: (
    seccion: Seccion,
  ) => void;

  eliminarSeccion: (
    seccionId: string,
  ) => void;

  /* =======================================================
     AULAS
     ======================================================= */

  agregarAula: (
    aula: Omit<Aula, "id">,
  ) => void;

  actualizarAula: (
    aula: Aula,
  ) => void;

  eliminarAula: (
    aulaId: string,
  ) => void;

  /* =======================================================
     HORARIOS
     ======================================================= */

  agregarHorario: (
    horario: Omit<Horario, "id">,
  ) => void;

  actualizarHorario: (
    horario: Horario,
  ) => void;

  eliminarHorario: (
    horarioId: string,
  ) => void;

  /* =======================================================
     MATRÍCULAS
     ======================================================= */

  agregarMatricula: (
    matricula: Omit<Matricula, "id">,
  ) => void;

  actualizarMatricula: (
    matricula: Matricula,
  ) => void;

  eliminarMatricula: (
    matriculaId: string,
  ) => void;

  /* =======================================================
     DOCENTES
     ======================================================= */

  agregarDocente: (
    docente: Omit<Docente, "id">,
  ) => void;

  actualizarDocente: (
    docente: Docente,
  ) => void;

  eliminarDocente: (
    docenteId: string,
  ) => void;

  agregarTerminal: (
    terminal: Omit<Terminal, "id">,
  ) => void;

  actualizarTerminal: (
    terminal: Terminal,
  ) => void;

  eliminarTerminal: (
    terminalId: string,
  ) => void;

  /* =======================================================
     CONSULTAS
     ======================================================= */

  obtenerMatriculasEstudiante: (
    estudianteId: string,
  ) => Matricula[];

  obtenerMatriculasEstudiantePorNombre: (
    estudianteNombre: string,
  ) => Matricula[];

  obtenerHorarioMatricula: (
    matricula: Matricula,
  ) => Horario | undefined;

  obtenerHorariosEstudiante: (
    estudianteId: string,
  ) => Horario[];

  obtenerHorariosEstudiantePorNombre: (
    estudianteNombre: string,
  ) => Horario[];

  /* =======================================================
     RESTAURAR DATOS
     ======================================================= */

  restaurarDatosIniciales: () => void;
}

/* =========================================================
   CONTEXTO
   ========================================================= */

const AcademicContext =
  createContext<
    AcademicContextValue | undefined
  >(undefined);

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  "usmp_asistencia_academic_data_v2";

interface AcademicStorage {
  cursos: Curso[];
  secciones: Seccion[];
  aulas: Aula[];
  horarios: Horario[];
  matriculas: Matricula[];
  docentes: Docente[];
  terminales: Terminal[];
}

/* =========================================================
   GENERADOR DE IDENTIFICADORES
   ========================================================= */

function generarId(
  prefijo: string,
): string {
  return `${prefijo}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 7)}`;
}

/* =========================================================
   NORMALIZAR TEXTO
   ========================================================= */

function normalizarTexto(
  texto: string,
): string {
  return texto
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/* =========================================================
   NORMALIZAR PERIODO
   ========================================================= */

function normalizarPeriodo(
  periodo: string,
): string {
  return periodo
    .trim()
    .toLowerCase();
}

/* =========================================================
   OBTENER NOMBRE COMPLETO DOCENTE
   ========================================================= */

function nombreCompletoDocente(
  docente: Docente,
): string {
  return `${docente.nombres} ${docente.apellidos}`.trim();
}

/* =========================================================
   PROVIDER
   ========================================================= */

interface AcademicProviderProps {
  children: ReactNode;
}

export function AcademicProvider({
  children,
}: AcademicProviderProps) {
  /* =======================================================
     ESTADOS
     ======================================================= */

  const [cursos, setCursos] =
    useState<Curso[]>(
      cursosIniciales,
    );

  const [secciones, setSecciones] =
    useState<Seccion[]>(
      seccionesIniciales,
    );

  const [aulas, setAulas] =
    useState<Aula[]>(
      aulasIniciales,
    );

  const [horarios, setHorarios] =
    useState<Horario[]>(
      horariosIniciales,
    );

  const [matriculas, setMatriculas] =
    useState<Matricula[]>(
      matriculasIniciales,
    );

  const [docentes, setDocentes] =
    useState<Docente[]>(
      docentesIniciales,
    );

  const [terminales, setTerminales] =
    useState<Terminal[]>(
      terminalesIniciales,
    );

  /* =======================================================
     CARGAR DATOS DESDE LOCALSTORAGE
     ======================================================= */

  useEffect(() => {
    try {
      const datosGuardados =
        localStorage.getItem(
          STORAGE_KEY,
        );

      if (!datosGuardados) {
        return;
      }

      const datos =
        JSON.parse(
          datosGuardados,
        ) as Partial<AcademicStorage>;

      if (
        Array.isArray(
          datos.cursos,
        )
      ) {
        setCursos(
          datos.cursos,
        );
      }

      if (
        Array.isArray(
          datos.secciones,
        )
      ) {
        /*
         * Compatibilidad con secciones
         * antiguas que todavía no tenían
         * docenteId.
         */
        const seccionesNormalizadas =
          datos.secciones.map(
            (seccion) => {
              const seccionActual =
                seccion as Seccion & {
                  docenteId?: string;
                };

              if (
                seccionActual.docenteId
              ) {
                return seccionActual;
              }

              const docenteEncontrado =
                docentesIniciales.find(
                  (docente) =>
                    normalizarTexto(
                      nombreCompletoDocente(
                        docente,
                      ),
                    ) ===
                    normalizarTexto(
                      seccionActual.docente,
                    ),
                );

              return {
                ...seccionActual,
                docenteId:
                  docenteEncontrado?.id ??
                  "",
              };
            },
          );

        setSecciones(
          seccionesNormalizadas,
        );
      }

      if (
        Array.isArray(
          datos.aulas,
        )
      ) {
        setAulas(
          datos.aulas,
        );
      }

      if (
        Array.isArray(
          datos.horarios,
        )
      ) {
        setHorarios(
          datos.horarios,
        );
      }

      if (
        Array.isArray(
          datos.matriculas,
        )
      ) {
        setMatriculas(
          datos.matriculas,
        );
      }

      if (
        Array.isArray(
          datos.docentes,
        )
      ) {
        setDocentes(
          datos.docentes,
        );
      }

      if (
        Array.isArray(
          datos.terminales,
        )
      ) {
        setTerminales(
          datos.terminales.map((terminal) => ({
            ...terminal,
            horarioIds: Array.isArray(terminal.horarioIds)
              ? terminal.horarioIds
              : [],
          })),
        );
      }
    } catch (error) {
      console.error(
        "No se pudieron cargar los datos académicos:",
        error,
      );
    }
  }, []);

  /* =======================================================
     GUARDAR DATOS EN LOCALSTORAGE
     ======================================================= */

  useEffect(() => {
    const datos: AcademicStorage = {
      cursos,
      secciones,
      aulas,
      horarios,
      matriculas,
      docentes,
      terminales,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(datos),
    );
  }, [
    cursos,
    secciones,
    aulas,
    horarios,
    matriculas,
    docentes,
    terminales,
  ]);

  /* =======================================================
     CURSOS
     ======================================================= */

  const agregarCurso = (
    curso: Omit<Curso, "id">,
  ) => {
    const nuevoCurso: Curso = {
      id: generarId("CUR"),
      ...curso,
    };

    setCursos(
      (actuales) => [
        ...actuales,
        nuevoCurso,
      ],
    );
  };

  const actualizarCurso = (
    curso: Curso,
  ) => {
    setCursos(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id === curso.id
              ? curso
              : item,
        ),
    );

    /* Actualizar nombre en secciones */

    setSecciones(
      (actuales) =>
        actuales.map(
          (seccion) =>
            seccion.cursoId ===
            curso.id
              ? {
                  ...seccion,
                  cursoNombre:
                    curso.nombre,
                }
              : seccion,
        ),
    );

    /* Actualizar nombre en horarios */

    setHorarios(
      (actuales) =>
        actuales.map(
          (horario) =>
            horario.cursoId ===
            curso.id
              ? {
                  ...horario,
                  cursoNombre:
                    curso.nombre,
                }
              : horario,
        ),
    );

    /* Actualizar nombre en matrículas */

    setMatriculas(
      (actuales) =>
        actuales.map(
          (matricula) =>
            matricula.cursoId ===
            curso.id
              ? {
                  ...matricula,
                  cursoNombre:
                    curso.nombre,
                }
              : matricula,
        ),
    );
  };

  const eliminarCurso = (
    cursoId: string,
  ) => {
    setCursos(
      (actuales) =>
        actuales.filter(
          (curso) =>
            curso.id !==
            cursoId,
        ),
    );
  };

  /* =======================================================
     SECCIONES
     ======================================================= */

  const agregarSeccion = (
    seccion: Omit<Seccion, "id">,
  ) => {
    /*
     * Verificar que el docente exista
     * cuando se proporciona docenteId.
     */

    const docenteEncontrado =
      docentes.find(
        (docente) =>
          docente.id ===
          seccion.docenteId,
      );

    const seccionFinal: Seccion = {
      id: generarId("SEC"),
      ...seccion,

      docente:
        docenteEncontrado
          ? nombreCompletoDocente(
              docenteEncontrado,
            )
          : seccion.docente,
    };

    setSecciones(
      (actuales) => [
        ...actuales,
        seccionFinal,
      ],
    );
  };

  const actualizarSeccion = (
    seccion: Seccion,
  ) => {
    /*
     * Buscar el docente seleccionado
     * y mantener sincronizado su nombre.
     */

    const docenteEncontrado =
      docentes.find(
        (docente) =>
          docente.id ===
          seccion.docenteId,
      );

    const seccionActualizada: Seccion = {
      ...seccion,

      docente:
        docenteEncontrado
          ? nombreCompletoDocente(
              docenteEncontrado,
            )
          : seccion.docente,
    };

    setSecciones(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id ===
            seccion.id
              ? seccionActualizada
              : item,
        ),
    );

    /*
     * Actualizar horarios relacionados
     * con la sección.
     */

    setHorarios(
      (actuales) =>
        actuales.map(
          (horario) => {
            if (
              horario.cursoId !==
              seccion.cursoId
            ) {
              return horario;
            }

            if (
              horario.seccion !==
              seccion.codigo
            ) {
              return horario;
            }

            return {
              ...horario,
              docente:
                seccionActualizada.docente,
            };
          },
        ),
    );

    /*
     * Actualizar matrículas relacionadas.
     */

    setMatriculas(
      (actuales) =>
        actuales.map(
          (matricula) =>
            matricula.seccionId ===
            seccion.id
              ? {
                  ...matricula,
                  seccion:
                    seccion.codigo,
                }
              : matricula,
        ),
    );
  };

  const eliminarSeccion = (
    seccionId: string,
  ) => {
    setSecciones(
      (actuales) =>
        actuales.filter(
          (seccion) =>
            seccion.id !==
            seccionId,
        ),
    );
  };

  /* =======================================================
     AULAS
     ======================================================= */

  const agregarAula = (
    aula: Omit<Aula, "id">,
  ) => {
    const nuevaAula: Aula = {
      id: generarId("AUL"),
      ...aula,
    };

    setAulas(
      (actuales) => [
        ...actuales,
        nuevaAula,
      ],
    );
  };

  const actualizarAula = (
    aula: Aula,
  ) => {
    setAulas(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id === aula.id
              ? aula
              : item,
        ),
    );

    /* Actualizar código del aula */

    setHorarios(
      (actuales) =>
        actuales.map(
          (horario) =>
            horario.aulaId ===
            aula.id
              ? {
                  ...horario,
                  aulaNombre:
                    aula.codigo,
                }
              : horario,
        ),
    );
  };

  const eliminarAula = (
    aulaId: string,
  ) => {
    setAulas(
      (actuales) =>
        actuales.filter(
          (aula) =>
            aula.id !==
            aulaId,
        ),
    );
  };

  /* =======================================================
     HORARIOS
     ======================================================= */

  const agregarHorario = (
    horario: Omit<Horario, "id">,
  ) => {
    const nuevoHorario: Horario = {
      id: generarId("HOR"),
      ...horario,
    };

    setHorarios(
      (actuales) => [
        ...actuales,
        nuevoHorario,
      ],
    );
  };

  const actualizarHorario = (
    horario: Horario,
  ) => {
    setHorarios(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id === horario.id
              ? horario
              : item,
        ),
    );
  };

  const eliminarHorario = (
    horarioId: string,
  ) => {
    setHorarios(
      (actuales) =>
        actuales.filter(
          (horario) =>
            horario.id !==
            horarioId,
        ),
    );
  };

  /* =======================================================
     MATRÍCULAS
     ======================================================= */

  const agregarMatricula = (
    matricula: Omit<Matricula, "id">,
  ) => {
    /*
     * Una matrícula única queda definida por:
     *
     * estudiante
     * + curso
     * + sección
     * + periodo
     */

    const duplicada =
      matriculas.some(
        (item) =>
          item.estudianteId ===
            matricula.estudianteId &&
          item.cursoId ===
            matricula.cursoId &&
          item.seccionId ===
            matricula.seccionId &&
          normalizarPeriodo(
            item.periodo,
          ) ===
            normalizarPeriodo(
              matricula.periodo,
            ) &&
          item.estado ===
            "Activa",
      );

    if (duplicada) {
      console.warn(
        "La matrícula ya existe.",
      );

      return;
    }

    const nuevaMatricula: Matricula = {
      id: generarId("MAT"),
      ...matricula,
    };

    setMatriculas(
      (actuales) => [
        ...actuales,
        nuevaMatricula,
      ],
    );
  };

  const actualizarMatricula = (
    matricula: Matricula,
  ) => {
    const duplicada =
      matriculas.some(
        (item) =>
          item.id !==
            matricula.id &&
          item.estudianteId ===
            matricula.estudianteId &&
          item.cursoId ===
            matricula.cursoId &&
          item.seccionId ===
            matricula.seccionId &&
          normalizarPeriodo(
            item.periodo,
          ) ===
            normalizarPeriodo(
              matricula.periodo,
            ) &&
          item.estado ===
            "Activa" &&
          matricula.estado ===
            "Activa",
      );

    if (duplicada) {
      console.warn(
        "No se puede actualizar: la matrícula ya existe.",
      );

      return;
    }

    setMatriculas(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id ===
            matricula.id
              ? matricula
              : item,
        ),
    );
  };

  const eliminarMatricula = (
    matriculaId: string,
  ) => {
    setMatriculas(
      (actuales) =>
        actuales.filter(
          (matricula) =>
            matricula.id !==
            matriculaId,
        ),
    );
  };

  /* =======================================================
     DOCENTES
     ======================================================= */

  const agregarDocente = (
    docente: Omit<Docente, "id">,
  ) => {
    const codigoNormalizado =
      normalizarTexto(
        docente.codigo,
      );

    const dniNormalizado =
      docente.dni.trim();

    const duplicado =
      docentes.some(
        (item) =>
          normalizarTexto(
            item.codigo,
          ) ===
            codigoNormalizado ||
          item.dni.trim() ===
            dniNormalizado,
      );

    if (duplicado) {
      console.warn(
        "Ya existe un docente con el mismo DNI o código.",
      );

      return;
    }

    const nuevoDocente: Docente = {
      id: generarId("DOC"),
      ...docente,
    };

    setDocentes(
      (actuales) => [
        ...actuales,
        nuevoDocente,
      ],
    );
  };

  const actualizarDocente = (
    docente: Docente,
  ) => {
    const codigoNormalizado =
      normalizarTexto(
        docente.codigo,
      );

    const dniNormalizado =
      docente.dni.trim();

    const duplicado =
      docentes.some(
        (item) =>
          item.id !== docente.id &&
          (
            normalizarTexto(
              item.codigo,
            ) ===
              codigoNormalizado ||
            item.dni.trim() ===
              dniNormalizado
          ),
      );

    if (duplicado) {
      console.warn(
        "No se puede actualizar: ya existe otro docente con el mismo DNI o código.",
      );

      return;
    }

    setDocentes(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id ===
            docente.id
              ? docente
              : item,
        ),
    );

    /*
     * Si cambia el nombre del docente,
     * actualizarlo automáticamente
     * en las secciones relacionadas.
     */

    const nombreNuevo =
      nombreCompletoDocente(
        docente,
      );

    setSecciones(
      (actuales) =>
        actuales.map(
          (seccion) =>
            seccion.docenteId ===
            docente.id
              ? {
                  ...seccion,
                  docente:
                    nombreNuevo,
                }
              : seccion,
        ),
    );

    /*
     * También actualizar el nombre
     * en los horarios relacionados.
     */

    setHorarios(
      (actuales) =>
        actuales.map(
          (horario) =>
            horario.docente ===
            nombreCompletoDocente(
              docentes.find(
                (item) =>
                  item.id ===
                  docente.id,
              ) ??
                docente,
            )
              ? {
                  ...horario,
                  docente:
                    nombreNuevo,
                }
              : horario,
        ),
    );
  };

  const eliminarDocente = (
    docenteId: string,
  ) => {
    /*
     * No eliminamos físicamente la relación
     * de las secciones. Primero verificamos
     * si el docente está siendo utilizado.
     */

    const tieneSecciones =
      secciones.some(
        (seccion) =>
          seccion.docenteId ===
          docenteId,
      );

    if (tieneSecciones) {
      console.warn(
        "No se puede eliminar el docente porque tiene secciones asignadas.",
      );

      return;
    }

    setDocentes(
      (actuales) =>
        actuales.filter(
          (docente) =>
            docente.id !==
            docenteId,
        ),
    );
  };

  /* =======================================================
     TERMINALES BIOMÉTRICOS
     ======================================================= */

  const agregarTerminal = (
    terminal: Omit<Terminal, "id">,
  ) => {
    const codigoNormalizado = normalizarTexto(
      terminal.codigo,
    );

    if (
      terminales.some(
        (item) =>
          normalizarTexto(item.codigo) ===
          codigoNormalizado,
      )
    ) {
      console.warn("Ya existe un terminal con ese código.");
      return;
    }

    setTerminales((actuales) => [
      ...actuales,
      {
        id: generarId("TAB"),
        ...terminal,
        codigo: terminal.codigo.trim().toUpperCase(),
      },
    ]);
  };

  const actualizarTerminal = (
    terminal: Terminal,
  ) => {
    const codigoNormalizado = normalizarTexto(
      terminal.codigo,
    );

    if (
      terminales.some(
        (item) =>
          item.id !== terminal.id &&
          normalizarTexto(item.codigo) ===
            codigoNormalizado,
      )
    ) {
      console.warn("Ya existe otro terminal con ese código.");
      return;
    }

    setTerminales((actuales) =>
      actuales.map((item) =>
        item.id === terminal.id
          ? {
              ...terminal,
              codigo: terminal.codigo.trim().toUpperCase(),
            }
          : item,
      ),
    );
  };

  const eliminarTerminal = (
    terminalId: string,
  ) => {
    setTerminales((actuales) =>
      actuales.filter((terminal) => terminal.id !== terminalId),
    );
  };

  /* =======================================================
     OBTENER MATRÍCULAS DEL ESTUDIANTE POR ID
     ======================================================= */

  const obtenerMatriculasEstudiante = (
    estudianteId: string,
  ): Matricula[] => {
    if (!estudianteId.trim()) {
      return [];
    }

    return matriculas.filter(
      (matricula) =>
        matricula.estudianteId ===
          estudianteId &&
        matricula.estado ===
          "Activa",
    );
  };

  /* =======================================================
     OBTENER MATRÍCULAS POR NOMBRE
     ======================================================= */

  const obtenerMatriculasEstudiantePorNombre = (
    estudianteNombre: string,
  ): Matricula[] => {
    const nombreBuscado =
      normalizarTexto(
        estudianteNombre,
      );

    if (!nombreBuscado) {
      return [];
    }

    return matriculas.filter(
      (matricula) =>
        matricula.estado ===
          "Activa" &&
        normalizarTexto(
          matricula.estudianteNombre,
        ) === nombreBuscado,
    );
  };

  /* =======================================================
     OBTENER HORARIO DE UNA MATRÍCULA
     ======================================================= */

  const obtenerHorarioMatricula = (
    matricula: Matricula,
  ): Horario | undefined => {
    return horarios.find(
      (horario) =>
        horario.estado ===
          "Activo" &&
        horario.cursoId ===
          matricula.cursoId &&
        horario.seccion ===
          matricula.seccion &&
        normalizarPeriodo(
          horario.periodo,
        ) ===
          normalizarPeriodo(
            matricula.periodo,
          ),
    );
  };

  /* =======================================================
     OBTENER TODOS LOS HORARIOS POR ID
     ======================================================= */

  const obtenerHorariosEstudiante = (
    estudianteId: string,
  ): Horario[] => {
    const matriculasEstudiante =
      obtenerMatriculasEstudiante(
        estudianteId,
      );

    if (
      matriculasEstudiante.length ===
      0
    ) {
      return [];
    }

    return horarios.filter(
      (horario) => {
        if (
          horario.estado !==
          "Activo"
        ) {
          return false;
        }

        return matriculasEstudiante.some(
          (matricula) =>
            matricula.cursoId ===
              horario.cursoId &&
            matricula.seccion ===
              horario.seccion &&
            normalizarPeriodo(
              matricula.periodo,
            ) ===
              normalizarPeriodo(
                horario.periodo,
              ),
        );
      },
    );
  };

  /* =======================================================
     OBTENER TODOS LOS HORARIOS POR NOMBRE
     ======================================================= */

  const obtenerHorariosEstudiantePorNombre = (
    estudianteNombre: string,
  ): Horario[] => {
    const matriculasEstudiante =
      obtenerMatriculasEstudiantePorNombre(
        estudianteNombre,
      );

    if (
      matriculasEstudiante.length ===
      0
    ) {
      return [];
    }

    return horarios.filter(
      (horario) => {
        if (
          horario.estado !==
          "Activo"
        ) {
          return false;
        }

        return matriculasEstudiante.some(
          (matricula) =>
            matricula.cursoId ===
              horario.cursoId &&
            matricula.seccion ===
              horario.seccion &&
            normalizarPeriodo(
              matricula.periodo,
            ) ===
              normalizarPeriodo(
                horario.periodo,
              ),
        );
      },
    );
  };

  /* =======================================================
     RESTAURAR DATOS INICIALES
     ======================================================= */

  const restaurarDatosIniciales =
    () => {
      setCursos(
        cursosIniciales,
      );

      setSecciones(
        seccionesIniciales,
      );

      setAulas(
        aulasIniciales,
      );

      setHorarios(
        horariosIniciales,
      );

      setMatriculas(
        matriculasIniciales,
      );

      setDocentes(
        docentesIniciales,
      );
    };

  /* =======================================================
     VALOR DEL CONTEXTO
     ======================================================= */

  const value =
    useMemo(
      () => ({
        /* Datos */

        cursos,
        secciones,
        aulas,
        horarios,
        matriculas,
        docentes,
        terminales,

        /* Cursos */

        agregarCurso,
        actualizarCurso,
        eliminarCurso,

        /* Secciones */

        agregarSeccion,
        actualizarSeccion,
        eliminarSeccion,

        /* Aulas */

        agregarAula,
        actualizarAula,
        eliminarAula,

        /* Horarios */

        agregarHorario,
        actualizarHorario,
        eliminarHorario,

        /* Matrículas */

        agregarMatricula,
        actualizarMatricula,
        eliminarMatricula,

        /* Docentes */

        agregarDocente,
        actualizarDocente,
        eliminarDocente,

        /* Terminales */

        agregarTerminal,
        actualizarTerminal,
        eliminarTerminal,

        /* Consultas */

        obtenerMatriculasEstudiante,
        obtenerMatriculasEstudiantePorNombre,

        obtenerHorarioMatricula,

        obtenerHorariosEstudiante,
        obtenerHorariosEstudiantePorNombre,

        /* Restaurar */

        restaurarDatosIniciales,
      }),
      [
        cursos,
        secciones,
        aulas,
        horarios,
        matriculas,
        docentes,
        terminales,
      ],
    );

  /* =======================================================
     PROVIDER
     ======================================================= */

  return (
    <AcademicContext.Provider
      value={value}
    >
      {children}
    </AcademicContext.Provider>
  );
}

/* =========================================================
   HOOK
   ========================================================= */

export function useAcademic() {
  const context =
    useContext(
      AcademicContext,
    );

  if (!context) {
    throw new Error(
      "useAcademic debe utilizarse dentro de AcademicProvider.",
    );
  }

  return context;
}