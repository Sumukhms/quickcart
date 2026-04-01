/**
 * OAuthCallback.jsx — FIXED
 *
 * Fixes:
 *   1. Sets token via setTokenExternal BEFORE calling api.get("/auth/profile")
 *      so the axios interceptor picks it up
 *   2. Better error messages
 *   3. Handles missing token in hash
 */
import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { useAuth }             from "../../context/AuthContext";
import api                     from "../../api/api";

export default function OAuthCallback() {
  const navigate               = useNavigate();
  const { updateUser, setTokenExternal } = useAuth();
  const [status, setStatus]    = useState("Processing sign-in…");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Parse the URL fragment (# portion) — never sent to server
        const fragment   = window.location.hash.substring(1);
        const params     = new URLSearchParams(fragment);
        const token      = params.get("token");
        const redirectTo = params.get("redirectTo") || "/user/home";
        const error      = params.get("error");

        if (error || !token) {
          setStatus("Authentication failed. Redirecting to login…");
          setTimeout(() => navigate("/login?error=oauth_failed", { replace: true }), 1500);
          return;
        }

        // 1. Persist token FIRST so axios interceptor uses it
        localStorage.setItem("qc-token", token);
        setTokenExternal(token);

        // 2. Fetch profile with the new token
        setStatus("Loading your profile…");
        const { data: userProfile } = await api.get("/auth/profile");

        // 3. Persist user
        localStorage.setItem("qc-user", JSON.stringify(userProfile));
        updateUser(userProfile);

        setStatus("Success! Redirecting…");

        // Small delay so state updates flush
        setTimeout(() => {
          navigate(decodeURIComponent(redirectTo), { replace: true });
        }, 200);

      } catch (err) {
        console.error("[OAuthCallback] Error:", err);
        setStatus("Something went wrong. Redirecting to login…");
        setTimeout(() => navigate("/login?error=oauth_failed", { replace: true }), 2000);
      }
    }

    handleCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg)" }}
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