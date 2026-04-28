"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  FolderLock, 
  TrendingUp, 
  Users, 
  HelpCircle, 
  Home, 
  LogOut,
  Layers,
  Menu,
  X,
  Clock,
  Compass
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Order Timeline", href: "/admin/orders", icon: ShoppingBag },
    { name: "Kitchen Display (KDS)", href: "/admin/kds", icon: Compass },
    { name: "Live Queue Board", href: "/admin/queue", icon: Clock },
    { name: "Menu Items CRUD", href: "/admin/menu", icon: Utensils },
    { name: "Inventory Stock", href: "/admin/inventory", icon: Layers },
    { name: "Sales Reports", href: "/admin/analytics", icon: TrendingUp },
    { name: "Staff & Roles", href: "/admin/users", icon: Users },
    { name: "Managed Stalls", href: "/admin/canteens", icon: FolderLock },
    { name: "Support Tickets", href: "/admin/support", icon: HelpCircle },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin", "super-admin", "manager", "staff", "accountant"]}>
      <div className="admin-layout-wrapper">
        {/* Mobile Header */}
        <header className="admin-mobile-header glass hide-desktop">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="mobile-title">CaMpusEats Admin</span>
          <Link href="/" className="btn btn-secondary btn-icon btn-sm">
            <Home size={16} />
          </Link>
        </header>

        {/* Sidebar Container */}
        <aside className={`admin-sidebar glass ${mobileOpen ? "mobile-sidebar-open" : ""}`}>
          <div className="sidebar-brand">
            <span className="brand-emoji">🍔</span>
            <h3>CaMpusEats</h3>
            <span className="badge badge-primary">{user?.role}</span>
          </div>

          <div className="divider"></div>

          <nav className="sidebar-links">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`sidebar-link ${active ? "active-link" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          <div className="divider"></div>

          <div className="sidebar-footer">
            <Link href="/" className="sidebar-link portal-link">
              <Home size={18} />
              <span>Back to Student App</span>
            </Link>
            <button onClick={logout} className="sidebar-link logout-btn">
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {mobileOpen && (
          <div className="sidebar-overlay hide-desktop" onClick={() => setMobileOpen(false)}></div>
        )}

        {/* Content Box */}
        <main className="admin-main-content">
          <div className="admin-content-inner">{children}</div>
        </main>
      </div>

      <style jsx global>{`
        .admin-layout-wrapper {
          display: flex;
          min-height: 100vh;
          background: #08080c;
        }
        .admin-sidebar {
          width: 260px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 990;
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          padding: 24px;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-emoji {
          font-size: 24px;
        }
        .sidebar-brand h3 {
          font-size: 18px;
          font-weight: 800;
          color: var(--color-text);
        }
        .sidebar-links {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          overflow-y: auto;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }
        .sidebar-link:hover, .active-link {
          background: var(--color-surface-hover);
          color: var(--color-text);
        }
        .active-link {
          border-left: 3px solid var(--color-primary);
          background: var(--color-primary-light) !important;
          color: var(--color-primary) !important;
        }
        .portal-link {
          color: var(--color-info);
        }
        .logout-btn {
          color: var(--color-error);
          width: 100%;
          text-align: left;
        }
        .admin-main-content {
          flex: 1;
          margin-left: 260px;
          min-height: 100vh;
          overflow-y: auto;
        }
        .admin-content-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px;
        }
        .admin-mobile-header {
          display: none;
        }
        @media (max-width: 992px) {
          .admin-sidebar {
            transform: translateX(-100%);
            transition: transform var(--transition-base);
          }
          .mobile-sidebar-open {
            transform: translateX(0);
          }
          .admin-mobile-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: var(--nav-height);
            width: 100%;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 980;
            padding: 0 16px;
            border-bottom: 1px solid var(--color-border);
          }
          .mobile-title {
            font-weight: 800;
            font-size: 16px;
          }
          .admin-main-content {
            margin-left: 0;
            padding-top: var(--nav-height);
          }
          .admin-content-inner {
            padding: 20px;
          }
          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 900;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
