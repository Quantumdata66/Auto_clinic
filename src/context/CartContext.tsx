"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Product, StockStatus } from "@/types";

export interface CartItemState {
  product: Product;
  quantity: number;
}

interface StoredCartItem {
  productId: string;
  quantity: number;
  productSnapshot: Product;
}

interface CartContextType {
  items: CartItemState[];
  itemCount: number;
  subtotalCents: number;
  isHydrated: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const STORAGE_KEY = "auto_clinic_cart_v1";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItemState[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredCartItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validated = parsed
            .filter((item) => item && item.productSnapshot && item.quantity > 0)
            .map((item) => ({
              product: item.productSnapshot,
              quantity: Math.max(1, Math.floor(item.quantity)),
            }));
          setItems(validated);
        }
      }
    } catch (err) {
      console.warn("Could not load cart from localStorage:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const payload: StoredCartItem[] = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        productSnapshot: item.product,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn("Could not persist cart to localStorage:", err);
    }
  }, [items, isHydrated]);

  const addItem = (product: Product, quantity = 1) => {
    if (quantity <= 0) return;
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          product, // refresh product snapshot
          quantity: newQty,
        };
        return updated;
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.floor(quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (productId: string): number => {
    const found = items.find((item) => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotalCents = useMemo(() => {
    return items.reduce((acc, item) => acc + item.product.priceCents * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalCents,
        isHydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a <CartProvider>");
  }
  return context;
};
