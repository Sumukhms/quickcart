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
  BarChart3,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartDrawer from "./cart/CartDrawer";
import NotificationBell from "./ui/NotificationBell";

function getNavLinks(user) {
  const storeShopLink = user?.storeId
    ? `/user/store/${user.storeId}`
    : "/user/home";

  return {
    customer: [
      { to: "/user/home", icon: Home, label: "Home" },
      { to: "/user/orders", icon: Package, label: "Orders" },
      { to: "/user/profile", icon: User, label: "Profile" },
    ],
    store: [
      { to: storeShopLink, icon: ShoppingBag, label: "My Store" },
      { to: "/store/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/store/orders", icon: ClipboardList, label: "Orders" },
      { to: "/store/products", icon: Package, label: "Products" },
      { to: "/store/inventory", icon: BarChart3, label: "Inventory" },
      { to: "/store/coupons", icon: Tag, label: "Coupons" },
      { to: "/store/settings", icon: Settings, label: "Settings" },
    ],
    delivery: [
      { to: "/user/home", icon: Home, label: "Browse" },
      { to: "/delivery/dashboard", icon: Truck, label: "Dashboard" },
      { to: "/delivery/active", icon: MapPin, label: "Active" },
      { to: "/delivery/history", icon: History, label: "History" },
      { to: "/user/profile", icon: Settings, label: "Settings" },
    ],
  };
}

