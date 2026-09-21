import type { Horario } from "../data/horarios";
import type { RegistroAsistencia } from "../data/asistencia";
import { minutosDesdeMedianoche } from "./asistenciaDocente";

export const MINUTOS_INGRESO_ESTUDIANTE = 10;
export const MINUTOS_TARDANZA_ESTUDIANTE = 20;

export type AccionAsistenciaEstudiante =
  | "registrar-asistencia"
  | "asistencia-registrada"
  | "ventana-cerrada";

export function obtenerVentanaAsistenciaEstudiante(horario: Horario) {
  const inicio = minutosDesdeMedianoche(horario.horaInicio);

  return {
    desde: Math.max(0, inicio - MINUTOS_INGRESO_ESTUDIANTE),
    hasta: inicio + MINUTOS_TARDANZA_ESTUDIANTE,
  };
}

export function determinarEstadoEstudiante(
  horaRegistro: string,
  horaInicio: string,
): "Asistió" | "Tardanza" {
  return minutosDesdeMedianoche(horaRegistro) <=
    minutosDesdeMedianoche(horaInicio)
    ? "Asistió"
    : "Tardanza";
}

export function determinarAccionAsistenciaEstudiante(
  horario: Horario,
  horaActual: string,
  asistencia?: RegistroAsistencia,
): AccionAsistenciaEstudiante {
  if (asistencia?.estado === "Falta") return "ventana-cerrada";
  if (asistencia) return "asistencia-registrada";

  const ahora = minutosDesdeMedianoche(horaActual);
  const ventana = obtenerVentanaAsistenciaEstudiante(horario);

  return ahora >= ventana.desde && ahora <= ventana.hasta
    ? "registrar-asistencia"
    : "ventana-cerrada";
}

export function ventanaEstudianteFinalizada(
  horario: Horario,
  horaActual: string,
): boolean {
  return minutosDesdeMedianoche(horaActual) >
    obtenerVentanaAsistenciaEstudiante(horario).hasta;
}