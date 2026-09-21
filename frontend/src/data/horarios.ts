export interface Horario {
  id: string;
  cursoId: string;
  cursoNombre: string;
  seccion: string;
  docente: string;
  aulaId: string;
  aulaNombre: string;
  dia:
    | "Lunes"
    | "Martes"
    | "Miércoles"
    | "Jueves"
    | "Viernes"
    | "Sábado";
  horaInicio: string;
  horaFin: string;
  periodo: string;
  estado: "Activo" | "Inactivo";
}

export const horariosIniciales: Horario[] = [
  {
    id: "HOR-001",
    cursoId: "CUR-001",
    cursoNombre: "Programación Web",
    seccion: "A",
    docente: "Ing. Carlos Ramírez",
    aulaId: "AUL-002",
    aulaNombre: "LAB-302",
    dia: "Lunes",
    horaInicio: "08:00",
    horaFin: "10:00",
    periodo: "2026-I",
    estado: "Activo",
  },
  {
    id: "HOR-002",
    cursoId: "CUR-002",
    cursoNombre: "Base de Datos",
    seccion: "B",
    docente: "Mg. Ana Torres",
    aulaId: "AUL-001",
    aulaNombre: "LAB-301",
    dia: "Miércoles",
    horaInicio: "11:30",
    horaFin: "12:00",
    periodo: "2026-I",
    estado: "Activo",
  },
  {
    id: "HOR-003",
    cursoId: "CUR-003",
    cursoNombre: "Inteligencia Artificial",
    seccion: "A",
    docente: "Dr. Luis Mendoza",
    aulaId: "AUL-002",
    aulaNombre: "LAB-302",
    dia: "Martes",
    horaInicio: "08:00",
    horaFin: "10:00",
    periodo: "2026-I",
    estado: "Activo",
  },
];