const ROLE_BADGE = {
  customer: { label: "Customer", color: "#16a34a", bg: "rgba(22,163,74,0.10)" },
  store:    { label: "Store",    color: "#2563eb", bg: "rgba(37,99,235,0.10)"  },
  delivery: { label: "Delivery", color: "#d97706", bg: "rgba(217,119,6,0.10)" },
  admin:    { label: "Admin",    color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
};

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { count } = useCart();
  const { user, logout, isLoggedIn, homeRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  const NAV_LINKS = getNavLinks(user);
  const menuLinks = isLoggedIn ? NAV_LINKS[user?.role] || [] : [];
  const roleBadge = user ? ROLE_BADGE[user.role] : null;
  const cartLabel =
    user?.role === "store"
      ? "Store Cart"
      : user?.role === "delivery"
        ? "Delivery Cart"
        : "Your Cart";

  return (
    <>
      <nav
        className="sticky top-0 z-50"
        style={{
          background: scrolled ? "var(--glass-bg)" : "transparent",
          backdropFilter: scrolled ? "blur(16px) saturate(160%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px) saturate(160%)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          boxShadow: scrolled ? "var(--shadow-nav)" : "none",
          transition: "box-shadow 0.2s ease, background 0.2s ease",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-3 h-[58px]">

            {/* ── Logo ── */}
            <Link
              to={homeRoute}
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: "var(--brand)",
                  boxShadow: "0 2px 8px rgba(255,107,53,0.35)",
                }}
              >
                Q
              </div>
              <span
                className="font-display font-bold text-[17px] hidden sm:block tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Quick<span style={{ color: "var(--brand)" }}>Cart</span>
              </span>
            </Link>

            {/* ── Desktop nav links ── */}
            {isLoggedIn && (
              <nav className="hidden md:flex items-center gap-0.5 ml-3 overflow-x-auto scrollbar-hide">
                {menuLinks
                  .slice(0, user?.role === "store" ? 6 : menuLinks.length)
                  .map(({ to, icon: Icon, label }) => {
                    const active =
                      location.pathname === to ||
                      location.pathname.startsWith(to + "/");
                    return (
                      <Link
                        key={`${to}-${label}`}
                        to={to}
                        className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 whitespace-nowrap"
                        style={{
                          background: active ? "var(--brand-dim)" : "transparent",
                          color: active ? "var(--brand)" : "var(--text-secondary)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "var(--elevated)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--text-secondary)";
                          }
                        }}
                      >
                        <Icon size={14} />
                        {label}
                        {active && (
                          <span
                            className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full"
                            style={{ background: "var(--brand)" }}
                          />
                        )}
                      </Link>
                    );
                  })}
              </nav>
            )}

            {/* ── Right side ── */}
            <div className="flex items-center gap-1 ml-auto">

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
                title={isDark ? "Light mode" : "Dark mode"}
              >
                {isDark
                  ? <Moon size={15} />
                  : <Sun size={15} style={{ color: "#d97706" }} />
                }
              </button>

              {/* Notification Bell */}
              {isLoggedIn && <NotificationBell />}

              {/* Cart */}
              {isLoggedIn && (
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative p-2 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    background: count > 0 ? "var(--brand-dim)" : "var(--elevated)",
                    color: count > 0 ? "var(--brand)" : "var(--text-secondary)",
                    border: `1px solid ${count > 0 ? "rgba(255,107,53,0.25)" : "var(--border)"}`,
                  }}
                  title={cartLabel}
                >
                  <ShoppingCart size={18} />
                  {count > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white px-1"
                      style={{
                        background: "var(--brand)",
                        boxShadow: "0 2px 6px rgba(255,107,53,0.4)",
                        animation: "badgeBounce 0.35s cubic-bezier(0.16,1,0.3,1) both",
                      }}
                    >
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </button>
              )}

              {/* My Orders shortcut (store/delivery roles) */}
              {isLoggedIn &&
                (user?.role === "store" || user?.role === "delivery") && (
                  <Link
                    to="/user/orders"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 hover:scale-105"
                    style={{
                      background:
                        location.pathname === "/user/orders"
                          ? "var(--brand-dim)"
                          : "var(--elevated)",
                      color:
                        location.pathname === "/user/orders"
                          ? "var(--brand)"
                          : "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <ShoppingBag size={14} />
                    <span className="hidden lg:block">My Orders</span>
                  </Link>
                )}

              {/* User menu */}
              {isLoggedIn ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg transition-all duration-150 hover:scale-105"
                    style={{
                      background: userMenuOpen ? "var(--brand-dim)" : "var(--elevated)",
                      border: `1px solid ${userMenuOpen ? "rgba(255,107,53,0.30)" : "var(--border)"}`,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[11px] font-black flex-shrink-0"
                      style={{ background: "var(--brand)" }}
                    >
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p
                        className="text-[13px] font-bold leading-tight"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {user?.name?.split(" ")[0]}
                      </p>
                    </div>
                    <ChevronDown
                      size={13}
                      style={{
                        color: "var(--text-muted)",
                        transition: "transform 0.2s ease",
                        transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-1.5 w-56 rounded-xl overflow-hidden py-1 z-50"
                      style={{
                        backgroundColor: "var(--card)",
                        backdropFilter: "blur(24px) saturate(180%)",
                        WebkitBackdropFilter: "blur(24px) saturate(180%)",
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-lg)",
                        animation: "scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                        transformOrigin: "top right",
                      }}
                    >
                      {/* User header */}
                      <div
                        className="px-3.5 py-2.5"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <p
                          className="font-bold text-sm leading-tight"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {user?.name}
                        </p>
                        <p
                          className="text-[11px] mt-0.5 truncate"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {user?.email}
                        </p>
                        {roleBadge && (
                          <span
                            className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: roleBadge.bg,
                              color: roleBadge.color,
                            }}
                          >
                            {roleBadge.label}
                          </span>
                        )}
                      </div>

                      {/* Menu links */}
                      {menuLinks.map(({ to, icon: Icon, label }) => (
                        <Link
                          key={`menu-${to}-${label}`}
                          to={to}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--hover)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--text-secondary)";
                          }}
                        >
                          <Icon size={14} style={{ flexShrink: 0 }} />
                          {label}
                        </Link>
                      ))}

                      {/* Personal shopping (store/delivery) */}
                      {(user?.role === "store" || user?.role === "delivery") && (
                        <>
                          <div
                            className="border-t my-1"
                            style={{ borderColor: "var(--border)" }}
                          />
                          <p
                            className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Shopping
                          </p>
                          {[
                            { to: "/user/home",   icon: Home,         label: "Browse Stores" },
                            { to: "/user/orders", icon: ShoppingBag,  label: "My Orders"     },
                            { to: "/user/cart",   icon: ShoppingCart, label: "My Cart"       },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors"
                              style={{ color: "var(--text-secondary)" }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--hover)";
                                e.currentTarget.style.color = "var(--text-primary)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "var(--text-secondary)";
                              }}
                            >
                              <Icon size={14} style={{ flexShrink: 0 }} />
                              {label}
                              {label === "My Cart" && count > 0 && (
                                <span
                                  className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    background: "var(--brand-dim)",
                                    color: "var(--brand)",
                                  }}
                                >
                                  {count}
                                </span>
                              )}
                            </Link>
                          ))}
                        </>
                      )}

                      {/* Admin */}
                      {user?.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors"
                          style={{ color: "#7c3aed" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <Shield size={14} /> Admin Panel
                        </Link>
                      )}

                      <div
                        className="border-t my-1"
                        style={{ borderColor: "var(--border)" }}
                      />
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          navigate("/login");
                        }}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium w-full transition-colors text-left"
                        style={{ color: "#dc2626" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(220,38,38,0.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <LogOut size={14} style={{ flexShrink: 0 }} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="hidden sm:block text-[13px] font-semibold px-3 py-2 rounded-lg transition-all hover:bg-[var(--elevated)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-brand text-[13px] px-4 py-2"
                  >
                    Get started
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isLoggedIn && (
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          cartLabel={cartLabel}
        />
      )}
    </>
  );
}
