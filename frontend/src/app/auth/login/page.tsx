"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Mail, Lock, LogIn } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
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
          <h2>Welcome Back</h2>
          <p>Sign in to order fresh meals from your campus canteens</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form stagger">
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
            <div className="label-row">
              <label className="form-label" htmlFor="password">Password</label>
              <Link href="/auth/forgot-password" className="forgot-password-link">Forgot Password?</Link>
            </div>
            <div className="input-with-icon">
              <Lock className="input-icon" size={16} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link href="/auth/register" className="auth-link">Sign up here</Link></p>
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
          max-width: 420px;
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
          gap: 20px;
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
        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .forgot-password-link {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-primary);
        }
        .forgot-password-link:hover {
          color: var(--color-primary-hover);
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
