export interface Matricula {
  id: string;

  estudianteId: string;
  estudianteNombre: string;

  cursoId: string;
  cursoNombre: string;

  seccionId: string;
  seccion: string;

  periodo: string;

  fechaMatricula: string;

  estado: "Activa" | "Anulada";
}

export const matriculasIniciales: Matricula[] = [
  {
    id: "MAT-001",

    estudianteId:
      "8324fc28-55db-49f0-b69c-21d39a09add3",

    estudianteNombre:
      "Juan Perez",

    cursoId: "CUR-003",

    cursoNombre:
      "Inteligencia Artificial",

    seccionId: "SEC-003",

    seccion: "A",

    periodo: "2026-I",

    fechaMatricula: "2026-09-01",

    estado: "Activa",
  },
];