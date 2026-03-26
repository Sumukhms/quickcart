import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronRight, RefreshCw } from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonCard, EmptyState } from "../components/ui/Skeleton";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: Clock },
  confirmed: { label: "Confirmed", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: CheckCircle },
  preparing: { label: "Preparing", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: Package },
  out_for_delivery: { label: "Out for Delivery", color: "#f97316", bg: "rgba(249,115,22,0.12)", icon: Truck },
  delivered: { label: "Delivered", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();

  useEffect(() => { if (isLoggedIn) fetchOrders(); else setLoading(false); }, [isLoggedIn]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/my");
      setOrders(data);
    } catch {
      // Demo
      setOrders([
        {
          _id: "o1", status: "delivered", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          storeId: { name: "FreshMart Express", image: "" },
          items: [{ name: "Amul Milk", qty: 2 }, { name: "Bread", qty: 1 }],
          totalPrice: 101, deliveryFee: 20, deliveryAddress: "Koramangala, Bengaluru",
        },
        {
          _id: "o2", status: "out_for_delivery", createdAt: new Date(Date.now() - 3600000).toISOString(),
          storeId: { name: "Biryani House", image: "" },
          items: [{ name: "Chicken Biryani", qty: 2 }],
          totalPrice: 360, deliveryFee: 20, deliveryAddress: "Indiranagar, Bengaluru",
        },
        {
          _id: "o3", status: "pending", createdAt: new Date().toISOString(),
          storeId: { name: "MedPlus Quick", image: "" },
          items: [{ name: "Paracetamol", qty: 2 }, { name: "Cough Syrup", qty: 1 }],
          totalPrice: 145, deliveryFee: 0, deliveryAddress: "HSR Layout, Bengaluru",
        },
      ]);
    } finally { setLoading(false); }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen page-enter flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <EmptyState icon="🔒" title="Sign in required" subtitle="Please sign in to view your orders"
        action={<Link to="/login" className="btn btn-brand text-sm">Sign In</Link>} />
    </div>
  );

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>My Orders</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={fetchOrders} className="p-2.5 rounded-xl transition-all hover:rotate-180 duration-500"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon="📦" title="No orders yet" subtitle="Your past and current orders will appear here"
            action={<Link to="/" className="btn btn-brand text-sm">Browse Stores</Link>} />
        ) : (
          <div className="space-y-3 stagger">
            {orders.map(order => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = status.icon;
              const date = new Date(order.createdAt);
              
              return (
                <div key={order._id} className="card-hover p-5 cursor-pointer"
                  style={{ backgroundColor: "var(--card)" }}>
                  
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: "var(--elevated)" }}>
                        🏪
                      </div>
                      <div>
                        <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                          {order.storeId?.name || "Store"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 tag text-xs" style={{ background: status.bg, color: status.color }}>
                      <Icon size={12} />
                      {status.label}
                    </span>
                  </div>

                  <div className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    {order.items.slice(0, 3).map(i => i.name).join(", ")}
                    {order.items.length > 3 && ` +${order.items.length - 3} more`}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                        ₹{(order.totalPrice + (order.deliveryFee || 0)).toFixed(0)}
                      </span>
                      <span className="text-xs ml-1.5" style={{ color: "var(--text-muted)" }}>
                        {order.items.reduce((s, i) => s + (i.quantity || i.qty || 1), 0)} items
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === "delivered" && (
                        <button className="btn btn-ghost text-xs py-1.5 px-3">Reorder</button>
                      )}
                      <Link to={`/order/${order._id}`} className="flex items-center gap-1 text-sm font-semibold"
                        style={{ color: "var(--brand)" }}>
                        Track <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}