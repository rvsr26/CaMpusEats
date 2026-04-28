"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight 
} from "lucide-react";

interface SummaryData {
  totalOrders: number;
  totalRevenue: { total: number }[];
  todayOrders: number;
  todayRevenue: { total: number }[];
  ordersByStatus: { _id: string; count: number }[];
  topItems: { _id: string; totalQty: number; revenue: number }[];
  dailyRevenue: { _id: string; revenue: number; orders: number }[];
  canteenRevenue: { _id: string; revenue: number; count: number }[];
  paymentMethods: { _id: string; count: number; revenue: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/api/analytics/summary");
        setData(res.data);
      } catch (err) {
        console.error("Dashboard analytics error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="card text-center p-8">No analytical data loaded.</div>;

  // Formulate stats variables
  const totRevVal = data.totalRevenue?.[0]?.total || 0;
  const todRevVal = data.todayRevenue?.[0]?.total || 0;

  // Colors for Pie Charts
  const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#eab308", "#ef4444"];

  return (
    <div className="admin-dashboard animate-fadeIn">
      <div className="dashboard-header mb-8">
        <h1>Analytics Overview</h1>
        <p>Real-time visual reports of sales performance, top meals, and billing trends</p>
      </div>

      {/* Top Cards Grid */}
      <div className="stat-cards-grid stagger mb-8">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Today's Revenue</span>
            <div className="icon-badge bg-primary-light text-primary">
              <IndianRupee size={16} />
            </div>
          </div>
          <span className="stat-value">₹{todRevVal.toFixed(2)}</span>
          <span className="stat-change up"><ArrowUpRight size={14} /> Live Today</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Today's Orders</span>
            <div className="icon-badge bg-info-light text-info">
              <ShoppingBag size={16} />
            </div>
          </div>
          <span className="stat-value">{data.todayOrders} Orders</span>
          <span className="stat-change up"><ArrowUpRight size={14} /> Active Incoming</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Semester Revenue</span>
            <div className="icon-badge bg-success-light text-success">
              <IndianRupee size={16} />
            </div>
          </div>
          <span className="stat-value">₹{totRevVal.toFixed(2)}</span>
          <span className="stat-change text-secondary">Historical Total</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Transactions</span>
            <div className="icon-badge bg-warning-light text-warning">
              <TrendingUp size={16} />
            </div>
          </div>
          <span className="stat-value">{data.totalOrders} Orders</span>
          <span className="stat-change text-secondary">Placed overall</span>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="dashboard-charts-grid mb-8">
        {/* Daily Revenue Area Chart */}
        <div className="chart-box card">
          <h3>Daily Billing Volume</h3>
          <div className="divider"></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" stroke="var(--color-text-muted)" fontSize={11} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  labelStyle={{ color: "var(--color-text-secondary)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top items Bar Chart */}
        <div className="chart-box card">
          <h3>Top Selling Meals</h3>
          <div className="divider"></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topItems}>
                <XAxis dataKey="_id" stroke="var(--color-text-muted)" fontSize={11} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  labelStyle={{ color: "var(--color-text-secondary)" }}
                />
                <Bar dataKey="totalQty" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                  {data.topItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="dashboard-charts-grid-3">
        {/* Canteen Revenue */}
        <div className="chart-box card">
          <h3>Stall Revenue</h3>
          <div className="divider"></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.canteenRevenue} layout="vertical">
                <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} />
                <YAxis dataKey="_id" type="category" stroke="var(--color-text-muted)" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                />
                <Bar dataKey="revenue" fill="var(--color-info)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="chart-box card">
          <h3>Payment Channels</h3>
          <div className="divider"></div>
          <div className="chart-wrapper flex justify-center items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="_id"
                >
                  {data.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .dashboard-header p {
          color: var(--color-text-secondary);
        }
        .stat-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }
        .stat-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .icon-badge {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bg-primary-light { background: var(--color-primary-light); }
        .bg-info-light { background: var(--color-info-light); }
        .bg-success-light { background: var(--color-success-light); }
        .bg-warning-light { background: var(--color-warning-light); }
        .text-primary { color: var(--color-primary); }
        .text-info { color: var(--color-info); }
        .text-success { color: var(--color-success); }
        .text-warning { color: var(--color-warning); }
        .dashboard-charts-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
        }
        .dashboard-charts-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .chart-box h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .chart-wrapper {
          margin-top: 16px;
        }
        @media (max-width: 900px) {
          .dashboard-charts-grid, .dashboard-charts-grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
