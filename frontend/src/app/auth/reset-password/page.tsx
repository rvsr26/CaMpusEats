"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get("token") : "";
  const router = useRouter();
  const { showToast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast("Reset token is missing from the URL", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setSuccess(true);
      showToast("Password reset successful", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Reset failed. The link might be expired.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card card glass animate-scaleIn">
      <div className="back-link-row">
        <Link href="/auth/login" className="back-link">
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>

      <div className="auth-header">
        <h2>Reset Password</h2>
        <p>Set a new, strong password for your account</p>
      </div>

      {success ? (
        <div className="success-message">
          <CheckCircle size={48} className="success-icon" />
          <p>Password reset successfully. You can now log in with your new password.</p>
          <Link href="/auth/login" className="btn btn-primary btn-block">
            Log In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form stagger">
          <div className="form-group">
            <label className="form-label" htmlFor="password">New Password</label>
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
                minLength={6}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={16} />
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={submitting}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <ResetPasswordForm />
      </Suspense>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
          padding: 24px;
        }
        :global(.auth-card) {
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
          align-items: center;
          gap: 16px;
          font-size: 14px;
          color: var(--color-text);
        }
        .success-icon {
          color: var(--color-success);
        }
      `}</style>
    </div>
  );
}
