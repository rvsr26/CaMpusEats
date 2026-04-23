"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth");
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <div className="app-layout">
      {!isAuthRoute && !isAdminRoute && <Navbar />}
      <main className={!isAuthRoute && !isAdminRoute ? "page-content" : ""}>
        {children}
      </main>
      {!isAuthRoute && !isAdminRoute && <Footer />}
      <style jsx>{`
        .app-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        main {
          flex: 1;
        }
      `}</style>
    </div>
  );
};
