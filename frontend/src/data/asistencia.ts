export type EstadoAsistencia =
  | "Asistió"
  | "Temprano"
  | "Puntual"
  | "Tardanza"
  | "Ausente"
  | "Falta";

export type EstadoSalida =
  | "Pendiente"
  | "Registrada";

export type TipoPersona =
  | "student"
  | "teacher";

export interface RegistroAsistencia {
  id: string;

  personId: string;

  nombre: string;

  personType: TipoPersona;

  fecha: string;

  horaRegistro: string;

  horarioId: string;

  horaSalida?: string;

  estadoEntrada?: EstadoAsistencia;

  estadoSalida?: EstadoSalida;

  cursoId: string;

  cursoNombre: string;

  seccion: string;

  docente: string;

  aulaId: string;

  aulaNombre: string;

  horaInicio: string;

  horaFin: string;

  periodo: string;

  estado: EstadoAsistencia;

  similarityPercent: number;

  metodo: "facial" | "manual";
}

export const asistenciasIniciales: RegistroAsistencia[] =
  [];