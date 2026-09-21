export interface Seccion {
  id: string;
  codigo: string;

  cursoId: string;
  cursoNombre: string;

  docenteId: string;
  docente: string;

  periodo: string;

  turno:
    | "Mañana"
    | "Tarde"
    | "Noche";

  estado:
    | "Activo"
    | "Inactivo";
}

export const seccionesIniciales: Seccion[] = [
  {
    id: "SEC-001",
    codigo: "A",

    cursoId: "CUR-001",
    cursoNombre: "Programación Web",

    docenteId: "DOC-001",
    docente: "Carlos Ramírez",

    periodo: "2026-I",

    turno: "Mañana",

    estado: "Activo",
  },

  {
    id: "SEC-002",
    codigo: "B",

    cursoId: "CUR-002",
    cursoNombre: "Base de Datos",

    docenteId: "DOC-002",
    docente: "Ana Torres",

    periodo: "2026-I",

    turno: "Mañana",

    estado: "Activo",
  },

  {
    id: "SEC-003",
    codigo: "A",

    cursoId: "CUR-003",
    cursoNombre: "Inteligencia Artificial",

    docenteId: "DOC-003",
    docente: "Luis Mendoza",

    periodo: "2026-I",

    turno: "Tarde",

    estado: "Activo",
  },
];