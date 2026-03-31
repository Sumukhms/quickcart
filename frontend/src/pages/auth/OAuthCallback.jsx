/**
 * OAuthCallback.jsx
 *
 * Landing page after Google OAuth redirect.
 * Backend redirects to: /auth/callback#token=xxx&redirectTo=%2Fuser%2Fhome
 *
 * This page:
 *   1. Reads token + redirectTo from the URL fragment (#)
 *   2. Stores token in localStorage
 *   3. Fetches the user profile with that token
 *   4. Updates AuthContext
 *   5. Navigates to redirectTo
 *
 * Using the fragment (#) instead of query string (?):
 *   - Fragment is never sent to the server in HTTP requests
 *   - Safer for short-lived tokens
 */
import { useEffect, useState } from "react";
import { useNavigate }         from "react-router-dom";
import { useAuth }             from "../../context/AuthContext";
import api                     from "../../api/api";

export default function OAuthCallback() {
  const navigate      = useNavigate();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState("Processing…");

  useEffect(() => {
    async function handleCallback() {
      try {
        // Parse the URL fragment
        const fragment = window.location.hash.substring(1);   // remove "#"
        const params   = new URLSearchParams(fragment);
        const token      = params.get("token");
        const redirectTo = params.get("redirectTo") || "/user/home";
        const error      = params.get("error");

        if (error || !token) {
          setStatus("Authentication failed. Redirecting…");
          setTimeout(() => navigate("/login?error=oauth_failed"), 1500);
          return;
        }

        // Persist token
        localStorage.setItem("qc-token", token);

        // Fetch profile with the new token
        const { data: user } = await api.get("/auth/profile");
        localStorage.setItem("qc-user", JSON.stringify(user));
        updateUser(user);

        setStatus("Success! Redirecting…");
        navigate(decodeURIComponent(redirectTo), { replace: true });
      } catch (err) {
        console.error("OAuth callback error:", err);
        setStatus("Something went wrong. Redirecting…");
        setTimeout(() => navigate("/login"), 2000);
      }
    }

    handleCallback();
  }, []);  // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ backgroundColor: "var(--bg)" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 rounded-full mx-auto mb-4 animate-spin"
             style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{status}</p>
      </div>
    </div>
  );
}