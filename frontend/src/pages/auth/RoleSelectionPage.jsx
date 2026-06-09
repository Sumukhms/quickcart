import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const ROLES = [
  {
    id: "customer",
    emoji: "👤",
    label: "Customer",
    sub: "Order from stores near you",
  },
  {
    id: "store",
    emoji: "🏪",
    label: "Store Owner",
    sub: "Manage your store & products",
  },
  {
    id: "delivery",
    emoji: "🛵",
    label: "Delivery",
    sub: "Earn by delivering orders",
  },
];

const VEHICLE_TYPES = [
  { id: "bike", emoji: "🏍️", label: "Bike" },
  { id: "scooter", emoji: "🛵", label: "Scooter" },
  { id: "cycle", emoji: "🚲", label: "Cycle" },
];

export default function RoleSelectionPage() {
  const [role, setRole] = useState("customer");
  const [vehicleType, setVehicleType] = useState("bike");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const handleSave = async () => {
    setError("");
    setLoading(true);

    try {
      const payload = { role };
      if (role === "delivery") payload.vehicleType = vehicleType;

      const { data } = await api.put("/auth/profile", payload);
      updateUser(data);
      localStorage.setItem("qc-user", JSON.stringify(data));
      navigate("/user/home", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update role. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
        <div className="mb-6">
          <p
            className="text-sm font-semibold uppercase tracking-[0.18em] mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Welcome to QuickCart
          </p>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            How will you use QuickCart?
          </h1>
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Choose your role to complete account setup before you access the
            app.
          </p>
          {user?.name && (
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Logged in as {user.name}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {ROLES.map(({ id, emoji, label, sub }) => (
            <button
              key={id}
              type="button"
              onClick={() => setRole(id)}
              className="rounded-3xl p-5 text-left transition-all duration-200 hover:scale-[1.01]"
              style={{
                background:
                  role === id ? "rgba(255,107,53,0.12)" : "var(--elevated)",
                border:
                  role === id
                    ? "2px solid var(--brand)"
                    : "1px solid var(--border)",
                color: role === id ? "var(--brand)" : "var(--text-primary)",
              }}
            >
              <div className="text-4xl mb-3">{emoji}</div>
              <div className="text-lg font-bold">{label}</div>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {sub}
              </p>
            </button>
          ))}
        </div>

        {role === "delivery" && (
          <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--bg)] p-4">
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              Select your delivery vehicle
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {VEHICLE_TYPES.map(({ id, emoji, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVehicleType(id)}
                  className="rounded-2xl border p-3 text-center transition-all hover:scale-[1.01]"
                  style={{
                    background:
                      vehicleType === id
                        ? "rgba(245,158,11,0.15)"
                        : "var(--elevated)",
                    border:
                      vehicleType === id
                        ? "2px solid #f59e0b"
                        : "1px solid var(--border)",
                    color:
                      vehicleType === id ? "#b45309" : "var(--text-secondary)",
                  }}
                >
                  <div className="text-2xl">{emoji}</div>
                  <div className="mt-2 text-sm font-bold">{label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="mt-6 w-full rounded-3xl px-6 py-4 text-base font-semibold transition-all disabled:cursor-not-allowed"
          style={{
            background: "var(--brand)",
            color: "white",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Saving role…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
