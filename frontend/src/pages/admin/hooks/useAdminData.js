import { useState, useCallback } from "react";
import { adminAPI } from "../../../api/api";

export function useAdminData(addToast) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [payoutFilter, setPayoutFilter] = useState("pending");

  const load = useCallback(
    async (which) => {
      setLoading(true);
      try {
        if (which === "overview" || which === "all") {
          const { data } = await adminAPI.getStats();
          setStats(data);
        }
        if (which === "users" || which === "all") {
          const { data } = await adminAPI.getUsers({
            role: userRole || undefined,
            limit: 100,
          });
          setUsers(data.users || []);
        }
        if (which === "orders" || which === "all") {
          const { data } = await adminAPI.getOrders({
            status: orderStatus || undefined,
            limit: 100,
          });
          setOrders(data.orders || []);
        }
        if (which === "coupons" || which === "all") {
          const { data } = await adminAPI.getCoupons();
          setCoupons(Array.isArray(data) ? data : []);
        }
        if (which === "payouts" || which === "all") {
          const { data } = await adminAPI.getPayouts({ status: payoutFilter });
          setPayouts(data.requests || []);
        }
      } catch (e) {
        addToast(e.response?.data?.message || "Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    },
    [userRole, orderStatus, payoutFilter, addToast],
  );

  return {
    // State
    stats,
    users,
    orders,
    coupons,
    payouts,
    loading,
    userRole,
    orderStatus,
    payoutFilter,

    // Setters
    setStats,
    setUsers,
    setOrders,
    setCoupons,
    setPayouts,
    setUserRole,
    setOrderStatus,
    setPayoutFilter,

    // Functions
    load,
  };
}
