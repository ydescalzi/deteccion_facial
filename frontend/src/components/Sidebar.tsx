import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  Camera,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  MonitorSmartphone,
  Settings,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";

import type { ReactNode } from "react";
import type { Page } from "../types";

interface SidebarProps {
  currentPage: Page;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
}

interface MenuItem {
  id: Page;
  label: string;
  icon: ReactNode;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "PRINCIPAL",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={19} />,
      },
    ],
  },

  {
    title: "PERSONAS",
    items: [
      {
        id: "estudiantes",
        label: "Estudiantes",
        icon: <GraduationCap size={19} />,
      },
      {
        id: "docentes",
        label: "Docentes",
        icon: <UserRound size={19} />,
      },
    ],
  },

  {
    title: "ACADÉMICO",
    items: [
      {
        id: "cursos",
        label: "Cursos",
        icon: <BookOpen size={19} />,
      },
      {
        id: "secciones",
        label: "Secciones",
        icon: <BookOpen size={19} />,
      },
      {
        id: "aulas",
        label: "Aulas",
        icon: <Building2 size={19} />,
      },
      {
        id: "horarios",
        label: "Horarios",
        icon: <CalendarDays size={19} />,
      },
      {
        id: "terminales",
        label: "Terminales",
        icon: <MonitorSmartphone size={19} />,
      },
    ],
  },

  {
    title: "RECONOCIMIENTO",
    items: [
      {
        id: "deteccion",
        label: "Detección facial",
        icon: <Camera size={19} />,
      },
    ],
  },

  {
    title: "ASISTENCIA",
    items: [
      {
        id: "presentes",
        label: "Presentes",
        icon: <UserCheck size={19} />,
      },
      {
        id: "asistencia-docentes",
        label: "Docentes",
        icon: <UserRound size={19} />,
      },
      {
        id: "asistencia-estudiantes",
        label: "Estudiantes",
        icon: <GraduationCap size={19} />,
      },
    ],
  },

  {
    title: "ANÁLISIS",
    items: [
      {
        id: "reportes",
        label: "Reportes",
        icon: <BarChart3 size={19} />,
      },
    ],
  },

  {
    title: "SISTEMA",
    items: [
      {
        id: "configuracion",
        label: "Configuración",
        icon: <Settings size={19} />,
      },
    ],
  },
];

export default function Sidebar({
  currentPage,
  isOpen,
  onClose,
  onNavigate,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >
        {/* =====================================================
            MARCA
            ===================================================== */}

        <div className="sidebar-brand">
          <div className="sidebar-logo">
            SMP
          </div>

          <div className="sidebar-brand-text">
            <strong>USMP</strong>
            <span>Asistencia</span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* =====================================================
            ESTADO DEL MOTOR IA
            ===================================================== */}

        <div className="sidebar-system-status">
          <span className="system-status-dot" />

          <div>
            <strong>Motor IA</strong>
            <span>Activo</span>
          </div>
        </div>

        {/* =====================================================
            NAVEGACIÓN
            ===================================================== */}

        <nav className="sidebar-nav">
          {menuSections.map((section) => (
            <div
              className="sidebar-section"
              key={section.title}
            >
              <div className="sidebar-section-title">
                {section.title}
              </div>

              <div className="sidebar-items">
                {section.items.map((item) => {
                  const active =
                    currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sidebar-item ${
                        active
                          ? "sidebar-item-active"
                          : ""
                      }`}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                    >
                      <span className="sidebar-item-icon">
                        {item.icon}
                      </span>

                      <span className="sidebar-item-label">
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight
                          size={16}
                          className="sidebar-active-arrow"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* =====================================================
            USUARIO
            ===================================================== */}

        <div className="sidebar-footer">
          <div className="sidebar-user-avatar">
            A
          </div>

          <div className="sidebar-user-info">
            <strong>Administrador</strong>
            <span>Sistema USMP</span>
          </div>

          <Activity size={17} />
        </div>
      </aside>
    </>
  );
}