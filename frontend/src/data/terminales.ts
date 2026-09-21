export interface Terminal {
  id: string;
  codigo: string;
  aulaId: string;
  horarioIds: string[];
  ubicacion: string;
  estado: "Activo" | "Inactivo" | "Mantenimiento";
  ultimaConexion: string;
}

export const terminalesIniciales: Terminal[] = [];
