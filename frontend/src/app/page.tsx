"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { 
  ArrowRight, 
  Clock, 
  MapPin, 
  Star, 
  Activity, 
  Flame, 
  TrendingUp, 
  Leaf, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  Users 
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Canteen {
  _id: string;
  name: string;
  location: string;
  image?: string;
  cuisine: string[];
  distance?: string;
  isOpen: boolean;
  rating: number;
}

interface CanteenTraffic {
  [canteenId: string]: {
    activeOrders: number;
    status: "quiet" | "moderate" | "busy";
    estimatedWait: string;
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [traffic, setTraffic] = useState<CanteenTraffic>({});
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const canteensRes = await api.get("/api/canteens");
        setCanteens(canteensRes.data);

        // Fetch traffic status for each canteen
        const trafficData: CanteenTraffic = {};
        await Promise.all(
          canteensRes.data.map(async (c: Canteen) => {
            try {
              const trafficRes = await api.get(`/api/canteens/${c._id}/traffic`);
              trafficData[c._id] = trafficRes.data;
            } catch (err) {
              // fallback
              trafficData[c._id] = { activeOrders: 0, status: "quiet", estimatedWait: "5-10 mins" };
            }
          })
        );
        setTraffic(trafficData);

        // Fetch user active orders
        if (user) {
          const ordersRes = await api.get("/api/orders");
          const active = ordersRes.data.filter((o: any) => 
            ["scheduled", "pending", "accepted", "preparing", "ready"].includes(o.status)
          );
          setActiveOrders(active);
        }
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="container dashboard-container animate-fadeIn">
      {/* Hero Section */}
      <section className="hero-section glass">
        <div className="hero-text stagger">
          <span className="badge badge-primary flex items-center gap-1">
            <Zap size={10} fill="var(--color-primary)" /> Smart Campus Dining
          </span>
          <h1>Skip Canteen Queues, Enjoy Premium Meals</h1>
          <p>Order ahead from your favorite campus stalls. Pay securely with your wallet and track preparation status in real-time.</p>
          <div className="hero-actions">
            <Link href="/menu" className="btn btn-primary btn-lg">
              Order Food Now <ArrowRight size={18} />
            </Link>
            <Link href="/canteens" className="btn btn-secondary btn-lg">
              Explore Stalls
            </Link>
          </div>
        </div>
        <div className="hero-image-wrapper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop&q=60" 
            alt="Campus Dining" 
            className="hero-image"
          />
        </div>
      </section>

      {/* User Stats Quick-Bar */}
      {user && (
        <section className="stats-bar stagger">
          <div className="stat-card">
            <span className="stat-label">Wallet Balance</span>
            <span className="stat-value">₹{user.walletBalance.toFixed(2)}</span>
            <Link href="/wallet" className="stat-link">Top Up Account &rarr;</Link>
          </div>
          <div className="stat-card">
            <span className="stat-label">Loyalty Points</span>
            <span className="stat-value flex items-center gap-1 text-amber-500">
              <Star size={24} fill="var(--color-warning)" stroke="var(--color-warning)" /> {user.loyaltyPoints}
            </span>
            <Link href="/rewards" className="stat-link">Redeem Badges &rarr;</Link>
          </div>
          <div className="stat-card">
            <span className="stat-label">Carbon Offset Savings</span>
            <span className="stat-value flex items-center gap-1 text-green-500">
              <Leaf size={24} className="text-green-500" /> {user.totalCarbonSaved.toFixed(1)} kg
            </span>
            <span className="stat-sublabel">Sustainability Level {user.sustainabilityLevel}</span>
          </div>
        </section>
      )}

      {/* Active Orders Banner */}
      {activeOrders.length > 0 && (
        <section className="active-orders-section">
          <h3>🕒 Live Order Tracking</h3>
          <div className="active-orders-grid">
            {activeOrders.map((order) => (
              <div key={order._id} className="active-order-banner card animate-pulse">
                <div className="active-order-info">
                  <span className="badge badge-warning">Token #{order.tokenNumber || "N/A"}</span>
                  <h4>Order from {order.canteen?.name || "Canteen"}</h4>
                  <p>{order.items.length} items &bull; Total: ₹{order.totalAmount}</p>
                </div>
                <div className="active-order-action">
                  <span className="order-status-text">Status: <strong>{order.status}</strong></span>
                  <Link href={`/orders/${order._id}`} className="btn btn-primary btn-sm">
                    Track Live
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Canteen Outlets Grid */}
      <section className="section canteens-section">
        <div className="section-header">
          <div>
            <h2>Campus Canteen Outlets</h2>
            <p>Select a stall to browse their specific menu</p>
          </div>
          <Link href="/canteens" className="view-all-link flex items-center gap-1">
            View All Stalls <ArrowRight size={14} />
          </Link>
        </div>

        <div className="canteens-grid stagger">
          {canteens.slice(0, 3).map((canteen) => {
            const tr = traffic[canteen._id] || { status: "quiet", estimatedWait: "5-10 mins" };
            return (
              <div key={canteen._id} className="canteen-dashboard-card card card-hoverable">
                <div className="canteen-img-wrapper">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={canteen.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60"} 
                    alt={canteen.name} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60";
                    }}
                  />
                  <div className="traffic-overlay">
                    <span className={`badge ${tr.status === "busy" ? "badge-error" : tr.status === "moderate" ? "badge-warning" : "badge-success"}`}>
                      <Activity size={10} /> {tr.status.toUpperCase()} ({tr.estimatedWait})
                    </span>
                  </div>
                </div>
                <div className="canteen-dashboard-body">
                  <div className="canteen-meta-header">
                    <span className="canteen-loc"><MapPin size={12} /> {canteen.location}</span>
                    <span className="canteen-rating flex items-center gap-1">
                      <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" /> {canteen.rating.toFixed(1)}
                    </span>
                  </div>
                  <h3>{canteen.name}</h3>
                  <p className="cuisine-list">{canteen.cuisine.join(" &bull; ")}</p>
                  <Link href={`/menu?canteen=${canteen._id}`} className="btn btn-primary btn-sm w-full mt-4">
                    View Stall Menu
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Overview */}
      <section className="section features-section">
        <h2>Features Designed for Students</h2>
        <p className="features-sub">Smart utilities to simplify campus life</p>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon"><Clock size={20} /></div>
            <h3>Scheduled Breaks Pre-ordering</h3>
            <p>Plan ahead! Pre-schedule your lunch order to be ready exactly when your class break starts.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon"><Users size={20} /></div>
            <h3>"Squad" Group Ordering</h3>
            <p>Form custom ordering lobbies with friends to place split group orders dynamically.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon"><Smartphone size={20} /></div>
            <h3>QR Table Ordering</h3>
            <p>Walk in, scan the table QR code, browse menus, and pay instantly from your device.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon"><Leaf size={20} /></div>
            <h3>Sustainable Eating</h3>
            <p>Earn green reward points and badges by ordering sustainable, low-carbon vegan meals.</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .dashboard-container {
          padding-top: 40px;
        }
        .hero-section {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          padding: 48px;
          border-radius: var(--radius-xl);
          align-items: center;
          margin-bottom: 40px;
          overflow: hidden;
        }
        .hero-text h1 {
          font-size: 40px;
          font-weight: 800;
          line-height: 1.15;
          margin: 16px 0;
          letter-spacing: -0.5px;
        }
        .hero-text p {
          font-size: 15px;
          color: var(--color-text-secondary);
          margin-bottom: 32px;
          max-width: 500px;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
        }
        .hero-image-wrapper {
          border-radius: var(--radius-lg);
          overflow: hidden;
          aspect-ratio: 4/3;
          border: 1px solid var(--color-border);
        }
        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        .stat-link {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-primary);
          margin-top: 8px;
          display: inline-block;
        }
        .stat-sublabel {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }
        .active-orders-section {
          margin-bottom: 40px;
        }
        .active-orders-section h3 {
          margin-bottom: 16px;
        }
        .active-orders-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .active-order-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-left: 4px solid var(--color-primary);
        }
        .active-order-info h4 {
          margin-top: 4px;
          font-size: 16px;
        }
        .active-order-info p {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .active-order-action {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .order-status-text {
          font-size: 13px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
        }
        .view-all-link {
          font-size: 14px;
          color: var(--color-primary);
          font-weight: 600;
        }
        .canteens-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        .canteen-dashboard-card {
          padding: 0;
          overflow: hidden;
        }
        .canteen-img-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16/10;
        }
        .canteen-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .traffic-overlay {
          position: absolute;
          top: 12px;
          right: 12px;
        }
        .canteen-dashboard-body {
          padding: 20px;
        }
        .canteen-meta-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }
        .canteen-loc {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cuisine-list {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }
        .features-section {
          text-align: center;
          margin-bottom: 40px;
        }
        .features-sub {
          color: var(--color-text-secondary);
          margin-bottom: 40px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }
        .feature-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 24px;
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-primary-light);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }
        .feature-card p {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }
        @media (max-width: 992px) {
          .hero-section {
            grid-template-columns: 1fr;
          }
          .hero-image-wrapper {
            display: none;
          }
        }
        @media (max-width: 768px) {
          .hero-text h1 {
            font-size: 32px;
          }
          .hero-actions {
            flex-direction: column;
          }
          .active-order-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .active-order-action {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
