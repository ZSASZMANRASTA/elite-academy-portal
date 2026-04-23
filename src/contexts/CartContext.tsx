import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type CartItem = {
  id: string;
  type: "product" | "bundle";
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image_url?: string;
};

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string, variant?: string) => void;
  updateQty: (id: string, variant: string | undefined, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "aja_cart";

const key = (id: string, variant?: string) => `${id}__${variant ?? ""}`;

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const k = key(item.id, item.variant);
      const existing = prev.find((i) => key(i.id, i.variant) === k);
      if (existing) {
        return prev.map((i) =>
          key(i.id, i.variant) === k ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string, variant?: string) => {
    setItems((prev) => prev.filter((i) => key(i.id, i.variant) !== key(id, variant)));
  }, []);

  const updateQty = useCallback((id: string, variant: string | undefined, qty: number) => {
    if (qty < 1) { removeItem(id, variant); return; }
    setItems((prev) =>
      prev.map((i) => key(i.id, i.variant) === key(id, variant) ? { ...i, quantity: qty } : i)
    );
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
