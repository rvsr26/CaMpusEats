import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-info">
          <Link href="/" className="footer-logo">
            <span className="logo-emoji">🍽️</span>
            <span className="logo-text">CaMpus<span className="logo-highlight">Eats</span></span>
          </Link>
          <p className="footer-description">
            Advanced College Canteen Management System. Streamlining food ordering, tracking, and rewards for college campuses.
          </p>
        </div>
        <div className="footer-links">
          <div className="links-column">
            <h4>Quick Links</h4>
            <Link href="/menu">Smart Menu</Link>
            <Link href="/canteens">Our Stalls</Link>
            <Link href="/rewards">Loyalty Program</Link>
          </div>
          <div className="links-column">
            <h4>Platform</h4>
            <Link href="/support">Help & Support</Link>
            <Link href="/wallet">In-app Wallet</Link>
            <Link href="/admin">Staff Dashboard</Link>
          </div>
        </div>
      </div>
      <div className="divider"></div>
      <div className="container footer-bottom">
        <p className="copyright">&copy; {new Date().getFullYear()} CaMpusEats. Built for campus culinary excellence.</p>
        <p className="sustainability">🌱 Every order reduces carbon footprint through green sourcing</p>
      </div>

      <style jsx>{`
        .footer {
          background: var(--color-bg-secondary);
          border-top: 1px solid var(--color-border);
          padding: 48px 0 24px;
          margin-top: auto;
        }
        .footer-container {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 32px;
        }
        .footer-info {
          max-width: 380px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 800;
          color: var(--color-text);
          margin-bottom: 16px;
        }
        .logo-emoji {
          font-size: 20px;
        }
        .logo-highlight {
          color: var(--color-primary);
        }
        .footer-description {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        .footer-links {
          display: flex;
          gap: 64px;
        }
        .links-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .links-column h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .links-column a {
          font-size: 13px;
          color: var(--color-text-secondary);
          transition: color var(--transition-fast);
        }
        .links-column a:hover {
          color: var(--color-primary);
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: var(--color-text-muted);
        }
        .sustainability {
          color: var(--color-success);
          font-weight: 500;
        }
        @media (max-width: 768px) {
          .footer-container {
            flex-direction: column;
          }
          .footer-links {
            gap: 32px;
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </footer>
  );
};
