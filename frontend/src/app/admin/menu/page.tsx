"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Image, 
  ToggleLeft, 
  ToggleRight 
} from "lucide-react";

interface MenuItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  availability: boolean;
  isVeg: boolean;
  preparationTime: number;
  stockQuantity: number;
  image?: string;
}

export default function AdminMenuPage() {
  const { showToast } = useToast();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Breakfast");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isVeg, setIsVeg] = useState(true);
  const [preparationTime, setPreparationTime] = useState("15");
  const [stockQuantity, setStockQuantity] = useState("999");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await api.get("/api/menu");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to load menu items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setCategory("Breakfast");
    setPrice("");
    setDescription("");
    setIsVeg(true);
    setPreparationTime("15");
    setStockQuantity("999");
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(String(item.price));
    setDescription(item.description);
    setIsVeg(item.isVeg);
    setPreparationTime(String(item.preparationTime));
    setStockQuantity(String(item.stockQuantity));
    setImageFile(null);
    setShowModal(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;

    try {
      await api.delete(`/api/menu/${id}`);
      showToast("Menu item deleted successfully", "success");
      fetchItems();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete item", "error");
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updatedAvail = !item.availability;
      await api.put(`/api/menu/${item._id}`, { availability: updatedAvail });
      showToast(`Item availability updated`, "success");
      fetchItems();
    } catch (err: any) {
      showToast("Failed to toggle availability", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("description", description);
      formData.append("isVeg", String(isVeg));
      formData.append("preparationTime", preparationTime);
      formData.append("stockQuantity", stockQuantity);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingItem) {
        await api.put(`/api/menu/${editingItem._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        showToast("Menu item updated successfully", "success");
      } else {
        await api.post("/api/menu", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        showToast("Menu item created successfully", "success");
      }

      setShowModal(false);
      fetchItems();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to submit form", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-menu-page animate-fadeIn">
      <div className="page-header mb-8 flex justify-between items-center">
        <div>
          <h1>Menu Items CRUD</h1>
          <p>Add, edit, or delete items from canteens menu. Set pricing and options.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} /> Add Menu Item
        </button>
      </div>

      {/* Main Table */}
      <div className="table-wrapper stagger">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Prep Time</th>
              <th>Stock</th>
              <th>Available</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="item-thumbnail">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60"} 
                      alt={item.name} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60";
                      }}
                    />
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className={`veg-badge-mini ${item.isVeg ? "veg" : "non-veg"}`}></span>
                    <strong>{item.name}</strong>
                  </div>
                </td>
                <td>{item.category}</td>
                <td>₹{item.price}</td>
                <td>{item.preparationTime} mins</td>
                <td>{item.stockQuantity}</td>
                <td>
                  <button onClick={() => handleToggleAvailability(item)} className="toggle-btn">
                    {item.availability ? (
                      <ToggleRight size={28} className="text-success" />
                    ) : (
                      <ToggleLeft size={28} className="text-muted" />
                    )}
                  </button>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="actions-cell">
                    <button onClick={() => openEditModal(item)} className="btn btn-ghost btn-sm">
                      <Edit size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteItem(item._id)} className="btn btn-ghost btn-danger btn-sm">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card glass animate-scaleIn">
            <div className="modal-header">
              <h3>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</h3>
              <button onClick={() => setShowModal(false)} className="close-modal-btn">
                <X size={20} />
              </button>
            </div>
            <div className="divider"></div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="itemName">Item Name</label>
                <input
                  id="itemName"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="itemCategory">Category</label>
                  <select
                    id="itemCategory"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Dessert">Dessert</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="itemPrice">Price (₹)</label>
                  <input
                    id="itemPrice"
                    type="number"
                    className="form-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="itemPrep">Prep Time (mins)</label>
                  <input
                    id="itemPrep"
                    type="number"
                    className="form-input"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="itemStock">Stock Quantity</label>
                  <input
                    id="itemStock"
                    type="number"
                    className="form-input"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="itemDesc">Description</label>
                <textarea
                  id="itemDesc"
                  className="form-input"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="form-label mb-0">🟢 Vegetarian Option</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="itemImg">Item Image File</label>
                <input
                  id="itemImg"
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="divider"></div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <LoadingSpinner size="sm" /> : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .item-thumbnail {
          width: 50px;
          height: 40px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 1px solid var(--color-border);
        }
        .item-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .veg-badge-mini {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .veg-badge-mini.veg { background: var(--color-success); }
        .veg-badge-mini.non-veg { background: var(--color-error); }
        .actions-cell {
          display: inline-flex;
          gap: 6px;
        }
        .toggle-btn {
          display: flex;
          align-items: center;
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
          max-width: 520px;
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
        .close-modal-btn:hover {
          color: var(--color-text);
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
        .text-success { color: var(--color-success); }
        .text-muted { color: var(--color-text-muted); }
      `}</style>
    </div>
  );
}
