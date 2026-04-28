"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { io } from "socket.io-client";
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Check, 
  X, 
  Eye, 
  Play, 
  ChefHat, 
  BellRing,
  Volume2
} from "lucide-react";

interface Order {
  _id: string;
  user?: {
    name: string;
    email: string;
    phone?: string;
  } | null;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  tokenNumber?: number;
  tableNumber?: string;
  scheduledTime?: string;
  notes?: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const params: any = {};
      if (selectedStatus) params.status = selectedStatus;
      const res = await api.get("/api/orders/all", { params });
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus]);

  // Real-time socket updates for new orders
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5005";
    const socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      // Admins listen globally
    });

    socket.on("newOrder", (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      showToast(`New incoming order placed! Token #${order.tokenNumber}`, "success");
      
      // Play a clean HTML5 beep sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (soundErr) {
        console.warn("AudioContext not supported/allowed yet");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status });
      showToast(`Order status updated to ${status}`, "success");
      fetchOrders();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-orders-page animate-fadeIn">
      <div className="page-header mb-8 flex justify-between items-center">
        <div>
          <h1>Order Timeline</h1>
          <p>Real-time list of all student and kiosk transactions. Auto-notifying on incoming requests.</p>
        </div>

        {/* Filter bar */}
        <select
          className="form-select filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready for pickup</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="orders-timeline stagger">
        {orders.length === 0 ? (
          <div className="card text-center p-8 text-secondary">
            No orders found matching the filter.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className={`order-admin-card card ${expandedOrderId === order._id ? "expanded" : ""}`}>
              <div className="order-summary-row" onClick={() => toggleExpand(order._id)}>
                <div className="left-info">
                  <span className="badge badge-primary">Token #{order.tokenNumber || "Pre-Order"}</span>
                  <span className="order-time-label">
                    {new Date(order.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                  <h4>{order.user?.name || "Walk-up Guest"}</h4>
                  <p className="order-desc">{order.items.length} items &bull; ₹{order.totalAmount}</p>
                </div>

                <div className="right-actions" onClick={(e) => e.stopPropagation()}>
                  <OrderStatusBadge status={order.status} />
                  
                  {/* Status modifiers */}
                  {order.status === "pending" && (
                    <button onClick={() => handleUpdateStatus(order._id, "accepted")} className="btn btn-primary btn-sm flex items-center gap-1">
                      <Check size={14} /> Accept
                    </button>
                  )}
                  {order.status === "accepted" && (
                    <button onClick={() => handleUpdateStatus(order._id, "preparing")} className="btn btn-primary btn-sm flex items-center gap-1">
                      <ChefHat size={14} /> Prepare
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button onClick={() => handleUpdateStatus(order._id, "ready")} className="btn btn-primary btn-sm flex items-center gap-1">
                      <BellRing size={14} /> Ready
                    </button>
                  )}
                  {order.status === "ready" && (
                    <button onClick={() => handleUpdateStatus(order._id, "completed")} className="btn btn-secondary btn-sm flex items-center gap-1">
                      <Check size={14} /> Complete
                    </button>
                  )}
                  {["pending", "accepted"].includes(order.status) && (
                    <button onClick={() => handleUpdateStatus(order._id, "cancelled")} className="btn btn-ghost btn-danger btn-sm">
                      <X size={14} /> Cancel
                    </button>
                  )}
                  
                  <button onClick={() => toggleExpand(order._id)} className="btn btn-ghost btn-icon">
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              {expandedOrderId === order._id && (
                <div className="order-details-expanded animate-scaleIn">
                  <div className="divider"></div>
                  <div className="details-grid">
                    <div>
                      <h5>Order Items</h5>
                      <div className="items-box">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="item-detail-row">
                            <span>{i.quantity}x</span>
                            <span>{i.name}</span>
                            <span>₹{i.price * i.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5>Client Info</h5>
                      <p><strong>Name:</strong> {order.user?.name || "Guest"}</p>
                      <p><strong>Email:</strong> {order.user?.email || "N/A"}</p>
                      <p><strong>Phone:</strong> {order.user?.phone || "N/A"}</p>
                      <p><strong>Method:</strong> {order.paymentMethod} ({order.paymentStatus})</p>
                      {order.tableNumber && <p><strong>Table:</strong> {order.tableNumber}</p>}
                      {order.scheduledTime && <p><strong>Scheduled:</strong> {new Date(order.scheduledTime).toLocaleString()}</p>}
                      {order.notes && <p className="notes-para"><strong>Instructions:</strong> "{order.notes}"</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .filter-select {
          min-width: 180px;
        }
        .orders-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .order-admin-card {
          padding: 16px 24px;
        }
        .order-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .left-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .left-info h4 {
          font-size: 15px;
          font-weight: 600;
        }
        .order-time-label {
          font-size: 12px;
          color: var(--color-text-muted);
        }
        .order-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
        }
        .right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .order-details-expanded {
          padding-top: 12px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 32px;
        }
        .details-grid h5 {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .items-box {
          background: var(--color-bg);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }
        .item-detail-row {
          display: grid;
          grid-template-columns: 32px 1fr auto;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .item-detail-row:last-child {
          margin-bottom: 0;
        }
        .details-grid p {
          font-size: 13px;
          margin-bottom: 6px;
        }
        .notes-para {
          font-style: italic;
          color: var(--color-text-secondary);
        }
        @media (max-width: 900px) {
          .order-summary-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .left-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .right-actions {
            width: 100%;
            justify-content: space-between;
          }
          .details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
