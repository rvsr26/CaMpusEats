"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RefreshCw, Play, CheckCircle2, AlertTriangle, Compass } from "lucide-react";

interface KdsItem {
  menuItemId: string;
  name: string;
  station: string;
  totalQuantity: number;
  orderIds: string[];
  preparationTime: number;
}

interface KdsStation {
  station: string;
  items: KdsItem[];
}

export default function AdminKdsPage() {
  const { showToast } = useToast();

  const [stations, setStations] = useState<KdsStation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKds = async () => {
    try {
      const res = await api.get("/api/kds/aggregate");
      setStations(res.data);
    } catch (err) {
      console.error("Failed to load KDS data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKds();
    // Poll every 10 seconds for real-time kitchen updates
    const interval = setInterval(fetchKds, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-kds-page animate-fadeIn">
      <div className="page-header mb-8 flex justify-between items-center">
        <div>
          <h1>Kitchen Display System (KDS)</h1>
          <p>Audits active food preparation demands grouped by station (Grill, Fryer, Salad, etc.).</p>
        </div>
        <button onClick={fetchKds} className="btn btn-secondary flex items-center gap-2">
          <RefreshCw size={14} /> Refresh Board
        </button>
      </div>

      {stations.length === 0 ? (
        <div className="card text-center p-12 text-secondary">
          <Compass size={48} className="text-muted mb-4 animate-spin" />
          <h3>Kitchen Queue is Clear</h3>
          <p>No active orders are currently in preparation stage.</p>
        </div>
      ) : (
        <div className="kds-stations-grid stagger">
          {stations.map((station) => (
            <div key={station.station} className="station-card card">
              <div className="station-header">
                <h3>{station.station} Station</h3>
                <span className="badge badge-primary">{station.items.length} items</span>
              </div>
              <div className="divider"></div>

              <div className="station-items">
                {station.items.map((item) => (
                  <div key={item.menuItemId} className="kds-item-row">
                    <div className="item-qty-circle">
                      {item.totalQuantity}
                    </div>
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p className="item-orders-count">{item.orderIds.length} orders &bull; Prep: {item.preparationTime} mins</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .kds-stations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        .station-card {
          min-height: 300px;
          display: flex;
          flex-direction: column;
        }
        .station-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .station-header h3 {
          font-size: 16px;
          font-weight: 700;
        }
        .station-items {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        .kds-item-row {
          display: flex;
          gap: 16px;
          align-items: center;
          background: var(--color-bg-tertiary);
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }
        .item-qty-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-primary);
          color: white;
          font-weight: 800;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-glow);
        }
        .item-info h4 {
          font-size: 14px;
          font-weight: 600;
        }
        .item-orders-count {
          font-size: 11px;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}
