export interface Aula {
  id: string;
  codigo: string;
  nombre: string;
  edificio: string;
  piso: number;
  capacidad: number;
  camara: string;
  estado: "Activo" | "Inactivo";
}

export const aulasIniciales: Aula[] = [
  {
    id: "AUL-001",
    codigo: "LAB-301",
    nombre: "Laboratorio de Cómputo 301",
    edificio: "Edificio Principal",
    piso: 3,
    capacidad: 30,
    camara: "CAM-01",
    estado: "Activo",
  },
  {
    id: "AUL-002",
    codigo: "LAB-302",
    nombre: "Laboratorio de Cómputo 302",
    edificio: "Edificio Principal",
    piso: 3,
    capacidad: 35,
    camara: "CAM-02",
    estado: "Activo",
  },
  {
    id: "AUL-003",
    codigo: "AULA-201",
    nombre: "Aula 201",
    edificio: "Edificio Principal",
    piso: 2,
    capacidad: 40,
    camara: "CAM-03",
    estado: "Activo",
  },
]; 