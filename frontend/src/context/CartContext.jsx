import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartStore, setCartStore] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const addToCart = useCallback((product, store) => {
    if (cartStore && cartStore._id !== store._id) {
      addToast("Clear cart first to add from another store", "error");
      return false;
    }
    setCartStore(store);
    setCartItems(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
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
    setCartItems(prev => prev.map(i => i._id === productId ? { ...i, qty } : i));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartStore(null);
  }, []);

  const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ cartItems, cartStore, total, count, toasts, addToCart, removeFromCart, updateQty, clearCart, addToast }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);