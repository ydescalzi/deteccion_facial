export interface Docente {
  id: string;
  codigo: string;
  dni: string;
  nombres: string;
  apellidos: string;
  correo: string;
  facultad: string;
  escuela: string;
  especialidad: string;
  estado: "Activo" | "Inactivo";
}

export const docentesIniciales: Docente[] = [
  {
    id: "DOC-001",
    codigo: "DOC-2026-001",
    dni: "45872136",
    nombres: "Carlos",
    apellidos: "Ramírez",
    correo: "carlos.ramirez@usmp.pe",
    facultad: "Ingeniería y Arquitectura",
    escuela: "Ingeniería de Sistemas",
    especialidad: "Desarrollo de Software",
    estado: "Activo",
  },
  {
    id: "DOC-002",
    codigo: "DOC-2026-002",
    dni: "41785629",
    nombres: "Ana",
    apellidos: "Torres",
    correo: "ana.torres@usmp.pe",
    facultad: "Ingeniería y Arquitectura",
    escuela: "Ingeniería de Sistemas",
    especialidad: "Base de Datos",
    estado: "Activo",
  },
  {
    id: "DOC-003",
    codigo: "DOC-2026-003",
    dni: "43691258",
    nombres: "Luis",
    apellidos: "Mendoza",
    correo: "luis.mendoza@usmp.pe",
    facultad: "Ingeniería y Arquitectura",
    escuela: "Ingeniería de Sistemas",
    especialidad: "Inteligencia Artificial",
    estado: "Activo",
  },
];