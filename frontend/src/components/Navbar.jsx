import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Moon,
  Sun,
  Package,
  LogOut,
  Settings,
  ChevronDown,
  MapPin,
  LayoutDashboard,
  Truck,
  Home,
  ClipboardList,
  History,
  ShoppingBag,
  ArrowRight,
  Shield,
  Tag,
  BarChart3,  // inventory icon
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartDrawer from "./cart/CartDrawer";

function getNavLinks(user) {
  const storeShopLink = user?.storeId
    ? `/user/store/${user.storeId}`
    : "/user/home";

  return {
    customer: [
      { to: "/user/home",    icon: Home,         label: "Home" },
      { to: "/user/orders",  icon: Package,       label: "Orders" },
      { to: "/user/profile", icon: User,          label: "Profile" },
    ],
    store: [
      { to: storeShopLink,      icon: ShoppingBag,   label: "My Store" },
      { to: "/store/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/store/orders",    icon: ClipboardList, label: "Orders" },
      { to: "/store/products",  icon: Package,       label: "Products" },
      { to: "/store/inventory", icon: BarChart3,     label: "Inventory" },  // NEW
      { to: "/store/coupons",   icon: Tag,           label: "Coupons" },
      { to: "/store/settings",  icon: Settings,      label: "Settings" },
    ],
    delivery: [
      { to: "/user/home",           icon: Home,    label: "Browse" },
      { to: "/delivery/dashboard",  icon: Truck,   label: "Dashboard" },
      { to: "/delivery/active",     icon: MapPin,  label: "Active" },
      { to: "/delivery/history",    icon: History, label: "History" },
    ],
  };
}

const ROLE_BADGE = {
  customer: { label: "Customer", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  store:    { label: "Store",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  delivery: { label: "Delivery", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  admin:    { label: "Admin",    color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
};

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { count } = useCart();
  const { user, logout, isLoggedIn, homeRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartOpen,     setCartOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setUserMenuOpen(false); }, [location.pathname]);

  const NAV_LINKS  = getNavLinks(user);
  const menuLinks  = isLoggedIn ? NAV_LINKS[user?.role] || [] : [];
  const roleBadge  = user ? ROLE_BADGE[user.role] : null;
  const cartLabel  = user?.role === "store" ? "Store Cart" : user?.role === "delivery" ? "Delivery Cart" : "Your Cart";

  return (
    <>
      <nav
        className="sticky top-0 z-50 transition-all duration-400"
        style={{
          backgroundColor: scrolled ? "rgba(7,7,8,0.92)" : "var(--bg)",
          backdropFilter:  scrolled ? "blur(24px) saturate(180%)" : "none",
          borderBottom:    `1px solid ${scrolled ? "rgba(255,255,255,0.06)" : "transparent"}`,
          boxShadow:       scrolled ? "0 4px 30px rgba(0,0,0,0.4)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-3 h-16">

            {/* Logo */}
            <Link to={homeRoute} className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-white text-base transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)", boxShadow: "0 4px 15px rgba(255,107,53,0.45)" }}
                >Q</div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2"
                  style={{ borderColor: "var(--bg)", animation: "pulseDot 2s infinite" }} />
              </div>
              <span className="font-display font-bold text-lg hidden sm:block" style={{ color: "var(--text-primary)" }}>
                Quick<span style={{ color: "var(--brand)" }}>Cart</span>
              </span>
            </Link>

            {/* Desktop nav links — truncate store links at md */}
            {isLoggedIn && (
              <nav className="hidden md:flex items-center gap-1 ml-2 overflow-x-auto scrollbar-hide">
                {menuLinks.slice(0, user?.role === "store" ? 5 : menuLinks.length).map(({ to, icon: Icon, label }) => {
                  const active = location.pathname === to || location.pathname.startsWith(to + "/");
                  return (
                    <Link key={`${to}-${label}`} to={to}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap"
                      style={{
                        background: active ? "rgba(255,107,53,0.1)" : "transparent",
                        color:      active ? "var(--brand)"          : "var(--text-secondary)",
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--elevated)"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <Icon size={15} />{label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-1.5 ml-auto">
              {/* Theme toggle */}
              <button onClick={toggleTheme}
                className="p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                {isDark ? <Moon size={16} /> : <Sun size={16} style={{ color: "#f59e0b" }} />}
              </button>

              {/* Cart */}
              {isLoggedIn && (
                <button onClick={() => setCartOpen(true)}
                  className="relative p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
                  style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}
                  title={cartLabel}>
                  <ShoppingCart size={20} />
                  {count > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))", boxShadow: "0 2px 8px rgba(255,107,53,0.5)", animation: "badgeBounce 0.5s ease", padding: "0 4px" }}>
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </button>
              )}

              {/* My Orders shortcut */}
              {isLoggedIn && (user?.role === "store" || user?.role === "delivery") && (
                <Link to="/user/orders"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: location.pathname === "/user/orders" ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                    color:      location.pathname === "/user/orders" ? "var(--brand)"          : "var(--text-secondary)",
                  }}>
                  <ShoppingBag size={15} />
                  <span className="hidden lg:block">My Orders</span>
                </Link>
              )}

              {/* User menu */}
              {isLoggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105"
                    style={{
                      background: "var(--elevated)",
                      border: `1px solid ${userMenuOpen ? "rgba(255,107,53,0.3)" : "var(--border)"}`,
                    }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--brand), #ff8c5a)" }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                        {user?.name?.split(" ")[0]}
                      </p>
                      {roleBadge && <p className="text-[10px] font-semibold" style={{ color: roleBadge.color }}>{roleBadge.label}</p>}
                    </div>
                    <ChevronDown size={14} style={{ color: "var(--text-muted)", transition: "transform 0.3s ease", transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-60 rounded-2xl overflow-hidden shadow-2xl border py-1 z-50"
                      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)", transformOrigin: "top right" }}>

                      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
                        {roleBadge && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: roleBadge.bg, color: roleBadge.color }}>
                            {roleBadge.label}
                          </span>
                        )}
                      </div>

                      {menuLinks.map(({ to, icon: Icon, label }) => (
                        <Link key={`menu-${to}-${label}`} to={to} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <Icon size={15} /> {label}
                        </Link>
                      ))}

                      {(user?.role === "store" || user?.role === "delivery") && (
                        <>
                          <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
                          <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                            Personal Shopping
                          </p>
                          {[
                            { to: "/user/home",   icon: Home,        label: "Browse Stores" },
                            { to: "/user/orders", icon: ShoppingBag, label: "My Orders" },
                            { to: "/user/cart",   icon: ShoppingCart, label: "My Cart" },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors"
                              style={{ color: "var(--text-secondary)" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <Icon size={15} /> {label}
                              {label === "My Cart" && count > 0 && (
                                <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: "rgba(255,107,53,0.15)", color: "var(--brand)" }}>{count}</span>
                              )}
                            </Link>
                          ))}
                        </>
                      )}

                      {user?.role === "admin" && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors"
                          style={{ color: "#8b5cf6" }}
                          onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <Shield size={15} /> Admin Panel
                        </Link>
                      )}

                      <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); navigate("/login"); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold w-full transition-colors"
                        style={{ color: "#ef4444" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-brand text-sm px-4 py-2">
                    Join Free <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isLoggedIn && (
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cartLabel={cartLabel} />
      )}
    </>
  );
}