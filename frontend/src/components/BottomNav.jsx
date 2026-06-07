import { Home, ShoppingBag, User, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function BottomNav() {
  const { pathname } = useLocation();
  const { count } = useCart();
  const { user, isLoggedIn } = useAuth();

  // Only show for logged-in customers, not for store/delivery partners
  if (!isLoggedIn || user?.role === "store" || user?.role === "delivery")
    return null;

  const links = [
    { to: "/user/home", icon: Home, label: "Home" },
    { to: "/user/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/user/cart", icon: ShoppingCart, label: "Cart", badge: count },
    { to: "/user/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-50"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center justify-around px-2">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-col items-center py-3 px-1 flex-1 transition-all hover:scale-105 active:scale-95"
              title={label}
            >
              <div className="relative">
                <Icon
                  size={20}
                  style={{
                    color: active ? "var(--brand)" : "var(--text-muted)",
                    transition: "all 0.2s ease",
                  }}
                />
                {badge > 0 && (
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                    style={{
                      background: "var(--brand)",
                      animation: "badgeBounce 0.6s ease-out",
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold mt-1 leading-none"
                style={{
                  color: active ? "var(--brand)" : "var(--text-muted)",
                  transition: "all 0.2s ease",
                }}
              >
                {label}
              </span>
              {active && (
                <div
                  className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{
                    background: "var(--brand)",
                    animation: "slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
