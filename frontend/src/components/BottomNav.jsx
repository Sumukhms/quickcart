import { Home, ShoppingBag, User, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function BottomNav() {
  const { pathname } = useLocation();
  const { count } = useCart();
  const { user, isLoggedIn } = useAuth();

  // Only show for logged-in customers
  if (!isLoggedIn || user?.role === "store" || user?.role === "delivery")
    return null;

  const links = [
    { to: "/user/home",    icon: Home,         label: "Home"    },
    { to: "/user/orders",  icon: ShoppingBag,  label: "Orders"  },
    { to: "/user/cart",    icon: ShoppingCart, label: "Cart", badge: count },
    { to: "/user/profile", icon: User,         label: "Profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-50"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch justify-around px-1">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center py-2.5 flex-1 gap-0.5 transition-opacity active:opacity-60"
              style={{ minHeight: 56 }}
              title={label}
            >
              {/* Active indicator — top bar, Blinkit style */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-b-full"
                  style={{ background: "var(--brand)" }}
                />
              )}

              <div className="relative">
                <Icon
                  size={21}
                  strokeWidth={active ? 2.25 : 1.75}
                  style={{
                    color: active ? "var(--brand)" : "var(--text-muted)",
                    transition: "color 0.15s ease",
                  }}
                />
                {badge > 0 && (
                  <span
                    className="absolute -top-2 -right-2.5 min-w-[16px] h-4 rounded-full text-[10px] font-black flex items-center justify-center text-white px-1"
                    style={{
                      background: "var(--brand)",
                      animation: "badgeBounce 0.35s cubic-bezier(0.16,1,0.3,1) both",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>

              <span
                className="text-[10px] font-semibold leading-none"
                style={{
                  color: active ? "var(--brand)" : "var(--text-muted)",
                  transition: "color 0.15s ease",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
