import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  asistenciasIniciales,
  type RegistroAsistencia,
} from "../data/asistencia";

/* =========================================================
   CONTEXTO
   ========================================================= */

interface AttendanceContextValue {
  asistencias: RegistroAsistencia[];

  registrarAsistencia: (
    registro: Omit<
      RegistroAsistencia,
      "id"
    >,
  ) => void;

  actualizarAsistencia: (
    registro: RegistroAsistencia,
  ) => void;

  eliminarAsistencia: (
    id: string,
  ) => void;

  buscarAsistenciaPorPersona: (
    personId: string,
    fecha?: string,
  ) => RegistroAsistencia[];

  yaRegistroAsistencia: (
    personId: string,
    cursoId: string,
    fecha: string,
  ) => boolean;

  buscarAsistenciaPorClase: (
    personId: string,
    fecha: string,
    horarioId: string,
  ) => RegistroAsistencia | undefined;

  registrarSalida: (
    asistenciaId: string,
    horaSalida: string,
  ) => void;

  registrarFalta: (
    registro: Omit<RegistroAsistencia, "id">,
  ) => void;

  asistenciasDeHoy: RegistroAsistencia[];

  presentesDeHoy: RegistroAsistencia[];

  tardanzasDeHoy: RegistroAsistencia[];
}

const AttendanceContext =
  createContext<
    AttendanceContextValue | undefined
  >(undefined);

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  "usmp_asistencias";

/* =========================================================
   PROVIDER
   ========================================================= */

interface AttendanceProviderProps {
  children: ReactNode;
}

