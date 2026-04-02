import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
const CART_KEY = "qc-cart-v2";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [], store: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) return { items: [], store: null };
    return parsed;
  } catch {
    return { items: [], store: null };
  }
}

function saveCart(items, store) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({ items, store }));
  } catch { /* quota exceeded */ }
}

/** Safely extract a string ID from a store reference (object or string) */
function extractStoreId(storeRef) {
  if (!storeRef) return null;
  if (typeof storeRef === "string") return storeRef;
  // MongoDB ObjectId or plain object with _id
  if (storeRef._id) {
    return typeof storeRef._id === "object" && storeRef._id.toString
      ? storeRef._id.toString()
      : String(storeRef._id);
  }
  // Fallback: if it's some other object, return null to avoid "[object Object]"
  return null;
}

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();

  const [cartItems, setCartItems] = useState(() => loadCart().items);
  const [cartStore, setCartStore] = useState(() => loadCart().store);
  const [toasts,    setToasts]    = useState([]);

  // Persist on every change
  useEffect(() => {
    saveCart(cartItems, cartStore);
  }, [cartItems, cartStore]);

  // Clear cart on logout
  useEffect(() => {
    if (!isLoggedIn) {
      setCartItems([]);
      setCartStore(null);
      localStorage.removeItem(CART_KEY);
    }
  }, [isLoggedIn]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const addToCart = useCallback((product, store) => {
    const storeId     = extractStoreId(store);
    const cartStoreId = extractStoreId(cartStore);

    if (cartStoreId && storeId && cartStoreId !== storeId) {
      addToast("Clear your cart before adding items from a different store", "error");
      return false;
    }

    // Prefer the freshest full store object; keep existing if new ref has no _id
    const storeToSet = storeId ? store : cartStore;
    setCartStore(storeToSet);

    setCartItems(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) {
        return prev.map(i =>
          i._id === product._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });

    addToast(`${product.name} added to cart ✓`, "success");
    return true;
  }, [cartStore, addToast]);

  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i._id !== productId);
      if (updated.length === 0) setCartStore(null);
      return updated;
    });
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCartItems(prev => prev.map(i =>
      i._id === productId ? { ...i, qty } : i
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartStore(null);
    localStorage.removeItem(CART_KEY);
  }, []);

  const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{
      cartItems, cartStore, total, count, toasts,
      addToCart, removeFromCart, updateQty, clearCart, addToast,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);