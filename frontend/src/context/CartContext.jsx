import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();
const CART_KEY = "qc-cart-v2";

// ── Safe storage helpers (guards against Safari private mode QuotaExceededError) ──
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota exceeded or private mode — silently continue (cart lives in memory)
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function loadCart() {
  try {
    const raw = safeGetItem(CART_KEY);
    if (!raw) return { items: [], store: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) return { items: [], store: null };
    return parsed;
  } catch {
    return { items: [], store: null };
  }
}

function saveCart(items, store) {
  safeSetItem(CART_KEY, JSON.stringify({ items, store }));
}

function extractStoreId(storeRef) {
  if (!storeRef) return null;
  if (typeof storeRef === "string") return storeRef;
  if (storeRef._id) {
    return typeof storeRef._id === "object" && storeRef._id.toString
      ? storeRef._id.toString()
      : String(storeRef._id);
  }
  return null;
}

export function CartProvider({ children }) {
  const { isLoggedIn } = useAuth();

  const [cartItems, setCartItems] = useState(() => loadCart().items);
  const [cartStore, setCartStore] = useState(() => loadCart().store);
  const [toasts,    setToasts]    = useState([]);

  useEffect(() => {
    saveCart(cartItems, cartStore);
  }, [cartItems, cartStore]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCartItems([]);
      setCartStore(null);
      safeRemoveItem(CART_KEY);
    }
  }, [isLoggedIn]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const addToCart = useCallback(
    (product, store) => {
      const storeId     = extractStoreId(store);
      const cartStoreId = extractStoreId(cartStore);

      if (cartStoreId && storeId && cartStoreId !== storeId) {
        addToast("Clear your cart before adding items from a different store", "error");
        return false;
      }

      const storeToSet = storeId ? store : cartStore;
      setCartStore(storeToSet);

      setCartItems((prev) => {
        const existing = prev.find((i) => i._id === product._id);
        if (existing) {
          return prev.map((i) =>
            i._id === product._id ? { ...i, qty: i.qty + 1 } : i
          );
        }
        return [...prev, { ...product, qty: 1 }];
      });

      addToast(`${product.name} added to cart ✓`, "success");
      return true;
    },
    [cartStore, addToast]
  );

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => {
      const updated = prev.filter((i) => i._id !== productId);
      if (updated.length === 0) setCartStore(null);
      return updated;
    });
  }, []);

  const updateQty = useCallback(
    (productId, qty) => {
      if (qty <= 0) { removeFromCart(productId); return; }
      setCartItems((prev) =>
        prev.map((i) => (i._id === productId ? { ...i, qty } : i))
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartStore(null);
    safeRemoveItem(CART_KEY);
  }, []);

  const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems, cartStore, total, count, toasts,
        addToCart, removeFromCart, updateQty, clearCart, addToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);