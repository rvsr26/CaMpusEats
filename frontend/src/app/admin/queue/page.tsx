"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Clock, Play, CheckCircle2, RefreshCw, Compass } from "lucide-react";
import { io } from "socket.io-client";

interface QueueToken {
  _id: string;
  tokenNumber: number;
  status: "waiting" | "called" | "done" | string;
  estimatedWaitMins: number;
  order?: {
    _id: string;
    items?: any[];
    user?: {
      name: string;
    };
  };
}

interface Canteen {
  _id: string;
  name: string;
}

export default function AdminQueuePage() {
  const { showToast } = useToast();

  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteen, setSelectedCanteen] = useState("");
  const [queue, setQueue] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(false);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const res = await api.get("/api/canteens");
        setCanteens(res.data);
        if (res.data.length > 0) {
          setSelectedCanteen(res.data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load canteens:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCanteens();
  }, []);

  const fetchQueue = async () => {
    if (!selectedCanteen) return;
    setLoadingQueue(true);
    try {
      const res = await api.get(`/api/queue?canteen=${selectedCanteen}`);
      setQueue(res.data);
    } catch (err) {
      console.error("Failed to fetch queue list:", err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [selectedCanteen]);

  // Connect to live queue updates
  useEffect(() => {
    if (!selectedCanteen) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5005";
    const socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join", `canteen-${selectedCanteen}`);
    });

    socket.on("queue:update", () => {
      // Re-fetch queue whenever update happens
      fetchQueue();
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedCanteen]);

  const handleAdvance = async (tokenId: string, status: "called" | "done") => {
    try {
      await api.put(`/api/queue/${tokenId}/advance`, { status });
      showToast(`Queue advanced. Token marked as ${status}`, "success");
      fetchQueue();
    } catch (err: any) {
      showToast("Failed to advance queue", "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  const waitingTokens = queue.filter((t) => t.status === "waiting");
  const calledTokens = queue.filter((t) => t.status === "called");

  return (
    <div className="admin-queue-page animate-fadeIn">
      <div className="page-header mb-8 flex justify-between items-center">
        <div>
          <h1>Live Queue Management</h1>
          <p>Organize token numbers waiting to collect or notify students that meals are ready.</p>
        </div>

        <select
          className="form-select filter-canteen-select"
          style={{ width: "200px" }}
          value={selectedCanteen}
          onChange={(e) => setSelectedCanteen(e.target.value)}
        >
          <option value="">Select Canteen...</option>
          {canteens.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loadingQueue ? (
        <LoadingSpinner />
      ) : queue.length === 0 ? (
        <div className="card text-center p-12 text-secondary">
          <Compass size={48} className="text-muted mb-4" />
          <h3>Queue is Empty</h3>
          <p>No student tokens are currently in the pickup queue.</p>
        </div>
      ) : (
        <div className="queue-columns-grid stagger">
          {/* Waiting Column */}
          <div className="queue-column card">
            <div className="column-header">
              <h3>Waiting for Prep ({waitingTokens.length})</h3>
              <span className="badge badge-warning">Queue</span>
            </div>
            <div className="divider"></div>

            <div className="tokens-list">
              {waitingTokens.map((t) => (
                <div key={t._id} className="token-card">
                  <div className="token-number">
                    Token #{t.tokenNumber}
                  </div>
                  <div className="token-actions">
                    <button onClick={() => handleAdvance(t._id, "called")} className="btn btn-primary btn-sm flex items-center gap-1">
                      <Play size={12} fill="white" /> Call Next
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Called Column */}
          <div className="queue-column card">
            <div className="column-header">
              <h3>Ready for Pickup ({calledTokens.length})</h3>
              <span className="badge badge-success">Called</span>
            </div>
            <div className="divider"></div>

            <div className="tokens-list">
              {calledTokens.map((t) => (
                <div key={t._id} className="token-card">
                  <div className="token-number">
                    Token #{t.tokenNumber}
                  </div>
                  <div className="token-actions">
                    <button onClick={() => handleAdvance(t._id, "done")} className="btn btn-secondary btn-sm flex items-center gap-1">
                      <CheckCircle2 size={12} /> Mark Collected
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .filter-canteen-select {
          min-width: 200px;
        }
        .queue-columns-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: flex-start;
        }
        .queue-column {
          min-height: 400px;
        }
        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .column-header h3 {
          font-size: 16px;
          font-weight: 700;
        }
        .tokens-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .token-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--color-bg-tertiary);
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }
        .token-number {
          font-size: 18px;
          font-weight: 800;
          color: var(--color-text);
        }
        .token-actions {
          display: flex;
          gap: 8px;
        }
        @media (max-width: 800px) {
          .queue-columns-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
