"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  Award, 
  Flame, 
  Star, 
  Leaf, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Smile 
} from "lucide-react";

export default function RewardsPage() {
  const { user } = useAuth();

  const allPossibleBadges = [
    { name: "First Bite", desc: "Placed your first order on CampusEats", icon: Smile, color: "text-amber-500" },
    { name: "Sustainability Champion", desc: "Saved more than 5kg of CO2 carbon emissions", icon: Leaf, color: "text-green-500" },
    { name: "Streak Starter", desc: "Achieved a 3-day daily ordering streak", icon: Flame, color: "text-orange-500" },
    { name: "Super Saver", desc: "Redeemed loyalty points for cash back", icon: Award, color: "text-blue-500" },
    { name: "Foodie Legend", desc: "Placed over 25 orders this semester", icon: Zap, color: "text-purple-500" }
  ];

  return (
    <ProtectedRoute>
      <div className="container rewards-page animate-fadeIn">
        <div className="page-header">
          <h1>My Loyalty & Green Rewards</h1>
          <p>Track your ordering streaks, sustainable impacts, and unlock exclusive campus badges</p>
        </div>

        {/* Top metrics bar */}
        <div className="metrics-grid stagger">
          <div className="stat-card card glass">
            <span className="stat-label">Loyalty Points</span>
            <div className="stat-val-row">
              <Star size={24} fill="var(--color-warning)" stroke="var(--color-warning)" />
              <span className="stat-value">{user?.loyaltyPoints || 0}</span>
            </div>
            <p className="stat-hint">Redeemable in your wallet</p>
          </div>

          <div className="stat-card card glass">
            <span className="stat-label">Current Daily Streak</span>
            <div className="stat-val-row text-orange">
              <Flame size={24} fill="var(--color-primary)" stroke="var(--color-primary)" />
              <span className="stat-value">{user?.currentStreak || 0} Days</span>
            </div>
            <p className="stat-hint">Order daily to grow your streak multiplier</p>
          </div>

          <div className="stat-card card glass">
            <span className="stat-label">Total Carbon Offset</span>
            <div className="stat-val-row text-green">
              <Leaf size={24} className="text-green-500" />
              <span className="stat-value">{user?.totalCarbonSaved.toFixed(1) || 0} kg</span>
            </div>
            <p className="stat-hint">Level {user?.sustainabilityLevel} Eco-Diner</p>
          </div>
        </div>

        {/* Badges Grid Section */}
        <section className="section badges-section stagger">
          <h2>Unlocked Campus Badges</h2>
          <p className="section-subtext">Grow your reputation score to earn unique titles</p>

          <div className="badges-grid mt-6">
            {allPossibleBadges.map((badge, idx) => {
              const isUnlocked = user?.badges.includes(badge.name) || idx === 0 || (idx === 1 && user && user.totalCarbonSaved > 5) || (idx === 2 && user && user.currentStreak >= 3);
              const BadgeIcon = badge.icon;

              return (
                <div key={badge.name} className={`badge-card card ${isUnlocked ? "unlocked" : "locked"}`}>
                  <div className={`badge-icon-wrapper ${isUnlocked ? badge.color : "locked-icon"}`}>
                    <BadgeIcon size={28} />
                  </div>
                  <h3>{badge.name}</h3>
                  <p>{badge.desc}</p>
                  <span className={`badge ${isUnlocked ? "badge-success" : "badge-muted"}`}>
                    {isUnlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <style jsx>{`
          .rewards-page {
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
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-bottom: 40px;
          }
          .stat-val-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 8px;
          }
          .stat-value {
            font-size: 32px;
            font-weight: 800;
          }
          .stat-hint {
            font-size: 11px;
            color: var(--color-text-muted);
            margin-top: 4px;
          }
          .text-orange { color: var(--color-primary); }
          .text-green { color: var(--color-success); }
          .section-subtext {
            color: var(--color-text-secondary);
            margin-bottom: 24px;
          }
          .badges-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 24px;
          }
          .badge-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 32px 24px;
            transition: all var(--transition-base);
          }
          .badge-card.locked {
            opacity: 0.55;
          }
          .badge-icon-wrapper {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-bg-tertiary);
            margin-bottom: 16px;
            border: 1px solid var(--color-border);
          }
          .locked-icon {
            color: var(--color-text-muted);
          }
          .badge-card h3 {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 6px;
          }
          .badge-card p {
            font-size: 12px;
            color: var(--color-text-secondary);
            line-height: 1.5;
            margin-bottom: 16px;
            min-height: 36px;
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
