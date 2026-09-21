import { Settings } from "lucide-react";

export default function Configuracion() {
  return (
    <div className="page">
      <div className="page-title">
        <h2>Configuración</h2>

        <p>
          Configuración del sistema de asistencia.
        </p>
      </div>

      <section className="content-card">
        <div className="empty-table">
          <div className="empty-table-icon">
            <Settings size={28} />
          </div>

          <h3>Configuración del sistema</h3>

          <p>
            Aquí configuraremos los parámetros
            de asistencia, reconocimiento facial
            y sistema.
          </p>
        </div>
      </section>
    </div>
  );
}