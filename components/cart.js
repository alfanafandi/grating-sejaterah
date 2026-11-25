"use client";

import { createContext, useContext, useEffect, useState } from "react";

const Cart = createContext(null);
const storageKey = "grating-cart-v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (Array.isArray(saved)) setItems(saved);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) sessionStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, ready]);

  function add(productId, quantity) {
    setItems((current) => current.some((item) => item.productId === productId)
      ? current.map((item) => item.productId === productId
        ? { ...item, quantity: Math.min(item.quantity + quantity, 99999) }
        : item)
      : [...current, { productId, quantity, notes: "" }]);
  }

  function update(productId, changes) {
    setItems((current) => current.map((item) => item.productId === productId ? { ...item, ...changes } : item));
  }

  function remove(productId) {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }

  return <Cart.Provider value={{ items, ready, add, update, remove, clear: () => setItems([]) }}>{children}</Cart.Provider>;
}

export const useCart = () => useContext(Cart);
