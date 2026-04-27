"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { Clock, Eye, XCircle } from "lucide-react";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  tokenNumber?: number;
  createdAt: string;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      showToast("Order cancelled successfully", "success");
      fetchOrders();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to cancel order", "error");
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <ProtectedRoute>
      <div className="container orders-page animate-fadeIn">
        <div className="page-header">
          <h1>My Order History</h1>
          <p>View details, track real-time preparations, or cancel active requests</p>
        </div>

        {orders.length === 0 ? (
          <div className="empty-orders card text-center stagger">
            <h3>No orders yet</h3>
            <p>Your orders will show up here once placed.</p>
            <Link href="/menu" className="btn btn-primary mt-6">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="table-wrapper stagger">
            <table>
              <thead>
                <tr>
                  <th>Token / ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <span className="order-token">Token #{order.tokenNumber || "N/A"}</span>
                      <span className="order-id">{order._id.substring(18)}</span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}</td>
                    <td>
                      <div className="items-summary">
                        {order.items.map((i, idx) => (
                          <span key={idx} className="item-summary-pill">
                            {i.name} ({i.quantity})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td><strong>₹{order.totalAmount}</strong></td>
                    <td>
                      <span className={`badge ${order.paymentStatus === "paid" ? "badge-success" : "badge-error"}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons">
                        <Link href={`/orders/${order._id}`} className="btn btn-ghost btn-sm flex items-center gap-1">
                          <Eye size={14} /> View
                        </Link>
                        {["scheduled", "pending"].includes(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="btn btn-ghost btn-danger btn-sm flex items-center gap-1"
                          >
                            <XCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <style jsx>{`
          .orders-page {
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
          .empty-orders {
            padding: 80px 24px;
            max-width: 500px;
            margin: 0 auto;
          }
          .empty-orders p {
            color: var(--color-text-secondary);
          }
          .order-token {
            display: block;
            font-weight: 700;
            font-size: 14px;
            color: var(--color-text);
          }
          .order-id {
            display: block;
            font-size: 11px;
            color: var(--color-text-muted);
          }
          .items-summary {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            max-width: 320px;
          }
          .item-summary-pill {
            font-size: 12px;
            background: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            padding: 2px 8px;
            border-radius: var(--radius-sm);
            color: var(--color-text-secondary);
          }
          .action-buttons {
            display: inline-flex;
            gap: 8px;
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
