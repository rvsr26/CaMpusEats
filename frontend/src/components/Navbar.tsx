"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { 
  ShoppingBag, 
  User as UserIcon, 
  Wallet, 
  Award, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard,
  HelpCircle,
  Clock
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleProfileDropdown = () => setProfileDropdownOpen(!profileDropdownOpen);

  const isAdmin = user && ["admin", "super-admin", "manager", "staff", "accountant"].includes(user.role);

  return (
    <nav className="navbar glass">
      <div className="container navbar-container">
        <Link href="/" className="navbar-logo">
          <span className="logo-emoji">🍽️</span>
          <span className="logo-text">CaMpus<span className="logo-highlight">Eats</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links hide-mobile">
          <Link href="/menu" className="nav-link">Menu</Link>
          <Link href="/canteens" className="nav-link">Canteens</Link>
          {user && (
            <>
              <Link href="/orders" className="nav-link">My Orders</Link>
              <Link href="/rewards" className="nav-link flex items-center gap-2">
                <Award size={16} /> Rewards
              </Link>
              <Link href="/wallet" className="nav-link flex items-center gap-2">
                <Wallet size={16} /> Wallet
              </Link>
            </>
          )}
          {isAdmin && (
            <Link href="/admin" className="nav-link admin-link flex items-center gap-2">
              <LayoutDashboard size={16} /> Admin Portal
            </Link>
          )}
        </div>

        {/* Action Buttons */}
        <div className="navbar-actions">
          {user ? (
            <>
              <Link href="/cart" className="cart-badge-wrapper btn-ghost btn-icon">
                <ShoppingBag size={20} />
                {cartItemsCount > 0 && (
                  <span className="cart-badge animate-scaleIn">{cartItemsCount}</span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="profile-dropdown-container">
                <button onClick={toggleProfileDropdown} className="profile-trigger-btn">
                  <div className="avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="username hide-mobile">{user.name.split(" ")[0]}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="profile-dropdown card animate-scaleIn">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{user.name}</p>
                      <p className="dropdown-email">{user.email}</p>
                      <span className="badge badge-primary">{user.role}</span>
                    </div>
                    <div className="divider"></div>
                    <Link href="/profile" className="dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                      <UserIcon size={16} /> Profile Settings
                    </Link>
                    <Link href="/wallet" className="dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                      <Wallet size={16} /> Wallet (₹{user.walletBalance.toFixed(2)})
                    </Link>
                    <Link href="/rewards" className="dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                      <Award size={16} /> Badges & Streaks
                    </Link>
                    <Link href="/support" className="dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                      <HelpCircle size={16} /> Support Helpdesk
                    </Link>
                    <div className="divider"></div>
                    <button onClick={() => { logout(); setProfileDropdownOpen(false); }} className="dropdown-item logout-btn">
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons hide-mobile">
              <Link href="/auth/login" className="btn btn-ghost btn-sm">Log In</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button onClick={toggleMobileMenu} className="btn-ghost btn-icon mobile-menu-trigger hide-desktop">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="mobile-sidebar glass animate-slideInRight hide-desktop">
          <div className="mobile-links">
            <Link href="/menu" className="mobile-link" onClick={toggleMobileMenu}>Browse Menu</Link>
            <Link href="/canteens" className="mobile-link" onClick={toggleMobileMenu}>Canteens</Link>
            {user && (
              <>
                <Link href="/orders" className="mobile-link" onClick={toggleMobileMenu}>My Orders</Link>
                <Link href="/rewards" className="mobile-link" onClick={toggleMobileMenu}>Rewards & Badges</Link>
                <Link href="/wallet" className="mobile-link" onClick={toggleMobileMenu}>Wallet (₹{user.walletBalance})</Link>
                <Link href="/profile" className="mobile-link" onClick={toggleMobileMenu}>Profile Settings</Link>
                <Link href="/support" className="mobile-link" onClick={toggleMobileMenu}>Support Tickets</Link>
              </>
            )}
            {isAdmin && (
              <Link href="/admin" className="mobile-link admin-link" onClick={toggleMobileMenu}>Admin Dashboard</Link>
            )}
            <div className="divider"></div>
            {user ? (
              <button onClick={() => { logout(); toggleMobileMenu(); }} className="mobile-link logout-btn">
                <LogOut size={18} /> Log Out
              </button>
            ) : (
              <div className="mobile-auth-btns">
                <Link href="/auth/login" className="btn btn-secondary" onClick={toggleMobileMenu}>Log In</Link>
                <Link href="/auth/register" className="btn btn-primary" onClick={toggleMobileMenu}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: var(--nav-height);
          z-index: 1000;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
        }
        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 800;
          color: var(--color-text);
        }
        .logo-emoji {
          font-size: 24px;
        }
        .logo-highlight {
          color: var(--color-primary);
        }
        .navbar-links {
          display: flex;
          gap: 24px;
        }
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: color var(--transition-fast);
        }
        .nav-link:hover {
          color: var(--color-text);
        }
        .admin-link {
          color: var(--color-primary);
        }
        .admin-link:hover {
          color: var(--color-primary-hover);
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cart-badge-wrapper {
          position: relative;
        }
        .cart-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--color-primary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          border-radius: 50%;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
        .profile-dropdown-container {
          position: relative;
        }
        .profile-trigger-btn {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-primary-light);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          border: 1.5px solid var(--color-primary);
        }
        .username {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text);
        }
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 260px;
          padding: 16px;
          z-index: 1010;
        }
        .dropdown-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dropdown-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--color-text);
        }
        .dropdown-email {
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          font-size: 14px;
          font-weight: 500;
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
        }
        .dropdown-item:hover {
          background: var(--color-surface-hover);
          color: var(--color-text);
        }
        .logout-btn {
          color: var(--color-error);
          width: 100%;
          text-align: left;
        }
        .logout-btn:hover {
          background: var(--color-error-light);
          color: var(--color-error);
        }
        .auth-buttons {
          display: flex;
          gap: 8px;
        }
        .mobile-sidebar {
          position: fixed;
          top: var(--nav-height);
          right: 0;
          width: 280px;
          height: calc(100vh - var(--nav-height));
          z-index: 999;
          border-left: 1px solid var(--color-border);
          padding: 24px;
        }
        .mobile-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mobile-link {
          font-size: 16px;
          font-weight: 500;
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mobile-link:hover {
          color: var(--color-text);
        }
        .mobile-auth-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        }
      `}</style>
    </nav>
  );
};
