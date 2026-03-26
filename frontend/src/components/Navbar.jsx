import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart, User, Search, X, Moon, Sun, Menu,
  Package, LogOut, Settings, ChevronDown, Zap, MapPin
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartDrawer from "./cart/CartDrawer";

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { count } = useCart();
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? "shadow-2xl" : ""}`}
        style={{
          backgroundColor: scrolled ? "rgba(7,7,8,0.92)" : "var(--bg)",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.06)" : "transparent"}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-4 h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)", boxShadow: "0 4px 12px rgba(255,107,53,0.4)" }}>
                  Q
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[var(--bg)] animate-pulse" />
              </div>
              <span className="font-display font-bold text-lg hidden sm:block" style={{ color: "var(--text-primary)" }}>
                Quick<span style={{ color: "var(--brand)" }}>Cart</span>
              </span>
            </Link>

            {/* Location pill */}
            <button className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "var(--elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              <MapPin size={12} style={{ color: "var(--brand)" }} />
              Bengaluru
              <ChevronDown size={11} />
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl relative hidden md:block">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                className="input-theme pl-10 pr-10 py-2.5 text-sm"
                placeholder="Search stores, products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="flex items-center gap-1 ml-auto">
              {/* Theme toggle */}
              <button onClick={toggleTheme}
                className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                <div className="relative w-5 h-5 overflow-hidden">
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isDark ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}>
                    <Moon size={16} />
                  </div>
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${!isDark ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}>
                    <Sun size={16} style={{ color: "#f59e0b" }} />
                  </div>
                </div>
              </button>

              {/* Cart */}
              <button onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-xl transition-all hover:scale-110 active:scale-95 group"
                style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                <ShoppingCart size={20} className="group-hover:text-orange-400 transition-colors" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: "var(--brand)", animation: count > 0 ? "wiggle 0.4s ease" : "none" }}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>

              {/* Orders shortcut */}
              <Link to="/orders" className="hidden sm:flex p-2 rounded-xl transition-all hover:scale-110 items-center gap-1.5 text-sm font-medium"
                style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                <Package size={18} />
              </Link>

              {/* User menu */}
              {isLoggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105"
                    style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "linear-gradient(135deg, var(--brand), #ff8c5a)" }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden lg:block" style={{ color: "var(--text-primary)" }}>
                      {user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown size={14} style={{ color: "var(--text-muted)" }} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden shadow-2xl border py-1"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", animation: "scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)" }}>
                      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
                      </div>
                      {[
                        { to: "/profile", icon: User, label: "Profile" },
                        { to: "/orders", icon: Package, label: "My Orders" },
                        { to: "/settings", icon: Settings, label: "Settings" },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--hover)]"
                          style={{ color: "var(--text-secondary)" }}>
                          <Icon size={16} />
                          {label}
                        </Link>
                      ))}
                      <div className="border-t mt-1" style={{ borderColor: "var(--border)" }} />
                      <button onClick={() => { logout(); setUserMenuOpen(false); navigate("/"); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium w-full transition-colors"
                        style={{ color: "#ef4444" }}>
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ color: "var(--text-secondary)" }}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-brand text-sm px-4 py-2">
                    Join Free
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input className="input-theme pl-10 py-2.5 text-sm"
                placeholder="Search stores, products..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
          </div>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}