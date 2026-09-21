import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  School,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useMemo } from "react";

import { useAcademic } from "../../context/AcademicContext";
import type { Docente } from "../../data/docentes";
import type { Horario } from "../../data/horarios";

interface PerfilDocenteProps {
  docente: Docente;
  onClose: () => void;
}

const ORDEN_DIAS: Array<Horario["dia"]> = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const obtenerIniciales = (
  nombres: string,
  apellidos: string,
): string => {
  const primerNombre = nombres.trim().split(/\s+/)[0] ?? "";
  const primerApellido = apellidos.trim().split(/\s+/)[0] ?? "";

  const iniciales = `${primerNombre.charAt(0) ?? ""}${primerApellido.charAt(0) ?? ""}`;

  return iniciales.toUpperCase();
};

export default function PerfilDocente({
  docente,
  onClose,
}: PerfilDocenteProps) {
  const { secciones, horarios } = useAcademic();

  const seccionesDocente = useMemo(() => {
    const nombreDocente = `${docente.nombres} ${docente.apellidos}`.trim().toLowerCase();

    return secciones.filter((seccion) => {
      if (seccion.estado !== "Activo") {
        return false;
      }

      const coincidePorId = seccion.docenteId === docente.id;
      const coincidePorNombre =
        seccion.docente.trim().toLowerCase() === nombreDocente ||
        seccion.docente.trim().toLowerCase().includes(docente.nombres.toLowerCase()) ||
        seccion.docente.trim().toLowerCase().includes(docente.apellidos.toLowerCase());

      return coincidePorId || coincidePorNombre;
    });
  }, [secciones, docente]);

  const cursosAsignados = useMemo(() => {
    const cursos = new Set(
      seccionesDocente.map((seccion) => seccion.cursoId),
    );

    return cursos.size;
  }, [seccionesDocente]);

  const clasesProgramadas = useMemo(() => {
    const nombreDocente = `${docente.nombres} ${docente.apellidos}`.trim().toLowerCase();

    const horariosActivos = horarios.filter((horario) => {
      if (horario.estado !== "Activo") {
        return false;
      }

      const coincidePorSeccion = seccionesDocente.some(
        (seccion) =>
          seccion.cursoNombre === horario.cursoNombre &&
          seccion.codigo === horario.seccion &&
          seccion.periodo === horario.periodo,
      );

      const coincidePorNombre =
        horario.docente.toLowerCase().includes(docente.nombres.toLowerCase()) ||
        horario.docente.toLowerCase().includes(docente.apellidos.toLowerCase()) ||
        horario.docente.toLowerCase().includes(nombreDocente);

      return coincidePorSeccion || coincidePorNombre;
    });

    return horariosActivos.length;
  }, [horarios, seccionesDocente, docente]);

  const horariosDocente = useMemo(() => {
    const nombreDocente = `${docente.nombres} ${docente.apellidos}`.trim().toLowerCase();

    const filtrados = horarios.filter((horario) => {
      if (horario.estado !== "Activo") {
        return false;
      }

      const coincidePorSeccion = seccionesDocente.some(
        (seccion) =>
          seccion.cursoNombre === horario.cursoNombre &&
          seccion.codigo === horario.seccion &&
          seccion.periodo === horario.periodo,
      );

      const coincidePorNombre =
        horario.docente.toLowerCase().includes(docente.nombres.toLowerCase()) ||
        horario.docente.toLowerCase().includes(docente.apellidos.toLowerCase()) ||
        horario.docente.toLowerCase().includes(nombreDocente);

      return coincidePorSeccion || coincidePorNombre;
    });

    return [...filtrados].sort((a, b) => {
      const indiceA = ORDEN_DIAS.indexOf(a.dia);
      const indiceB = ORDEN_DIAS.indexOf(b.dia);

      if (indiceA !== indiceB) {
        return indiceA - indiceB;
      }

      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }, [horarios, seccionesDocente, docente]);

  const iniciales = obtenerIniciales(docente.nombres, docente.apellidos);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.64)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          maxHeight: "94vh",
          overflowY: "auto",
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.22)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "22px 24px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            background: "linear-gradient(135deg, rgba(148,27,52,0.04), rgba(255,255,255,1))",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, rgba(148,27,52,0.15), rgba(148,27,52,0.06))",
                color: "#941b34",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "18px",
                border: "1px solid rgba(148, 27, 52, 0.12)",
              }}
            >
              {iniciales || "D"}
            </div>

            <div>
              <div
                style={{
                  color: "#941b34",
                  fontSize: "10px",
                  letterSpacing: "0.10em",
                  fontWeight: 800,
                  marginBottom: "6px",
                }}
              >
                PERFIL DEL DOCENTE
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#475569",
                  lineHeight: 1.4,
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {docente.nombres} {docente.apellidos}
                </div>
                <div
                  style={{
                    marginTop: "5px",
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#334155",
                    }}
                  >
                    <BadgeCheck size={14} color="#941b34" />
                    {docente.codigo}
                  </span>
                  <span style={{ color: "#64748b" }}>·</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#334155",
                    }}
                  >
                    <ShieldCheck size={14} color="#941b34" />
                    DNI {docente.dni}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: "7px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#475569",
                    }}
                  >
                    <School size={14} color="#941b34" />
                    {docente.escuela}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background:
                        docente.estado === "Activo"
                          ? "rgba(34, 197, 94, 0.10)"
                          : "rgba(239, 68, 68, 0.10)",
                      color:
                        docente.estado === "Activo"
                          ? "#15803d"
                          : "#b91c1c",
                      padding: "4px 9px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border:
                        docente.estado === "Activo"
                          ? "1px solid rgba(34, 197, 94, 0.12)"
                          : "1px solid rgba(239, 68, 68, 0.12)",
                    }}
                  >
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        display: "inline-block",
                        background:
                          docente.estado === "Activo"
                            ? "#22c55e"
                            : "#ef4444",
                      }}
                    />
                    {docente.estado}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar perfil"
            style={{
              width: "38px",
              height: "38px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              background: "#fff",
              borderRadius: "10px",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "22px 24px 26px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "14px",
              marginBottom: "22px",
            }}
          >
            {[
              {
                titulo: "Cursos asignados",
                valor: cursosAsignados,
                icono: BriefcaseBusiness,
                color: "rgba(148, 27, 52, 0.10)",
                text: "#941b34",
              },
              {
                titulo: "Secciones activas",
                valor: seccionesDocente.length,
                icono: Users,
                color: "rgba(59, 130, 246, 0.10)",
                text: "#2563eb",
              },
              {
                titulo: "Clases programadas",
                valor: clasesProgramadas,
                icono: CalendarDays,
                color: "rgba(16, 185, 129, 0.10)",
                text: "#059669",
              },
              {
                titulo: "Estado",
                valor: docente.estado,
                icono: CheckCircle2,
                color:
                  docente.estado === "Activo"
                    ? "rgba(34, 197, 94, 0.10)"
                    : "rgba(239, 68, 68, 0.10)",
                text:
                  docente.estado === "Activo" ? "#15803d" : "#dc2626",
              },
            ].map(({ titulo, valor, icono: Icon, color, text }) => (
              <div
                key={titulo}
                style={{
                  background: "#fff",
                  border: "1px solid rgba(148, 163, 184, 0.15)",
                  borderRadius: "14px",
                  padding: "16px",
                  boxShadow: "0 8px 22px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
                      background: color,
                      color: text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} />
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  {titulo}
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.2,
                  }}
                >
                  {valor}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "20px",
            }}
          >
            <section
              style={{
                background: "#fff",
                border: "1px solid rgba(148, 163, 184, 0.15)",
                borderRadius: "16px",
                boxShadow: "0 10px 26px rgba(15, 23, 42, 0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "18px 18px 14px",
                  borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
                  color: "#0f172a",
                  fontWeight: 700,
                }}
              >
                <UserRound size={17} color="#941b34" />
                Información del docente
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "12px",
                  padding: "18px",
                }}
              >
                {[
                  {
                    label: "Código docente",
                    value: docente.codigo,
                    icon: BadgeCheck,
                  },
                  {
                    label: "DNI",
                    value: docente.dni,
                    icon: ShieldCheck,
                  },
                  {
                    label: "Nombres",
                    value: docente.nombres,
                    icon: UserRound,
                  },
                  {
                    label: "Apellidos",
                    value: docente.apellidos,
                    icon: Users,
                  },
                  {
                    label: "Correo institucional",
                    value: docente.correo,
                    icon: Mail,
                  },
                  {
                    label: "Facultad",
                    value: docente.facultad,
                    icon: Building2,
                  },
                  {
                    label: "Escuela profesional",
                    value: docente.escuela,
                    icon: School,
                  },
                  {
                    label: "Especialidad",
                    value: docente.especialidad,
                    icon: GraduationCap,
                  },
                  {
                    label: "Estado",
                    value: docente.estado,
                    icon: CheckCircle2,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    style={{
                      background: "linear-gradient(180deg, rgba(148,163,184,0.04), rgba(255,255,255,1))",
                      border: "1px solid rgba(148, 163, 184, 0.12)",
                      borderRadius: "12px",
                      padding: "12px",
                      minHeight: "78px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "11px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#64748b",
                        marginBottom: "8px",
                      }}
                    >
                      <Icon size={13} color="#941b34" />
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0f172a",
                        wordBreak: "break-word",
                        lineHeight: 1.45,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                background: "#fff",
                border: "1px solid rgba(148, 163, 184, 0.15)",
                borderRadius: "16px",
                boxShadow: "0 10px 26px rgba(15, 23, 42, 0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "18px 18px 14px",
                  borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
                  color: "#0f172a",
                  fontWeight: 700,
                }}
              >
                <GraduationCap size={17} color="#941b34" />
                Cursos y secciones asignadas
              </div>

              <div style={{ padding: "18px" }}>
                {seccionesDocente.length === 0 ? (
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      padding: "12px 0",
                    }}
                  >
                    No hay secciones activas asignadas a este docente.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {seccionesDocente.map((seccion) => (
                      <div
                        key={seccion.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          padding: "12px 14px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, rgba(148,27,52,0.04), rgba(148,163,184,0.02))",
                          border: "1px solid rgba(148, 163, 184, 0.12)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "10px",
                              background: "rgba(148, 27, 52, 0.08)",
                              color: "#941b34",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <GraduationCap size={15} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{seccion.cursoNombre}</div>
                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                              Sección {seccion.codigo} · {seccion.periodo}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "rgba(148, 27, 52, 0.08)",
                            color: "#941b34",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "6px 9px",
                            borderRadius: "999px",
                          }}
                        >
                          {seccion.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <section
            style={{
              background: "#fff",
              border: "1px solid rgba(148, 163, 184, 0.15)",
              borderRadius: "16px",
              boxShadow: "0 10px 26px rgba(15, 23, 42, 0.04)",
              overflow: "hidden",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "18px 18px 14px",
                borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
                color: "#0f172a",
                fontWeight: 700,
              }}
            >
              <Clock3 size={17} color="#941b34" />
              Horario del docente
            </div>

            <div style={{ padding: "18px" }}>
              {horariosDocente.length === 0 ? (
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                    padding: "12px 0",
                  }}
                >
                  No hay horarios activos para este docente.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "720px",
                    }}
                  >
                    <thead>
                      <tr>
                        {[
                          "Día",
                          "Horario",
                          "Curso",
                          "Sección",
                          "Aula",
                          "Periodo",
                        ].map((header) => (
                          <th
                            key={header}
                            style={{
                              textAlign: "left",
                              padding: "12px 10px",
                              fontSize: "12px",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              color: "#64748b",
                              borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {horariosDocente.map((horario) => (
                        <tr
                          key={horario.id}
                          style={{
                            background:
                              horario.dia === "Lunes"
                                ? "rgba(148, 27, 52, 0.02)"
                                : "transparent",
                          }}
                        >
                          <td style={{ padding: "12px 10px", color: "#0f172a", fontWeight: 600 }}>
                            {horario.dia}
                          </td>
                          <td style={{ padding: "12px 10px", color: "#334155" }}>
                            {horario.horaInicio} - {horario.horaFin}
                          </td>
                          <td style={{ padding: "12px 10px", color: "#0f172a", fontWeight: 600 }}>
                            {horario.cursoNombre}
                          </td>
                          <td style={{ padding: "12px 10px", color: "#334155" }}>
                            {horario.seccion}
                          </td>
                          <td style={{ padding: "12px 10px", color: "#334155" }}>
                            {horario.aulaNombre}
                          </td>
                          <td style={{ padding: "12px 10px", color: "#334155" }}>
                            {horario.periodo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingTop: "22px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "#941b34",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <X size={16} />
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
