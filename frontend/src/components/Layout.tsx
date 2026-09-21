import {
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { Page } from "../types";

import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Layout({
  children,
  currentPage,
  onNavigate,
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1100) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  return (
    <div className="application-layout">
      <Sidebar
        currentPage={currentPage}
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
        onNavigate={onNavigate}
      />

      <div className="main-wrapper">
        <Header
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}