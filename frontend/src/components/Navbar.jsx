import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart, User, Moon, Sun, Package, LogOut,
  Settings, ChevronDown, MapPin, LayoutDashboard,
  Truck, Store, Home, ClipboardList, History,
  ShoppingBag, ArrowRight
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartDrawer from "./cart/CartDrawer";

const NAV_LINKS = {
  customer: [
    { to: "/user/home",    icon: Home,          label: "Home" },
    { to: "/user/orders",  icon: Package,        label: "Orders" },
    { to: "/user/profile", icon: User,           label: "Profile" },
  ],
  store: [
    { to: "/store/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/store/orders",    icon: ClipboardList,   label: "Orders" },
    { to: "/store/products",  icon: Store,           label: "Products" },
    { to: "/store/settings",  icon: Settings,        label: "Settings" },
  ],
  delivery: [
    { to: "/delivery/dashboard", icon: Truck,   label: "Dashboard" },
    { to: "/delivery/active",    icon: MapPin,  label: "Active" },
    { to: "/delivery/history",   icon: History, label: "History" },
  ],
};

const ROLE_BADGE = {
  customer: { label: "Customer",  color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  store:    { label: "Store",     color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  delivery: { label: "Delivery",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
};

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { count } = useCart();
  const { user, logout, isLoggedIn, isCustomer, homeRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setUserMenuOpen(false); }, [location.pathname]);

  const menuLinks = isLoggedIn ? (NAV_LINKS[user?.role] || []) : [];
  const roleBadge = user ? ROLE_BADGE[user.role] : null;

  return (
    <>
      <nav className="sticky top-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(7,7,8,0.94)" : "var(--bg)",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.06)" : "transparent"}`,
          boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.3)" : "none",
        }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-3 h-16">

            {/* Logo */}
            <Link to={homeRoute} className="flex items-center gap-2 flex-shrink-0 group">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm transition-transform group-hover:scale-110"
                  style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)", boxShadow: "0 4px 12px rgba(255,107,53,0.4)" }}>
                  Q
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 animate-pulse"
                  style={{ borderColor: "var(--bg)" }} />
              </div>
              <span className="font-display font-bold text-lg hidden sm:block" style={{ color: "var(--text-primary)" }}>
                Quick<span style={{ color: "var(--brand)" }}>Cart</span>
              </span>
            </Link>

            {/* Role-based nav links (desktop) */}
            {isLoggedIn && (
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {menuLinks.map(({ to, icon: Icon, label }) => {
                  const active = location.pathname === to;
                  return (
                    <Link key={to} to={to}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: active ? "rgba(255,107,53,0.1)" : "transparent",
                        color: active ? "var(--brand)" : "var(--text-secondary)",
                      }}
                      onMouseEnter={e => !active && (e.currentTarget.style.background = "var(--elevated)")}
                      onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}>
                      <Icon size={15} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-1 ml-auto">
              {/* Theme toggle */}
              <button onClick={toggleTheme}
                className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                {isDark ? <Moon size={16} /> : <Sun size={16} style={{ color: "#f59e0b" }} />}
              </button>

              {/* Cart — only for customers */}
              {isCustomer && (
                <button onClick={() => setCartOpen(true)}
                  className="relative p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                  <ShoppingCart size={20} />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: "var(--brand)" }}>
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </button>
              )}

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
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                        {user?.name?.split(" ")[0]}
                      </p>
                      {roleBadge && (
                        <p className="text-[10px] font-semibold" style={{ color: roleBadge.color }}>
                          {roleBadge.label}
                        </p>
                      )}
                    </div>
                    <ChevronDown size={14} style={{ color: "var(--text-muted)" }}
                      className={`transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl border py-1 z-50"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", animation: "scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)" }}>
                      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
                        {roleBadge && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: roleBadge.bg, color: roleBadge.color }}>
                            {roleBadge.label}
                          </span>
                        )}
                      </div>

                      {menuLinks.map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <Icon size={15} />{label}
                        </Link>
                      ))}

                      <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); navigate("/login"); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium w-full transition-colors"
                        style={{ color: "#ef4444" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80"
                    style={{ color: "var(--text-secondary)" }}>Sign In</Link>
                  <Link to="/register" className="btn btn-brand text-sm px-4 py-2">
                    Join Free <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isCustomer && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
    </>
  );
}