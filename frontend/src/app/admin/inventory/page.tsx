"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Plus, Edit2, Trash2, ArrowUp, AlertTriangle } from "lucide-react";

interface Ingredient {
  _id: string;
  name: string;
  unit: string;
  stockQty: number;
  lowStockThreshold: number;
  costPerUnit: number;
  isLow: boolean;
  isCritical: boolean;
}

export default function AdminInventoryPage() {
  const { showToast } = useToast();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [stockQty, setStockQty] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit inline States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");

  const fetchIngredients = async () => {
    try {
      const res = await api.get("/api/inventory/ingredients");
      setIngredients(res.data);
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmitting(true);
    try {
      await api.post("/api/inventory/ingredients", {
        name,
        unit,
        stockQty: Number(stockQty) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 0,
        costPerUnit: Number(costPerUnit) || 0
      });
      showToast("Ingredient added to inventory", "success");
      setName("");
      setStockQty("");
      setCostPerUnit("");
      fetchIngredients();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add ingredient", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQty = async (id: string) => {
    if (!editQty || Number(editQty) < 0) return;

    try {
      await api.put(`/api/inventory/ingredients/${id}`, {
        stockQty: Number(editQty)
      });
      showToast("Stock quantity updated", "success");
      setEditingId(null);
      setEditQty("");
      fetchIngredients();
    } catch (err: any) {
      showToast("Failed to update stock", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ingredient?")) return;

    try {
      await api.delete(`/api/inventory/ingredients/${id}`);
      showToast("Ingredient deleted", "success");
      fetchIngredients();
    } catch (err: any) {
      showToast("Failed to delete ingredient", "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-inventory-page animate-fadeIn">
      <div className="page-header mb-8">
        <h1>Raw Stock & Inventory</h1>
        <p>Maintain warehouse ingredients list. Track threshold values and low-stock alerts.</p>
      </div>

      <div className="inventory-grid stagger">
        {/* Left: Ingredients table list */}
        <div className="ingredients-list-panel">
          <div className="card">
            <h3>Ingredients List</h3>
            <div className="divider"></div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Available Stock</th>
                    <th>Threshold</th>
                    <th>Unit Cost</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing) => (
                    <tr key={ing._id}>
                      <td><strong>{ing.name}</strong></td>
                      <td>
                        {editingId === ing._id ? (
                          <div className="inline-edit-row">
                            <input
                              type="number"
                              className="form-input text-xs"
                              style={{ width: "80px" }}
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              required
                            />
                            <button onClick={() => handleUpdateQty(ing._id)} className="btn btn-primary btn-sm">
                              Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm">
                              X
                            </button>
                          </div>
                        ) : (
                          <span>{ing.stockQty} {ing.unit}</span>
                        )}
                      </td>
                      <td>{ing.lowStockThreshold} {ing.unit}</td>
                      <td>₹{ing.costPerUnit}</td>
                      <td>
                        {ing.isCritical ? (
                          <span className="badge badge-error flex items-center gap-1">
                            <AlertTriangle size={10} /> Out of Stock
                          </span>
                        ) : ing.isLow ? (
                          <span className="badge badge-warning flex items-center gap-1">
                            <AlertTriangle size={10} /> Low Stock
                          </span>
                        ) : (
                          <span className="badge badge-success">Sufficient</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions-cell">
                          <button
                            onClick={() => { setEditingId(ing._id); setEditQty(String(ing.stockQty)); }}
                            className="btn btn-ghost btn-sm"
                          >
                            <Edit2 size={12} /> Stock
                          </button>
                          <button onClick={() => handleDelete(ing._id)} className="btn btn-ghost btn-danger btn-sm">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Add Form Panel */}
        <div className="add-form-panel">
          <div className="card form-card">
            <h3>Add Ingredient</h3>
            <div className="divider"></div>
            <form onSubmit={handleCreate} className="inventory-form">
              <div className="form-group">
                <label className="form-label" htmlFor="ingName">Ingredient Name</label>
                <input
                  id="ingName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Milk, Rice, Tomatoes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ingUnit">Measurement Unit</label>
                <select
                  id="ingUnit"
                  className="form-select"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="kg">kilograms (kg)</option>
                  <option value="liters">liters (L)</option>
                  <option value="pcs">pieces (pcs)</option>
                  <option value="grams">grams (g)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ingQty">Initial Stock Qty</label>
                <input
                  id="ingQty"
                  type="number"
                  className="form-input"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ingThreshold">Low Stock Threshold</label>
                <input
                  id="ingThreshold"
                  type="number"
                  className="form-input"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ingCost">Cost per Unit (₹)</label>
                <input
                  id="ingCost"
                  type="number"
                  className="form-input"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? <LoadingSpinner size="sm" /> : <><Plus size={16} /> Add to Stock</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .inventory-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: flex-start;
        }
        .inline-edit-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .inventory-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .actions-cell {
          display: inline-flex;
          gap: 6px;
        }
        @media (max-width: 900px) {
          .inventory-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