export function AttendanceProvider({
  children,
}: AttendanceProviderProps) {
  const [
    asistencias,
    setAsistencias,
  ] =
    useState<RegistroAsistencia[]>(
      () => {
        try {
          const guardadas =
            localStorage.getItem(
              STORAGE_KEY,
            );

          if (!guardadas) {
            return asistenciasIniciales;
          }

          const datos =
            JSON.parse(
              guardadas,
            );

          if (
            !Array.isArray(
              datos,
            )
          ) {
            return asistenciasIniciales;
          }

          return datos;
        } catch (error) {
          console.error(
            "Error leyendo asistencias:",
            error,
          );

          return asistenciasIniciales;
        }
      },
    );

  /* =======================================================
     GUARDAR EN LOCAL STORAGE
     ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          asistencias,
        ),
      );
    } catch (error) {
      console.error(
        "Error guardando asistencias:",
        error,
      );
    }
  }, [asistencias]);

  /* =======================================================
     FECHA ACTUAL
     ======================================================= */

  const obtenerFechaActual =
    () => {
      const ahora =
        new Date();

      const year =
        ahora.getFullYear();

      const month =
        String(
          ahora.getMonth() + 1,
        ).padStart(2, "0");

      const day =
        String(
          ahora.getDate(),
        ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

  /* =======================================================
     REGISTRAR
     ======================================================= */

  const registrarAsistencia = (
    registro: Omit<
      RegistroAsistencia,
      "id"
    >,
  ) => {
    setAsistencias(
      (actuales) => {
        const existe = actuales.some(
          (item) =>
            item.personId === registro.personId &&
            item.fecha === registro.fecha &&
            item.horarioId === registro.horarioId,
        );

        if (existe) return actuales;

        const nuevoRegistro: RegistroAsistencia = {
          id: `ASI-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`,
          ...registro,
        };

        return [nuevoRegistro, ...actuales];
      },
    );
  };

  /* =======================================================
     ACTUALIZAR
     ======================================================= */

  const actualizarAsistencia = (
    registro: RegistroAsistencia,
  ) => {
    setAsistencias(
      (actuales) =>
        actuales.map(
          (item) =>
            item.id ===
            registro.id
              ? registro
              : item,
        ),
    );
  };

  /* =======================================================
     ELIMINAR
     ======================================================= */

  const eliminarAsistencia = (
    id: string,
  ) => {
    setAsistencias(
      (actuales) =>
        actuales.filter(
          (item) =>
            item.id !== id,
        ),
    );
  };

  /* =======================================================
     BUSCAR POR PERSONA
     ======================================================= */

  const buscarAsistenciaPorPersona =
    (
      personId: string,
      fecha?: string,
    ) => {
      return asistencias.filter(
        (item) => {
          const coincidePersona =
            item.personId ===
            personId;

          if (!fecha) {
            return coincidePersona;
          }

          return (
            coincidePersona &&
            item.fecha ===
              fecha
          );
        },
      );
    };

  /* =======================================================
     EVITAR DUPLICADOS
     ======================================================= */

  const yaRegistroAsistencia =
    (
      personId: string,
      cursoId: string,
      fecha: string,
    ) => {
      return asistencias.some(
        (item) =>
          item.personId ===
            personId &&
          item.cursoId ===
            cursoId &&
          item.fecha ===
            fecha,
      );
    };

  const buscarAsistenciaPorClase = (
    personId: string,
    fecha: string,
    horarioId: string,
  ) => {
    return asistencias.find(
      (item) =>
        item.personId === personId &&
        item.fecha === fecha &&
        item.horarioId === horarioId,
    );
  };

  const registrarSalida = (
    asistenciaId: string,
    horaSalida: string,
  ) => {
    setAsistencias((actuales) =>
      actuales.map((item) =>
        item.id === asistenciaId
          ? {
              ...item,
              horaSalida,
              estadoSalida: "Registrada",
            }
          : item,
      ),
    );
  };

  const registrarFalta = (
    registro: Omit<RegistroAsistencia, "id">,
  ) => {
    setAsistencias((actuales) => {
      const existe = actuales.some(
        (item) =>
          item.personId === registro.personId &&
          item.fecha === registro.fecha &&
          item.horarioId === registro.horarioId,
      );

      if (existe) return actuales;

      return [
        {
          id: `ASI-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          ...registro,
        },
        ...actuales,
      ];
    });
  };

  /* =======================================================
     ASISTENCIAS DE HOY
     ======================================================= */

  const asistenciasDeHoy =
    useMemo(() => {
      const hoy =
        obtenerFechaActual();

      return asistencias.filter(
        (item) =>
          item.fecha === hoy,
      );
    }, [asistencias]);

  /* =======================================================
     PRESENTES DE HOY
     ======================================================= */

  const presentesDeHoy =
    useMemo(() => {
      return asistenciasDeHoy.filter(
        (item) =>
          item.estado === "Asistió" ||
          item.estado === "Temprano" ||
          item.estado === "Puntual",
      );
    }, [asistenciasDeHoy]);

  /* =======================================================
     TARDANZAS DE HOY
     ======================================================= */

  const tardanzasDeHoy =
    useMemo(() => {
      return asistenciasDeHoy.filter(
        (item) =>
          item.estado ===
          "Tardanza",
      );
    }, [asistenciasDeHoy]);

  /* =======================================================
     VALOR DEL CONTEXTO
     ======================================================= */

  const value =
    useMemo(
      () => ({
        asistencias,

        registrarAsistencia,

        actualizarAsistencia,

        eliminarAsistencia,

        buscarAsistenciaPorPersona,

        yaRegistroAsistencia,

        buscarAsistenciaPorClase,

        registrarSalida,

        registrarFalta,

        asistenciasDeHoy,

        presentesDeHoy,

        tardanzasDeHoy,
      }),
      [
        asistencias,
        asistenciasDeHoy,
        presentesDeHoy,
        tardanzasDeHoy,
      ],
    );

  return (
    <AttendanceContext.Provider
      value={value}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

/* =========================================================
   HOOK
   ========================================================= */

export function useAttendance() {
  const context =
    useContext(
      AttendanceContext,
    );

  if (!context) {
    throw new Error(
      "useAttendance debe utilizarse dentro de AttendanceProvider.",
    );
  }

  return context;
}