"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/context/ToastContext";
import { 
  Wallet, 
  Send, 
  ArrowUpCircle, 
  RefreshCw, 
  History, 
  Award, 
  ShieldCheck, 
  Lock,
  Plus
} from "lucide-react";

interface Transaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);

  // Form States
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferPin, setTransferPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [redeemPointsAmount, setRedeemPointsAmount] = useState("");

  const [submittingRecharge, setSubmittingRecharge] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [submittingPin, setSubmittingPin] = useState(false);
  const [submittingRedeem, setSubmittingRedeem] = useState(false);

  const fetchWalletDetails = async () => {
    try {
      const pinStatusRes = await api.get("/api/wallet/pin-status");
      setHasPin(pinStatusRes.data.hasPIN);

      const txRes = await api.get("/api/wallet/transactions");
      setTransactions(txRes.data);
    } catch (err) {
      console.error("Failed to load wallet details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rechargeAmount || Number(rechargeAmount) <= 0) return;

    setSubmittingRecharge(true);
    try {
      await api.post("/api/wallet/recharge", { amount: Number(rechargeAmount) });
      showToast(`Successfully recharged ₹${rechargeAmount}!`, "success");
      setRechargeAmount("");
      await refreshUser();
      fetchWalletDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Recharge failed", "error");
    } finally {
      setSubmittingRecharge(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || !/^\d{4}$/.test(newPin)) {
      showToast("PIN must be exactly 4 digits", "error");
      return;
    }

    setSubmittingPin(true);
    try {
      await api.post("/api/wallet/set-pin", { pin: newPin });
      showToast("Wallet PIN set successfully!", "success");
      setNewPin("");
      setHasPin(true);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to set PIN", "error");
    } finally {
      setSubmittingPin(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEmail || !transferAmount || !transferPin) return;

    setSubmittingTransfer(true);
    try {
      await api.post("/api/wallet/transfer", {
        recipientEmail: transferEmail,
        amount: Number(transferAmount),
        pin: transferPin,
      });
      showToast(`Successfully transferred ₹${transferAmount} to ${transferEmail}`, "success");
      setTransferEmail("");
      setTransferAmount("");
      setTransferPin("");
      await refreshUser();
      fetchWalletDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Transfer failed", "error");
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const handleRedeemPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = Number(redeemPointsAmount);
    if (!pts || pts < 100) {
      showToast("Minimum 100 points required to redeem", "error");
      return;
    }

    setSubmittingRedeem(true);
    try {
      await api.post("/api/wallet/redeem-points", { points: pts });
      showToast("Points redeemed successfully!", "success");
      setRedeemPointsAmount("");
      await refreshUser();
      fetchWalletDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to redeem points", "error");
    } finally {
      setSubmittingRedeem(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <ProtectedRoute>
      <div className="container wallet-page animate-fadeIn">
        <div className="page-header">
          <h1>My Student Wallet</h1>
          <p>Manage campus funds, transfer balance to peers, and redeem loyalty points</p>
        </div>

        {/* Dashboard grid */}
        <div className="wallet-grid stagger">
          {/* Left Cards */}
          <div className="left-panel">
            {/* Balance Card */}
            <div className="card balance-big-card glass">
              <div className="balance-header">
                <div className="icon-wrapper">
                  <Wallet size={24} className="text-primary" />
                </div>
                <span>Current Balance</span>
              </div>
              <span className="balance-value">₹{user?.walletBalance.toFixed(2)}</span>
            </div>

            {/* Loyalty points card */}
            <div className="card points-card">
              <div className="points-header">
                <div className="icon-wrapper">
                  <Award size={20} className="text-amber-500" />
                </div>
                <span>Loyalty Rewards Points</span>
              </div>
              <span className="points-value">{user?.loyaltyPoints} Pts</span>
              <p className="points-desc">100 points can be redeemed for ₹10 cashback.</p>

              {user && user.loyaltyPoints >= 100 && (
                <form onSubmit={handleRedeemPoints} className="redeem-form">
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Points to redeem (e.g. 100)"
                    value={redeemPointsAmount}
                    onChange={(e) => setRedeemPointsAmount(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" disabled={submittingRedeem}>
                    {submittingRedeem ? "Redeeming..." : "Redeem"}
                  </button>
                </form>
              )}
            </div>

            {/* Set PIN if missing */}
            {!hasPin && (
              <div className="card pin-setting-card">
                <div className="pin-header">
                  <Lock size={20} className="text-orange-500" />
                  <h4>Setup Secure Wallet PIN</h4>
                </div>
                <p>Set a 4-digit numeric security PIN to authorize peer-to-peer wallet transfers.</p>
                <form onSubmit={handleSetPin} className="pin-form mt-4">
                  <input
                    type="password"
                    maxLength={4}
                    pattern="\d{4}"
                    className="form-input text-center"
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={submittingPin}>
                    Set Security PIN
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Forms */}
          <div className="right-panel">
            {/* Recharge Wallet */}
            <div className="card form-card">
              <h3><ArrowUpCircle size={18} className="text-success" /> Recharge Wallet</h3>
              <div className="divider"></div>
              <form onSubmit={handleRecharge} className="wallet-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="rechargeAmount">Amount to Add (₹)</label>
                  <input
                    id="rechargeAmount"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 500"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={submittingRecharge}>
                  {submittingRecharge ? <LoadingSpinner size="sm" /> : <><Plus size={16} /> Add Funds</>}
                </button>
              </form>
            </div>

            {/* Peer to Peer Transfer */}
            {hasPin && (
              <div className="card form-card">
                <h3><Send size={18} className="text-primary" /> Peer Transfer</h3>
                <div className="divider"></div>
                <form onSubmit={handleTransfer} className="wallet-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="transferEmail">Recipient Student Email</label>
                    <input
                      id="transferEmail"
                      type="email"
                      className="form-input"
                      placeholder="student@college.edu"
                      value={transferEmail}
                      onChange={(e) => setTransferEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transferAmount">Amount (₹)</label>
                    <input
                      id="transferAmount"
                      type="number"
                      className="form-input"
                      placeholder="e.g. 100"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transferPin">4-digit Security PIN</label>
                    <input
                      id="transferPin"
                      type="password"
                      maxLength={4}
                      className="form-input text-center"
                      placeholder="••••"
                      value={transferPin}
                      onChange={(e) => setTransferPin(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-full" disabled={submittingTransfer}>
                    {submittingTransfer ? <LoadingSpinner size="sm" /> : "Transfer Funds"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History Section */}
        <section className="section history-section stagger">
          <h2><History size={20} className="text-primary" /> Wallet Activity Log</h2>
          <div className="table-wrapper mt-6">
            {transactions.length === 0 ? (
              <div className="text-center p-8 text-secondary">
                No transaction activity logged yet.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td>{new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}</td>
                      <td>
                        <span className={`badge ${tx.type === "credit" ? "badge-success" : "badge-error"}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td>{tx.description}</td>
                      <td>
                        <strong className={tx.type === "credit" ? "text-success" : "text-danger"}>
                          {tx.type === "credit" ? "+" : "-"} ₹{tx.amount}
                        </strong>
                      </td>
                      <td>₹{tx.balanceAfter.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <style jsx>{`
          .wallet-page {
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
          .wallet-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            align-items: flex-start;
          }
          .left-panel, .right-panel {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .balance-big-card {
            padding: 32px;
            border-left: 6px solid var(--color-primary);
          }
          .balance-header {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            color: var(--color-text-secondary);
            margin-bottom: 16px;
          }
          .icon-wrapper {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--color-bg-tertiary);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .balance-value {
            font-size: 40px;
            font-weight: 800;
            color: var(--color-text);
          }
          .points-card {
            padding: 24px;
          }
          .points-header {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            color: var(--color-text-secondary);
            margin-bottom: 12px;
          }
          .points-value {
            font-size: 24px;
            font-weight: 800;
            color: var(--color-text);
          }
          .points-desc {
            font-size: 12px;
            color: var(--color-text-muted);
            margin-top: 4px;
          }
          .redeem-form {
            display: flex;
            gap: 12px;
            margin-top: 16px;
          }
          .pin-setting-card {
            padding: 24px;
            border-left: 4px solid var(--color-warning);
          }
          .pin-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }
          .pin-form {
            display: flex;
            gap: 12px;
          }
          .wallet-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .text-success { color: var(--color-success); }
          .text-danger { color: var(--color-error); }
          @media (max-width: 800px) {
            .wallet-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}
