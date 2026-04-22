"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface CartItem {
  _id?: string;
  menuItem: {
    _id: string;
    name: string;
    price: string | number;
    image?: string;
    availability?: boolean;
  };
  quantity: number;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  totalAmount: number;
  loading: boolean;
  addToCart: (menuItemId: string, quantity?: number) => Promise<void>;
  updateCartQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (menuItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) {
      setItems([]);
      setTotalAmount(0);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get("/api/cart");
      setItems(response.data.items || []);
      setTotalAmount(response.data.totalAmount || 0);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (menuItemId: string, quantity: number = 1) => {
    if (!user) {
      showToast("Please log in to add items to your cart", "warning");
      return;
    }
    try {
      const response = await api.post("/api/cart/add", { menuItemId, quantity });
      setItems(response.data.items);
      setTotalAmount(response.data.totalAmount);
      showToast("Item added to cart", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add item to cart", "error");
    }
  };

  const updateCartQuantity = async (menuItemId: string, quantity: number) => {
    try {
      const response = await api.put("/api/cart/update", { menuItemId, quantity });
      setItems(response.data.items);
      setTotalAmount(response.data.totalAmount);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update quantity", "error");
    }
  };

  const removeFromCart = async (menuItemId: string) => {
    try {
      const response = await api.delete(`/api/cart/remove/${menuItemId}`);
      setItems(response.data.items);
      setTotalAmount(response.data.totalAmount);
      showToast("Item removed from cart", "info");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to remove item", "error");
    }
  };

  const clearCart = async () => {
    try {
      const response = await api.delete("/api/cart/clear");
      setItems(response.data.items || []);
      setTotalAmount(response.data.totalAmount || 0);
      showToast("Cart cleared", "info");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to clear cart", "error");
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalAmount,
        loading,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
