/**
 * OAuthCallback.jsx
 *
 * Handles the redirect from Google OAuth.
 *
 * The backend embeds three params in the URL fragment:
 *   #token=<accessToken>&redirectTo=<path>&isNewGoogleUser=1|0
 *
 * When isNewGoogleUser=1, the user is redirected to the role selection page
 * before being routed into the app.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

// ── Role Selection Modal ──────────────────────────────────────
function RoleSelectionModal({ user, onComplete }) {
  const [selectedRole, setSelectedRole] = useState("customer");
  const [selectedVehicle, setSelectedVehicle] = useState("bike");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { role: selectedRole };
      if (selectedRole === "delivery") payload.vehicleType = selectedVehicle;

      await api.put("/auth/profile", payload);

      const { data: updatedProfile } = await api.get("/auth/profile");
      onComplete(updatedProfile);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save. Please try again.",
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 text-center"
          style={{
            background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="font-display font-bold text-xl text-white">
            Welcome, {user?.name?.split(" ")[0]}!
          </h2>
          <p className="text-white/75 text-sm mt-1">
            How would you like to use QuickCart?
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Role Selection */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Choose your role
            </p>
            <div className="space-y-2">
              {ROLES.map(({ id, emoji, label, sub, color }) => (
                <button
                  key={id}
                  onClick={() => setSelectedRole(id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
                  style={{
                    background:
                      selectedRole === id
                        ? "rgba(255,107,53,0.06)"
                        : "var(--elevated)",
                    border: `1.5px solid ${selectedRole === id ? "var(--brand)" : "var(--border)"}`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: color + "15" }}
                  >
                    {emoji}
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-bold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {label}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {sub}
                    </p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor:
                        selectedRole === id ? "var(--brand)" : "var(--border)",
                    }}
                  >
                    {selectedRole === id && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: "var(--brand)" }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle type — delivery only */}
          {selectedRole === "delivery" && (
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Vehicle type
              </p>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLE_TYPES.map(({ id, emoji, label }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedVehicle(id)}
                    className="flex flex-col items-center py-3 px-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{
                      background:
                        selectedVehicle === id
                          ? "rgba(245,158,11,0.12)"
                          : "var(--elevated)",
                      color:
                        selectedVehicle === id
                          ? "#f59e0b"
                          : "var(--text-secondary)",
                      border: `1.5px solid ${selectedVehicle === id ? "#f59e0b" : "var(--border)"}`,
                    }}
                  >
                    <span className="text-xl mb-1">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              className="rounded-xl p-3 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={saving}
            className="btn btn-brand w-full justify-center py-3.5 text-base"
            style={{ boxShadow: "0 8px 24px rgba(255,107,53,0.35)" }}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Get Started →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function OAuthCallback() {
  const navigate = useNavigate();
  const { updateUser, setTokenExternal } = useAuth();

  const [status, setStatus] = useState("Processing sign-in…");

  useEffect(() => {
    async function handleCallback() {
      try {
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);

        const token = params.get("token");
        const redirectTo = params.get("redirectTo") || "/user/home";
        const isNewGoogleUser = params.get("isNewGoogleUser") === "1";
        const error = params.get("error");

        if (error || !token) {
          setStatus("Authentication failed. Redirecting to login…");
          setTimeout(
            () => navigate("/login?error=oauth_failed", { replace: true }),
            1500,
          );
          return;
        }

        localStorage.setItem("qc-token", token);
        setTokenExternal(token);

        setStatus("Loading your profile…");
        const { data: userProfile } = await api.get("/auth/profile");

        localStorage.setItem("qc-user", JSON.stringify(userProfile));
        updateUser(userProfile);

        if (isNewGoogleUser) {
          setStatus("Redirecting to role selection…");
          navigate("/auth/select-role", { replace: true });
          return;
        }

        setStatus("Success! Redirecting…");
        setTimeout(
          () => navigate(decodeURIComponent(redirectTo), { replace: true }),
          200,
        );
      } catch (err) {
        console.error("[OAuthCallback] Error:", err);
        setStatus("Something went wrong. Redirecting to login…");
        setTimeout(
          () => navigate("/login?error=oauth_failed", { replace: true }),
          2000,
        );
      }
    }

    handleCallback();
  }, [navigate, setTokenExternal, updateUser]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      
    >
      <div className="text-center px-4">
        <div
          className="w-14 h-14 border-4 rounded-full mx-auto mb-5"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--brand)",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          {status}
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Please wait…
        </p>
      </div>
    </div>
  );
}
