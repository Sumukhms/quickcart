import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "../../../context/CartContext";
import { inventoryAPI } from "../../../api/api";

const DEFAULT_THRESHOLD = 10;

export function useInventory() {
  const { addToast } = useCart();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toggling, setToggling] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEdits, setBulkEdits] = useState({});

  const fetchInventory = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        const { data } = await inventoryAPI.get();
        setInventory(data);

        if (!data.isFood) {
          const alertsRes = await inventoryAPI.getAlerts();
          setAlerts(alertsRes.data || []);
        }
      } catch (err) {
        addToast(
          err.response?.data?.message || "Failed to load inventory",
          "error",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleUpdateStock = useCallback(async (productId, body) => {
    const { data } = await inventoryAPI.updateStock(productId, body);

    setInventory((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) => (p._id === productId ? data : p)),
      };
    });

    if (!data.available || data.stock <= 0) {
      const alertsRes = await inventoryAPI.getAlerts();
      setAlerts(alertsRes.data || []);
    }

    return data;
  }, []);

  const handleToggle = useCallback(
    async (productId) => {
      setToggling(productId);
      try {
        const { data } = await inventoryAPI.toggle(productId);

        setInventory((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            products: prev.products.map((p) =>
              p._id === productId ? data : p,
            ),
          };
        });

        addToast(
          data.available ? "Marked as available ✓" : "Marked as unavailable",
          data.available ? "success" : "info",
        );
      } catch (err) {
        addToast(err.response?.data?.message || "Failed to update", "error");
      } finally {
        setToggling(null);
      }
    },
    [addToast],
  );

  const handleBulkSave = useCallback(
    async (onClose = () => {}) => {
      const updates = Object.entries(bulkEdits)
        .map(([productId, stock]) => ({
          productId,
          stock: parseInt(stock, 10),
        }))
        .filter((u) => !Number.isNaN(u.stock) && u.stock >= 0);

      if (!updates.length) {
        setBulkMode(false);
        setBulkEdits({});
        onClose();
        return;
      }

      try {
        await inventoryAPI.bulkUpdate(updates);
        addToast(
          `Updated ${updates.length} item${updates.length > 1 ? "s" : ""} ✓`,
          "success",
        );
        setBulkEdits({});
        setBulkMode(false);
        fetchInventory(true);
        onClose();
      } catch (err) {
        addToast(err.response?.data?.message || "Bulk update failed", "error");
      }
    },
    [addToast, bulkEdits, fetchInventory],
  );

  const allProducts = inventory?.products || [];
  const threshold = inventory?.threshold ?? DEFAULT_THRESHOLD;
  const isFood = inventory?.isFood;

  const categories = useMemo(
    () => ["All", ...new Set(allProducts.map((product) => product.category))],
    [allProducts],
  );

  const filtered = useMemo(() => {
    return allProducts.filter((product) => {
      const matchSearch =
        !search || product.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "All" || product.category === catFilter;
      const stock = product.stock ?? 0;
      const matchStatus =
        statusFilter === "available"
          ? product.available && (isFood || stock > 0)
          : statusFilter === "low"
            ? product.available && stock > 0 && stock <= threshold
            : statusFilter === "out"
              ? !product.available || (!isFood && stock <= 0)
              : true;
      return matchSearch && matchCat && matchStatus;
    });
  }, [allProducts, search, catFilter, statusFilter, threshold, isFood]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, product) => {
      if (!acc[product.category]) acc[product.category] = [];
      acc[product.category].push(product);
      return acc;
    }, {});
  }, [filtered]);

  return {
    inventory,
    loading,
    refreshing,
    search,
    setSearch,
    catFilter,
    setCatFilter,
    statusFilter,
    setStatusFilter,
    toggling,
    bulkMode,
    setBulkMode,
    bulkEdits,
    setBulkEdits,
    alerts,
    fetchInventory,
    handleUpdateStock,
    handleToggle,
    handleBulkSave,
    allProducts,
    categories,
    filtered,
    grouped,
  };
}
