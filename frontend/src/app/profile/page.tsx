"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/context/ToastContext";
import { api } from "@/services/api";
import { 
  User, 
  Phone, 
  Lock, 
  Gift, 
  Share2, 
  CheckCircle,
  Copy
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmittingProfile(true);
    try {
      const res = await api.put("/api/auth/profile", { name, phone });
      updateUser(res.data.user || res.data);
      showToast("Profile details updated successfully", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    setSubmittingPassword(true);
    try {
      await api.put("/api/auth/profile", {
        currentPassword,
        newPassword
      });
      showToast("Password updated successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update password", "error");
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    const inviteLink = `${window.location.origin}/auth/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    showToast("Invite link copied to clipboard!", "success");
  };

  return (
    <ProtectedRoute>
      <div className="container profile-page animate-fadeIn">
        <div className="page-header">
          <h1>My Profile Settings</h1>
          <p>Manage personal details, security configurations, and referral rewards</p>
        </div>

        <div className="profile-grid stagger">
          {/* Personal Details */}
          <div className="left-panel">
            <div className="card form-card">
              <h3>Personal Information</h3>
              <div className="divider"></div>
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={16} />
                    <input
                      id="name"
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address (Read-only)</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    value={user?.email}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <div className="input-with-icon">
                    <Phone className="input-icon" size={16} />
                    <input
                      id="phone"
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submittingProfile}>
                  {submittingProfile ? <LoadingSpinner size="sm" /> : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="card form-card">
              <h3>Security & Password</h3>
              <div className="divider"></div>
              <form onSubmit={handleChangePassword} className="profile-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="currPassword">Current Password</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={16} />
                    <input
                      id="currPassword"
                      type="password"
                      className="form-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">New Password</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={16} />
                    <input
                      id="newPassword"
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confPassword">Confirm New Password</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={16} />
                    <input
                      id="confPassword"
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={submittingPassword}>
                  {submittingPassword ? <LoadingSpinner size="sm" /> : "Change Password"}
                </button>
              </form>
            </div>
          </div>

          {/* Referral & invite panel */}
          <div className="right-panel">
            <div className="card referral-card glass">
              <div className="card-header-icon">
                <Gift size={28} className="text-primary animate-pulse" />
              </div>
              <h3>Invite Friends, Earn Credits</h3>
              <p>Share your campus invite code with classmates. You will both get ₹50 free wallet credits when they place their first order!</p>
              
              <div className="divider"></div>

              <div className="referral-code-box">
                <span className="code-label">Your Referral Code</span>
                <span className="code-value">{user?.referralCode || "WELCOME50"}</span>
                <button onClick={handleCopyReferral} className="btn btn-ghost btn-icon copy-btn">
                  <Copy size={16} />
                </button>
              </div>

              <div className="divider"></div>

              <div className="referral-stats">
                <div className="stat-box">
                  <span className="stat-title">Friends Referred</span>
                  <span className="stat-count">{user?.referralCount || 0}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-title">Credits Earned</span>
                  <span className="stat-count text-success">₹{user?.referralCredits || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .profile-page {
            padding-top: 40px;
          }
          .page-header {
            margin-bottom: 32px;
          }
          .page-header h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 8px;
          }
          .page-header p {
            color: var(--color-text-secondary);
          }
          .profile-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 32px;
            align-items: flex-start;
          }
          .left-panel, .right-panel {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .profile-form {
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
          .referral-card {
            padding: 32px;
            text-align: center;
            border-left: 4px solid var(--color-primary);
          }
          .card-header-icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--color-primary-light);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
          .referral-card h3 {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .referral-card p {
            font-size: 13px;
            color: var(--color-text-secondary);
            line-height: 1.5;
          }
          .referral-code-box {
            background: var(--color-bg-tertiary);
            border: 1px dashed var(--color-border);
            padding: 16px;
            border-radius: var(--radius-md);
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
          }
          .code-label {
            font-size: 11px;
            color: var(--color-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .code-value {
            font-size: 18px;
            font-weight: 800;
            color: var(--color-primary);
          }
          .referral-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .stat-box {
            background: var(--color-bg-tertiary);
            padding: 16px;
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
          }
          .stat-title {
            display: block;
            font-size: 11px;
            color: var(--color-text-secondary);
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .stat-count {
            font-size: 24px;
            font-weight: 800;
          }
          .text-success {
            color: var(--color-success);
          }
          @media (max-width: 800px) {
            .profile-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
