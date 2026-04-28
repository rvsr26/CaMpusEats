"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useToast } from "@/context/ToastContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { UserCheck, Shield, HelpCircle, ShieldAlert } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/auth/users");
      setUsers(res.data.users || res.data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUser?._id) {
      showToast("Cannot modify your own administration credentials", "warning");
      return;
    }

    try {
      await api.put(`/api/auth/users/${userId}/role`, { role: newRole });
      showToast(`User role promoted to ${newRole}`, "success");
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update role", "error");
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-users-page animate-fadeIn">
      <div className="page-header mb-8">
        <h1>Staff & Role Configuration</h1>
        <p>Manage campus credentials. Appoint students to cashier POS, staff KDS, or canteen managers.</p>
      </div>

      <div className="card stagger">
        <div className="table-header-row mb-4">
          <input
            type="text"
            className="form-input search-box"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Role badge</th>
                <th style={{ textAlign: "right" }}>Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${
                      ["admin", "super-admin"].includes(u.role) ? "badge-error" : 
                      ["manager"].includes(u.role) ? "badge-primary" : 
                      ["staff", "accountant"].includes(u.role) ? "badge-info" : "badge-muted"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <select
                      className="form-select role-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={u._id === currentUser?._id}
                    >
                      <option value="student">Student</option>
                      <option value="staff">Staff Cashier</option>
                      <option value="accountant">Accountant</option>
                      <option value="manager">Canteen Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .search-box {
          max-width: 320px;
        }
        .role-select {
          width: auto;
          display: inline-block;
          font-size: 12px;
          padding: 6px 12px;
        }
      `}</style>
    </div>
  );
}
