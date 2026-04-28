"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Plus, Edit2, Trash2, X, Check, Users } from "lucide-react";

interface Canteen {
  _id: string;
  name: string;
  location: string;
  description: string;
  openTime: string;
  closeTime: string;
  cuisine: string[];
  isOpen: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminCanteensPage() {
  const { showToast } = useToast();

  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add modal
  const [showModal, setShowModal] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null);

  // Assign manager modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
  const [managerUserId, setManagerUserId] = useState("");

  // Form States
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("20:00");
  const [cuisineStr, setCuisineStr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCanteensAndStaff = async () => {
    try {
      const cantRes = await api.get("/api/canteens");
      setCanteens(cantRes.data);

      const usersRes = await api.get("/api/auth/users");
      // filter managers or staff
      setStaffUsers(usersRes.data.users || usersRes.data);
    } catch (err) {
      console.error("Failed to load canteens data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanteensAndStaff();
  }, []);

  const openAddModal = () => {
    setEditingCanteen(null);
    setName("");
    setLocation("");
    setDescription("");
    setOpenTime("08:00");
    setCloseTime("20:00");
    setCuisineStr("");
    setShowModal(true);
  };

  const openEditModal = (c: Canteen) => {
    setEditingCanteen(c);
    setName(c.name);
    setLocation(c.location);
    setDescription(c.description);
    setOpenTime(c.openTime);
    setCloseTime(c.closeTime);
    setCuisineStr(c.cuisine.join(", "));
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this canteen? This cannot be undone.")) return;

    try {
      await api.delete(`/api/canteens/${id}`);
      showToast("Canteen deleted", "success");
      fetchCanteensAndStaff();
    } catch (err: any) {
      showToast("Failed to delete canteen", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const cuisines = cuisineStr.split(",").map((c) => c.trim()).filter(Boolean);

    try {
      const payload = {
        name,
        location,
        description,
        openTime,
        closeTime,
        cuisine: cuisines,
      };

      if (editingCanteen) {
        await api.put(`/api/canteens/${editingCanteen._id}`, payload);
        showToast("Canteen updated successfully", "success");
      } else {
        await api.post("/api/canteens", payload);
        showToast("Canteen created successfully", "success");
      }

      setShowModal(false);
      fetchCanteensAndStaff();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Submit failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCanteenId || !managerUserId) return;

    try {
      await api.post(`/api/canteens/${selectedCanteenId}/assign-manager`, {
        userId: managerUserId
      });
      showToast("Manager assigned successfully", "success");
      setShowAssignModal(false);
      fetchCanteensAndStaff();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to assign manager", "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-canteens-page animate-fadeIn">
      <div className="page-header mb-8 flex justify-between items-center">
        <div>
          <h1>Canteen Outlets CRUD</h1>
          <p>Register new food stalls, open/close stalls, and delegate staff managers.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Register Canteen
        </button>
      </div>

      <div className="table-wrapper stagger">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Cuisines</th>
              <th>Timings</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {canteens.map((c) => (
              <tr key={c._id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.location}</td>
                <td>{c.cuisine.join(", ")}</td>
                <td>{c.openTime} - {c.closeTime}</td>
                <td>
                  <span className={`badge ${c.isOpen ? "badge-success" : "badge-muted"}`}>
                    {c.isOpen ? "Open" : "Closed"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="actions-cell">
                    <button onClick={() => { setSelectedCanteenId(c._id); setManagerUserId(""); setShowAssignModal(true); }} className="btn btn-ghost btn-sm flex items-center gap-1">
                      <Users size={12} /> Manager
                    </button>
                    <button onClick={() => openEditModal(c)} className="btn btn-ghost btn-sm">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="btn btn-ghost btn-danger btn-sm">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card glass animate-scaleIn">
            <div className="modal-header">
              <h3>{editingCanteen ? "Edit Canteen Stall" : "Register Canteen Stall"}</h3>
              <button onClick={() => setShowModal(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>
            <div className="divider"></div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="cantName">Stall Name</label>
                <input
                  id="cantName"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cantLoc">Location Block</label>
                <input
                  id="cantLoc"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Block C, 1st Floor"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="cantOpen">Opens At</label>
                  <input
                    id="cantOpen"
                    type="text"
                    className="form-input"
                    placeholder="08:00"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="cantClose">Closes At</label>
                  <input
                    id="cantClose"
                    type="text"
                    className="form-input"
                    placeholder="20:00"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cantCuis">Cuisine Offerings (comma-separated)</label>
                <input
                  id="cantCuis"
                  type="text"
                  className="form-input"
                  placeholder="South Indian, Beverages, Chinese"
                  value={cuisineStr}
                  onChange={(e) => setCuisineStr(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cantDesc">Description</label>
                <textarea
                  id="cantDesc"
                  className="form-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="divider"></div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <LoadingSpinner size="sm" /> : "Save Stall"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Manager Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content card glass animate-scaleIn">
            <div className="modal-header">
              <h3>Assign Manager</h3>
              <button onClick={() => setShowAssignModal(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>
            <div className="divider"></div>

            <form onSubmit={handleAssignManager} className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Staff User</label>
                <select
                  className="form-select"
                  value={managerUserId}
                  onChange={(e) => setManagerUserId(e.target.value)}
                  required
                >
                  <option value="">Choose a staff member...</option>
                  {staffUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="divider"></div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .actions-cell {
          display: inline-flex;
          gap: 6px;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          width: 100%;
          max-width: 500px;
          padding: 32px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .close-modal-btn {
          color: var(--color-text-secondary);
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
