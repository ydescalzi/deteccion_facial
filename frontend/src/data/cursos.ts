export interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  estado: "Activo" | "Inactivo";
}

export const cursosIniciales: Curso[] = [
  {
    id: "CUR-001",
    codigo: "PROG-101",
    nombre: "Programación Web",
    creditos: 4,
    estado: "Activo",
  },
  {
    id: "CUR-002",
    codigo: "BD-201",
    nombre: "Base de Datos",
    creditos: 4,
    estado: "Activo",
  },
  {
    id: "CUR-003",
    codigo: "IA-301",
    nombre: "Inteligencia Artificial",
    creditos: 4,
    estado: "Activo",
  },
  {
    id: "CUR-004",
    codigo: "RED-202",
    nombre: "Redes de Computadoras",
    creditos: 3,
    estado: "Activo",
  },
];