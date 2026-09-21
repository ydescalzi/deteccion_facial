import {
  Activity,
  Clock3,
  GraduationCap,
  Users,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="page">
      <div className="page-title">
        <h2>Dashboard</h2>
        <p>
          Gestión inteligente de asistencia
          universitaria.
        </p>
      </div>

      <div className="dashboard-status">
        <div>
          <span className="status-dot" />
          Motor IA activo
        </div>

        <span>Sistema Universitario USMP</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Personas registradas</span>
            <strong>1,250</strong>
            <small>Estudiantes y docentes</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <GraduationCap size={22} />
          </div>

          <div>
            <span>Presentes hoy</span>
            <strong>1,180</strong>
            <small>94.4% del total</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={22} />
          </div>

          <div>
            <span>Tardanzas</span>
            <strong>42</strong>
            <small>Registradas hoy</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Activity size={22} />
          </div>

          <div>
            <span>Reconocimientos</span>
            <strong>1,138</strong>
            <small>Procesados hoy</small>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>Actividad de hoy</h3>
              <p>
                Últimos registros de asistencia
              </p>
            </div>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-avatar">
                JP
              </div>

              <div>
                <strong>Juan Pérez</strong>
                <span>Estudiante</span>
              </div>

              <time>08:03</time>
            </div>

            <div className="activity-item">
              <div className="activity-avatar">
                AL
              </div>

              <div>
                <strong>Ana López</strong>
                <span>Estudiante</span>
              </div>

              <time>08:05</time>
            </div>

            <div className="activity-item">
              <div className="activity-avatar">
                CG
              </div>

              <div>
                <strong>Carlos García</strong>
                <span>Docente</span>
              </div>

              <time>08:08</time>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>Estado del sistema</h3>
              <p>Servicios principales</p>
            </div>
          </div>

          <div className="system-services">
            <div>
              <span className="service-indicator" />
              <span>API de Inteligencia Artificial</span>
              <strong>Activo</strong>
            </div>

            <div>
              <span className="service-indicator" />
              <span>Detector facial</span>
              <strong>Activo</strong>
            </div>

            <div>
              <span className="service-indicator" />
              <span>Reconocimiento facial</span>
              <strong>Activo</strong>
            </div>

            <div>
              <span className="service-indicator pending" />
              <span>Base de datos</span>
              <strong>Pendiente</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}