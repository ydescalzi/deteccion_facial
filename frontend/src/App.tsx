import { useState } from "react";

import type { Page } from "./types";

import Layout from "./components/Layout";

/* =========================================================
   CONTEXTO ACADÉMICO
   ========================================================= */

import { AcademicProvider } from "./context/AcademicContext";

/* =========================================================
   PRINCIPAL
   ========================================================= */

import Dashboard from "./pages/Dashboard";

/* =========================================================
   PERSONAS
   ========================================================= */

import Estudiantes from "./pages/personas/Estudiantes";
import Docentes from "./pages/personas/Docentes";

/* =========================================================
   RECONOCIMIENTO FACIAL
   ========================================================= */

import DeteccionFacial from "./pages/reconocimiento/DeteccionFacial";

/* =========================================================
   ASISTENCIA
   ========================================================= */

import Presentes from "./pages/asistencia/Presentes";
import AsistenciaDocentes from "./pages/asistencia/DocentesAdministracion";
import AsistenciaEstudiantes from "./pages/asistencia/Estudiantes";
import Ausentes from "./pages/asistencia/Ausentes";
import Tardanzas from "./pages/asistencia/Tardanzas";
import Historial from "./pages/asistencia/Historial";

/* =========================================================
   GESTIÓN ACADÉMICA
   ========================================================= */

import Cursos from "./pages/academico/Cursos";
import Secciones from "./pages/academico/Secciones";
import Aulas from "./pages/academico/Aulas";
import Horarios from "./pages/academico/Horarios";
import Terminales from "./pages/academico/Terminales";

/* =========================================================
   REPORTES
   ========================================================= */

import Reportes from "./pages/reportes/Reportes";

/* =========================================================
   SISTEMA
   ========================================================= */

import Configuracion from "./pages/sistema/Configuracion";

/* =========================================================
   TERMINAL BIOMÉTRICA
   ========================================================= */

import TerminalBiometrico from "./pages/terminal/TerminalBiometrico";

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [currentPage, setCurrentPage] =
    useState<Page>("dashboard");

  /* =======================================================
     CAMBIAR PÁGINA
     ======================================================= */

  const renderPage = () => {
    switch (currentPage) {
      /* =====================================================
         PRINCIPAL
         ===================================================== */

      case "dashboard":
        return <Dashboard />;

      /* =====================================================
         PERSONAS
         ===================================================== */

      case "estudiantes":
        return <Estudiantes onNavigate={setCurrentPage} />;

      case "docentes":
        return <Docentes />;

      /* =====================================================
         RECONOCIMIENTO
         ===================================================== */

      case "deteccion":
        return <DeteccionFacial />;

      /* =====================================================
         GESTIÓN ACADÉMICA
         ===================================================== */

      case "cursos":
        return <Cursos />;

      case "secciones":
        return <Secciones />;

      case "aulas":
        return <Aulas />;

      case "horarios":
        return <Horarios />;

      case "terminales":
        return <Terminales />;

      /* =====================================================
         ASISTENCIA
         ===================================================== */

      case "presentes":
        return <Presentes />;

      case "asistencia-docentes":
        return <AsistenciaDocentes />;

      case "asistencia-estudiantes":
        return <AsistenciaEstudiantes />;

      case "ausentes":
        return <Ausentes />;

      case "tardanzas":
        return <Tardanzas />;

      case "historial":
        return <Historial />;

      /* =====================================================
         REPORTES
         ===================================================== */

      case "reportes":
        return <Reportes />;

      /* =====================================================
         SISTEMA
         ===================================================== */

      case "configuracion":
        return <Configuracion />;

      /* =====================================================
         SEGURIDAD
         ===================================================== */

      default:
        return <Dashboard />;
    }
  };

  /* =========================================================
     TERMINAL BIOMÉTRICA
     
     Ejemplos:
     
     /terminal/TAB-001
     /terminal/TAB-002
     /terminal/TAB-003
     ========================================================= */

  const terminalMatch = window.location.pathname.match(
    /^\/terminal\/([^/]+)\/?$/
  );

  /* =========================================================
     ESTRUCTURA PRINCIPAL
     ========================================================= */

  return (
    <AcademicProvider>
      {terminalMatch ? (
        <TerminalBiometrico
          key={terminalMatch[1]}
        />
      ) : (
        <Layout
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        >
          {renderPage()}
        </Layout>
      )}
    </AcademicProvider>
  );
}

export default App;