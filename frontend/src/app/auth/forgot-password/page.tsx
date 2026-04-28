"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Mail, ArrowLeft, Key } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSuccess(true);
      showToast("Password reset link sent to your email", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card glass animate-scaleIn">
        <div className="back-link-row">
          <Link href="/auth/login" className="back-link">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        <div className="auth-header">
          <div className="icon-wrapper">
            <Key size={24} className="key-icon" />
          </div>
          <h2>Forgot Password</h2>
          <p>Enter your email to receive a password reset link</p>
        </div>

        {success ? (
          <div className="success-message">
            <p>Check your email for instructions to reset your password.</p>
            <button className="btn btn-secondary btn-block" onClick={() => setSuccess(false)}>
              Try another email
            </button>
          </div>
        ) : (
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

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}
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
        .back-link-row {
          margin-bottom: 24px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--color-text-secondary);
          font-weight: 500;
        }
        .back-link:hover {
          color: var(--color-text);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .key-icon {
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
        .btn-block {
          width: 100%;
          margin-top: 8px;
        }
        .success-message {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 16px;
          font-size: 14px;
          color: var(--color-success);
        }
      `}</style>
    </div>
  );
}
