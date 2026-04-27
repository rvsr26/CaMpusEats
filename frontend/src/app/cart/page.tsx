"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  FileText, 
  MapPin, 
  Coffee 
} from "lucide-react";

export default function CartPage() {
  const { items, totalAmount, updateCartQuantity, removeFromCart, clearCart, loading: cartLoading } = useCart();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Checkout States
  const [orderType, setOrderType] = useState<"takeaway" | "dining">("takeaway");
  const [paymentMethod, setPaymentMethod] = useState<"Wallet" | "Cash" | "UPI" | "Card" | "Meal Credit">("Wallet");
  const [notes, setNotes] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleQuantityDecrease = (itemId: string, currentQty: number) => {
    if (currentQty > 1) {
      updateCartQuantity(itemId, currentQty - 1);
    } else {
      removeFromCart(itemId);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (paymentMethod === "Wallet" && user && user.walletBalance < totalAmount) {
      showToast("Insufficient wallet balance. Please top up first.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        paymentMethod,
        notes,
        orderType,
        tableNumber: orderType === "dining" ? tableNumber : undefined,
        scheduledTime: isScheduled ? scheduledTime : undefined,
      };

      const res = await api.post("/api/orders/create", payload);
      showToast("Order placed successfully!", "success");
      
      // Clear local cart state
      await clearCart();
      await refreshUser();

      // Redirect to tracking page
      router.push(`/orders/${res.data._id}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to place order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading) return <LoadingSpinner fullPage />;

  return (
    <ProtectedRoute>
      <div className="container cart-page animate-fadeIn">
        <h1>Your Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="empty-cart card text-center stagger">
            <div className="empty-icon-wrapper">
              <ShoppingBag size={48} className="empty-icon" />
            </div>
            <h2>Your cart is empty</h2>
            <p>Add some delicious meals from the campus menu to get started.</p>
            <button onClick={() => router.push("/menu")} className="btn btn-primary mt-6">
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="cart-grid stagger">
            {/* Cart Items Column */}
            <div className="items-column">
              <div className="items-list card">
                <div className="list-header">
                  <h3>Selected Items ({items.length})</h3>
                  <button onClick={clearCart} className="btn btn-ghost btn-danger btn-sm">
                    Clear All
                  </button>
                </div>
                <div className="divider"></div>

                <div className="items-container">
                  {items.map((item: any) => (
                    <div key={item.menuItem._id} className="cart-item">
                      <div className="item-img-wrapper">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={item.menuItem.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60"} 
                          alt={item.menuItem.name} 
                        />
                      </div>
                      <div className="item-details">
                        <h4>{item.menuItem.name}</h4>
                        <span className="item-price">₹{item.price}</span>
                      </div>
                      <div className="item-actions">
                        <div className="quantity-controls">
                          <button 
                            onClick={() => handleQuantityDecrease(item.menuItem._id, item.quantity)}
                            className="qty-btn"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="qty-val">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.menuItem._id, item.quantity + 1)}
                            className="qty-btn"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.menuItem._id)} 
                          className="remove-btn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Options Column */}
            <div className="checkout-column">
              <form onSubmit={handleCheckout} className="checkout-card card glass">
                <h3>Order Options</h3>
                <div className="divider"></div>

                {/* Dining Option */}
                <div className="form-group">
                  <span className="form-label">Dining Mode</span>
                  <div className="dining-mode-tabs">
                    <button
                      type="button"
                      className={`mode-tab ${orderType === "takeaway" ? "active" : ""}`}
                      onClick={() => setOrderType("takeaway")}
                    >
                      🥡 Takeaway
                    </button>
                    <button
                      type="button"
                      className={`mode-tab ${orderType === "dining" ? "active" : ""}`}
                      onClick={() => setOrderType("dining")}
                    >
                      🍽️ Dine In
                    </button>
                  </div>
                </div>

                {orderType === "dining" && (
                  <div className="form-group animate-scaleIn">
                    <label className="form-label" htmlFor="tableNumber">Table Number</label>
                    <input
                      id="tableNumber"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Table A-4"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Pre-ordering Option */}
                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span className="form-label mb-0">Pre-order / Schedule Pickup</span>
                  </label>
                </div>

                {isScheduled && (
                  <div className="form-group animate-scaleIn">
                    <label className="form-label" htmlFor="scheduledTime">Select Pickup Time</label>
                    <input
                      id="scheduledTime"
                      type="datetime-local"
                      className="form-input"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Special Instructions */}
                <div className="form-group">
                  <label className="form-label" htmlFor="notes">Special Instructions</label>
                  <div className="input-with-icon">
                    <FileText className="textarea-icon" size={16} />
                    <textarea
                      id="notes"
                      className="form-input textarea-input"
                      placeholder="No onions, extra spicy, etc."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="form-group">
                  <span className="form-label">Payment Method</span>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  >
                    <option value="Wallet">Wallet (Balance: ₹{user?.walletBalance.toFixed(2)})</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Cash">Cash on Pickup</option>
                  </select>
                </div>

                {/* Wallet Balance Warning */}
                {paymentMethod === "Wallet" && user && user.walletBalance < totalAmount && (
                  <div className="balance-warning animate-scaleIn">
                    ⚠️ Insufficient balance! Please top up your wallet or select another payment method.
                  </div>
                )}

                <div className="divider"></div>

                {/* Order Summary */}
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="summary-row total">
                  <span>Grand Total</span>
                  <span>₹{totalAmount}</span>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block btn-lg mt-6"
                  disabled={submitting || (paymentMethod === "Wallet" && !!user && user.walletBalance < totalAmount)}
                >
                  {submitting ? <LoadingSpinner size="sm" /> : "Place Order"}
                </button>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
          .cart-page {
            padding-top: 40px;
          }
          .cart-page h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 32px;
          }
          .empty-cart {
            padding: 80px 24px;
            max-width: 500px;
            margin: 0 auto;
          }
          .empty-icon-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: var(--color-primary-light);
            color: var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          .cart-grid {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 32px;
            align-items: flex-start;
          }
          .list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .items-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .cart-item {
            display: grid;
            grid-template-columns: 80px 1fr auto;
            gap: 20px;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--color-border);
          }
          .cart-item:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .item-img-wrapper {
            width: 80px;
            height: 60px;
            border-radius: var(--radius-sm);
            overflow: hidden;
            border: 1px solid var(--color-border);
          }
          .item-img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .item-details h4 {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .item-price {
            font-size: 14px;
            font-weight: 700;
            color: var(--color-primary);
          }
          .item-actions {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .quantity-controls {
            display: flex;
            align-items: center;
            background: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            overflow: hidden;
          }
          .qty-btn {
            padding: 8px 12px;
            color: var(--color-text-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qty-btn:hover {
            background: var(--color-surface-hover);
            color: var(--color-text);
          }
          .qty-val {
            font-size: 13px;
            font-weight: 700;
            padding: 0 4px;
            min-width: 20px;
            text-align: center;
          }
          .remove-btn {
            color: var(--color-text-muted);
            padding: 6px;
          }
          .remove-btn:hover {
            color: var(--color-error);
          }
          .dining-mode-tabs {
            display: flex;
            gap: 8px;
          }
          .mode-tab {
            flex: 1;
            padding: 10px;
            font-size: 13px;
            font-weight: 600;
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
            color: var(--color-text-secondary);
            background: var(--color-bg-tertiary);
            text-align: center;
          }
          .mode-tab.active {
            border-color: var(--color-primary);
            background: var(--color-primary-light);
            color: var(--color-primary);
          }
          .textarea-icon {
            position: absolute;
            left: 14px;
            top: 14px;
            color: var(--color-text-muted);
          }
          .textarea-input {
            padding-left: 42px !important;
            resize: none;
          }
          .balance-warning {
            padding: 12px;
            border-radius: var(--radius-sm);
            background: var(--color-error-light);
            color: var(--color-error);
            font-size: 12px;
            font-weight: 500;
            margin-top: 12px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: var(--color-text-secondary);
            margin-bottom: 10px;
          }
          .summary-row.total {
            font-size: 18px;
            font-weight: 800;
            color: var(--color-text);
            margin-top: 16px;
          }
          .btn-block {
            width: 100%;
          }
          @media (max-width: 900px) {
            .cart-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
