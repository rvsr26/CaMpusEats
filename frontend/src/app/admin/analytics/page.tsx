"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from "recharts";
import { Download, FileSpreadsheet, FileText, TrendingUp, Clock } from "lucide-react";

interface PeakHour {
  hour: number;
  label: string;
  orderCount: number;
  revenue: number;
}

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();

  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeakHours = async () => {
      try {
        const res = await api.get("/api/analytics/peak-hours");
        setPeakHours(res.data);
      } catch (err) {
        console.error("Failed to load peak hours:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPeakHours();
  }, []);

  const handleExport = (format: "csv" | "xlsx") => {
    const token = localStorage.getItem("accessToken");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
    
    // Trigger download with auth token passed as query parameter
    // Wait, the backend requires authentication.
    // Let's see if the backend allows token passed as a query param or if we need to fetch and build a blob.
    // Usually, opening it in a new window works if it is authenticated, but browser requests don't carry headers.
    // Let's use fetch, get blob, and download it!
    api.get(`/api/analytics/export?format=${format}`, {
      responseType: "blob"
    })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `canteen_sales_report_${new Date().toISOString().split("T")[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Exported ${format.toUpperCase()} successfully`, "success");
    })
    .catch((err) => {
      console.error("Export failed:", err);
      showToast("Failed to export report", "error");
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-analytics-page animate-fadeIn">
      <div className="page-header mb-8">
        <h1>Advanced Sales Reports</h1>
        <p>Export business billing histories and inspect hourly crowd load indicators.</p>
      </div>

      <div className="analytics-grid stagger">
        {/* Left Column: Export Cards */}
        <div className="left-panel">
          <div className="card">
            <h3>Download Sales Reports</h3>
            <p className="text-secondary mt-2">Generate comprehensive billing datasets containing customer details, order types, totals, and pickup times.</p>
            <div className="divider"></div>
            
            <div className="export-buttons mt-4">
              <button onClick={() => handleExport("xlsx")} className="btn btn-primary flex items-center gap-2 w-full mb-3">
                <FileSpreadsheet size={18} /> Export Excel Dataset (.xlsx)
              </button>
              <button onClick={() => handleExport("csv")} className="btn btn-secondary flex items-center gap-2 w-full">
                <FileText size={18} /> Export CSV Spreadsheet (.csv)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Peak Hours Chart */}
        <div className="right-panel card">
          <div className="chart-title flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h3>Peak Canteen Hours</h3>
          </div>
          <p className="text-secondary mt-1">Determine crowd trends by auditing order volume throughout a 24-hour cycle.</p>
          <div className="divider"></div>

          <div className="chart-wrapper mt-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={peakHours}>
                <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={9} interval={2} />
                <YAxis stroke="var(--color-text-muted)" fontSize={9} />
                <Tooltip
                  contentStyle={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                />
                <Bar dataKey="orderCount" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style jsx>{`
        .analytics-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 32px;
          align-items: flex-start;
        }
        .export-buttons {
          display: flex;
          flex-direction: column;
        }
        .chart-title h3 {
          font-size: 16px;
          font-weight: 700;
        }
        @media (max-width: 900px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
