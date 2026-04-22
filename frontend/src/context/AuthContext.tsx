"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastContext";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student" | "staff" | "accountant" | "manager" | "admin" | "super-admin";
  walletBalance: number;
  loyaltyPoints: number;
  reputationPoints: number;
  currentStreak: number;
  badges: string[];
  totalCarbonSaved: number;
  sustainabilityLevel: number;
  referralCode?: string;
  referralCount: number;
  referralCredits: number;
  canteen?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Validate and get latest user profile from server
          const response = await api.get("/api/auth/profile");
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } catch (err) {
          console.error("Token verification failed", err);
          // If profile fails, it might be due to server/auth issues, logout will handle if 401
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      router.push("/auth/login");
    };

    window.addEventListener("auth-logout", handleLogoutEvent);
    return () => window.removeEventListener("auth-logout", handleLogoutEvent);
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      
      showToast("Welcome back, " + userData.name + "!", "success");
      
      if (["admin", "super-admin", "manager", "staff", "accountant"].includes(userData.role)) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Login failed. Please try again.";
      showToast(errorMsg, "error");
      throw err;
    }
  };

  const register = async (formData: any) => {
    try {
      await api.post("/api/auth/register", formData);
      showToast("Registration successful! Please check your email to verify.", "success");
      router.push("/auth/login");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Registration failed. Please try again.";
      showToast(errorMsg, "error");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {});
    } catch (err) {
      console.error("Error logging out from server", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      showToast("Logged out successfully.", "info");
      router.push("/auth/login");
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/api/auth/profile");
      updateUser(response.data.user);
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
