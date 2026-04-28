"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { User, Mail, Lock, Phone, Gift, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        phone,
        password,
        referralCode: referralCode || undefined,
      });
    } catch (err) {
      // AuthContext handles toasts
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card glass animate-scaleIn">
        <div className="auth-header">
          <Link href="/" className="auth-logo">
            <span className="logo-emoji">🍽️</span>
            <span className="logo-text">CaMpus<span className="logo-highlight">Eats</span></span>
          </Link>
          <h2>Create Account</h2>
          <p>Join CaMpusEats for smart queue-free ordering</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form stagger">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <User className="input-icon" size={16} />
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={16} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number (Optional)</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={16} />
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={16} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="referralCode">Referral Code (Optional)</label>
            <div className="input-with-icon">
              <Gift className="input-icon" size={16} />
              <input
                id="referralCode"
                type="text"
                className="form-input"
                placeholder="WELCOME50"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <UserPlus size={16} /> Register
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link href="/auth/login" className="auth-link">Sign in here</Link></p>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
          padding: 24px;
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 40px 32px;
          border: 1px solid var(--color-border);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          font-weight: 800;
          color: var(--color-text);
          margin-bottom: 16px;
        }
        .logo-emoji {
          font-size: 28px;
        }
        .logo-highlight {
          color: var(--color-primary);
        }
        .auth-header h2 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .auth-header p {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--color-text-muted);
        }
        .input-with-icon :global(.form-input) {
          padding-left: 42px;
        }
        .btn-block {
          width: 100%;
          margin-top: 8px;
        }
        .auth-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .auth-link {
          color: var(--color-primary);
          font-weight: 600;
        }
        .auth-link:hover {
          color: var(--color-primary-hover);
        }
      `}</style>
    </div>
  );
}
