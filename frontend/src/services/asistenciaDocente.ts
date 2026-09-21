import type { Horario } from "../data/horarios";
import type { RegistroAsistencia } from "../data/asistencia";

export const MINUTOS_INGRESO_DOCENTE = 5;
export const MINUTOS_VENTANA_SALIDA = 20;

export type AccionAsistenciaDocente =
  | "registrar-entrada"
  | "entrada-registrada"
  | "salida-no-disponible"
  | "registrar-salida"
  | "salida-registrada"
  | "ventana-cerrada";

export function minutosDesdeMedianoche(hora: string): number {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

export function obtenerVentanaEntrada(horario: Horario) {
  const inicio = minutosDesdeMedianoche(horario.horaInicio);
  return {
    desde: Math.max(0, inicio - MINUTOS_INGRESO_DOCENTE),
    hasta: minutosDesdeMedianoche(horario.horaFin),
  };
}

export function obtenerVentanaSalida(horario: Horario) {
  const desde = minutosDesdeMedianoche(horario.horaFin);
  return { desde, hasta: desde + MINUTOS_VENTANA_SALIDA };
}

export function determinarEstadoEntrada(
  horaRegistro: string,
  horaInicio: string,
): "Temprano" | "Puntual" | "Tardanza" {
  const registro = minutosDesdeMedianoche(horaRegistro);
  const inicio = minutosDesdeMedianoche(horaInicio);

  if (registro < inicio) return "Temprano";
  if (registro === inicio) return "Puntual";
  return "Tardanza";
}

export function determinarAccionAsistenciaDocente(
  horario: Horario,
  horaActual: string,
  asistencia?: RegistroAsistencia,
): AccionAsistenciaDocente {
  const ahora = minutosDesdeMedianoche(horaActual);
  const entrada = obtenerVentanaEntrada(horario);
  const salida = obtenerVentanaSalida(horario);

  if (asistencia?.horaSalida || asistencia?.estadoSalida === "Registrada") {
    return "salida-registrada";
  }

  if (asistencia) {
    if (ahora >= salida.desde && ahora <= salida.hasta) {
      return "registrar-salida";
    }
    if (ahora > salida.hasta) return "ventana-cerrada";
    return "entrada-registrada";
  }

  if (ahora >= entrada.desde && ahora < salida.desde) {
    return "registrar-entrada";
  }

  return "ventana-cerrada";
}