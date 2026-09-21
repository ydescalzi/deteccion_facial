import {
  Bell,
  CalendarDays,
  Menu,
} from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const date = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="hamburger-button"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div className="header-title">
          <span>SISTEMA UNIVERSITARIO</span>
          <strong>Control de asistencia</strong>
        </div>
      </div>

      <div className="header-right">
        <div className="peru-datetime">
          <CalendarDays size={17} />

          <div>
            <strong>{date}</strong>
            <span>
              Lima, Perú · {time}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="notification-button"
          aria-label="Notificaciones"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="header-user">
          <div className="header-user-avatar">
            A
          </div>

          <div>
            <strong>Administrador</strong>
            <span>Sistema USMP</span>
          </div>
        </div>
      </div>
    </header>
  );
}