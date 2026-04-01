import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Eye, EyeOff, ArrowRight, Sparkles, Mail, ShieldCheck, KeyRound,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api         from "../api/api";

const ROLES = [
  { id: "customer", emoji: "👤", label: "Customer",    sub: "Order from stores near you" },
  { id: "store",    emoji: "🏪", label: "Store Owner", sub: "Manage your store & products" },
  { id: "delivery", emoji: "🛵", label: "Delivery",    sub: "Earn by delivering orders" },
];

// ── Shared sub-components ──────────────────────────────────────

function Field({ label, type = "text", placeholder, value, onChange, required = true, autoFocus = false }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <input
        type={type}
        className="input-theme"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
      />
    </div>
  );
}

function PasswordField({ label = "Password", value, onChange, showPw, setShowPw, placeholder = "Min 8 chars, uppercase, number" }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={showPw ? "text" : "password"}
          className="input-theme pr-11"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          minLength={8}
        />
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div
      className="p-3.5 rounded-2xl text-sm font-semibold flex items-start gap-2"
      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      <span className="flex-shrink-0 mt-0.5">❌</span>
      <span>{message}</span>
    </div>
  );
}

function WarningBox({ message }) {
  return (
    <div
      className="p-3.5 rounded-2xl text-sm font-semibold flex items-start gap-2"
      style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
    >
      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBox({ message }) {
  return (
    <div
      className="p-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2"
      style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
    >
      ✅ {message}
    </div>
  );
}

function SubmitBtn({ loading, label, disabled = false }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="btn btn-brand w-full justify-center text-base py-4 mt-2"
    >
      {loading
        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <>{label} <ArrowRight size={17} /></>}
    </button>
  );
}

function GoogleButton() {
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = API.replace("/api", "");
  return (
    <a
      href={`${baseUrl}/api/auth/google`}
      className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
      style={{ background: "var(--elevated)", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continue with Google
    </a>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 page-enter"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, var(--brand), transparent)", transform: "translate(40%, -40%)" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)", transform: "translate(-40%, 40%)" }} />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl"
              style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)", boxShadow: "0 8px 25px rgba(255,107,53,0.4)" }}
            >Q</div>
            <span className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              Quick<span style={{ color: "var(--brand)" }}>Cart</span>
            </span>
          </Link>
          <h1 className="font-display font-black text-3xl mb-2" style={{ color: "var(--text-primary)" }}>{title}</h1>
          <p style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        </div>
        <div
          className="p-6 rounded-3xl shadow-2xl"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}
        >
          {children}
        </div>
        <div className="flex items-center justify-center gap-4 mt-5 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1"><Sparkles size={11} style={{ color: "var(--brand)" }} /> 50k+ users</span>
          <span>·</span>
          <span>🔒 256-bit SSL</span>
          <span>·</span>
          <span>⭐ 4.8 rated</span>
        </div>
      </div>
    </div>
  );
}

// ── OTP Input ──────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
        6-Digit OTP
      </label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        className="input-theme text-center text-2xl font-black tracking-[0.5em]"
        placeholder="------"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        disabled={disabled}
        required
        autoFocus
      />
    </div>
  );
}

// ── Email Verification Screen ─────────────────────────────────
function VerifyEmailScreen({ email, onVerified, emailError = false }) {
  const [otp,       setOtp]       = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [cooldown,  setCooldown]  = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => {
      setCooldown(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Please enter the 6-digit OTP"); return; }
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/auth/verify-email", { email, otp });
      localStorage.setItem("qc-token", data.token);
      localStorage.setItem("qc-user",  JSON.stringify(data.user));
      setSuccess("Email verified! Logging you in…");
      setTimeout(() => onVerified(data), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true); setError(""); setSuccess("");
    try {
      await api.post("/auth/resend-verification", { email });
      setSuccess("New OTP sent! Check your inbox (and spam folder).");
      startCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP. Check server email config.");
    } finally { setResending(false); }
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "rgba(255,107,53,0.1)" }}
        >
          <Mail size={24} style={{ color: "var(--brand)" }} />
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          We sent a 6-digit OTP to
        </p>
        <p className="font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{email}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Check your inbox and spam folder
        </p>
      </div>

      {emailError && (
        <WarningBox message="The OTP email may have failed to send. Check the server EMAIL_USER / EMAIL_PASS config, then use 'Resend OTP' below." />
      )}
      {error   && <ErrorBox   message={error} />}
      {success && <SuccessBox message={success} />}

      <form onSubmit={handleVerify} className="space-y-4">
        <OtpInput value={otp} onChange={setOtp} disabled={loading} />
        <SubmitBtn loading={loading} label="Verify Email" disabled={otp.length !== 6} />
      </form>

      <div className="text-center space-y-1">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Didn't receive it?</p>
        <button
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="text-sm font-semibold transition-opacity"
          style={{
            color: cooldown > 0 ? "var(--text-muted)" : "var(--brand)",
            opacity: (resending || cooldown > 0) ? 0.6 : 1,
          }}
        >
          {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

// ── LOGIN PAGE ─────────────────────────────────────────────────
export function LoginPage() {
  const [form,        setForm]        = useState({ email: "", password: "" });
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [searchParams]                = useSearchParams();

  const { login, updateUser } = useAuth();
  const { addToast }          = useCart();
  const navigate              = useNavigate();
  const location              = useLocation();

  const oauthError = searchParams.get("error");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      addToast(`Welcome back, ${data.user.name}! 👋`, "success");
      const dest = location.state?.from?.pathname || data.redirectTo || "/user/home";
      navigate(dest, { replace: true });
    } catch (err) {
      const res = err.response?.data;
      if (res?.requiresVerification) {
        setNeedsVerify(true);
        setVerifyEmail(res.email || form.email);
        return;
      }
      setError(res?.message || "Invalid credentials. Please try again.");
    } finally { setLoading(false); }
  };

  const handleVerified = (data) => {
    updateUser(data.user);
    addToast(`Welcome, ${data.user.name}! 🎉`, "success");
    navigate(data.redirectTo || "/user/home", { replace: true });
  };

  if (needsVerify) {
    return (
      <AuthLayout title="Verify Your Email" subtitle="Check your inbox for the OTP">
        <VerifyEmailScreen email={verifyEmail} onVerified={handleVerified} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your journey">
      <form onSubmit={handleSubmit} className="space-y-4">
        {oauthError && <ErrorBox message="Google sign-in failed. Please try again." />}
        {error      && <ErrorBox message={error} />}

        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={v => setForm({ ...form, email: v })}
          autoFocus
        />
        <PasswordField
          value={form.password}
          onChange={v => setForm({ ...form, password: v })}
          showPw={showPw}
          setShowPw={setShowPw}
          placeholder="Your password"
        />

        <div className="text-right">
          <Link to="/forgot-password" className="text-xs font-semibold hover:underline"
            style={{ color: "var(--text-muted)" }}>
            Forgot password?
          </Link>
        </div>

        <SubmitBtn loading={loading} label="Sign In" />

        <div className="divider-label my-2">or</div>
        <GoogleButton />

        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No account?{" "}
          <Link to="/register" className="font-bold" style={{ color: "var(--brand)" }}>
            Sign up free
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// ── REGISTER PAGE ──────────────────────────────────────────────
export function RegisterPage() {
  const [form,          setForm]          = useState({ name: "", email: "", password: "", role: "customer", vehicleType: "bike" });
  const [showPw,        setShowPw]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [verifyScreen,  setVerifyScreen]  = useState(false);
  const [emailError,    setEmailError]    = useState(false);

  const { register, updateUser } = useAuth();
  const { addToast }             = useCart();
  const navigate                 = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setEmailError(false); setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.role === "delivery") payload.vehicleType = form.vehicleType;
      const data = await register(payload);

      if (data.emailError) {
        setEmailError(true);
      }

      addToast("Account created! Please verify your email 📧", "info");
      setVerifyScreen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const handleVerified = (data) => {
    updateUser(data.user);
    addToast("Email verified! Welcome to QuickCart 🎉", "success");
    navigate(data.redirectTo || "/user/home", { replace: true });
  };

  if (verifyScreen) {
    return (
      <AuthLayout title="Verify Your Email" subtitle="Check your inbox for the OTP">
        <VerifyEmailScreen
          email={form.email}
          onVerified={handleVerified}
          emailError={emailError}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Join thousands of happy users">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}

        <Field
          label="Full Name"
          placeholder="John Doe"
          value={form.name}
          onChange={v => setForm({ ...form, name: v })}
          autoFocus
        />
        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={v => setForm({ ...form, email: v })}
        />
        <PasswordField
          value={form.password}
          onChange={v => setForm({ ...form, password: v })}
          showPw={showPw}
          setShowPw={setShowPw}
        />

        {/* Role selection */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-secondary)" }}>I am a</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(({ id, emoji, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm({ ...form, role: id })}
                className="py-3.5 px-2 rounded-2xl text-xs font-bold text-center transition-all hover:scale-105 relative overflow-hidden"
                style={{
                  background: form.role === id ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                  color:      form.role === id ? "var(--brand)"          : "var(--text-secondary)",
                  border: `2px solid ${form.role === id ? "var(--brand)" : "var(--border)"}`,
                }}
              >
                <div className="text-2xl mb-1">{emoji}</div>{label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle type (delivery only) */}
        {form.role === "delivery" && (
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Vehicle</label>
            <div className="grid grid-cols-3 gap-2">
              {[["bike","🏍️","Bike"],["scooter","🛵","Scooter"],["cycle","🚲","Cycle"]].map(([v,e,l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, vehicleType: v })}
                  className="py-3 px-1 rounded-2xl text-xs font-bold transition-all hover:scale-105 text-center"
                  style={{
                    background: form.vehicleType === v ? "rgba(245,158,11,0.12)" : "var(--elevated)",
                    color:      form.vehicleType === v ? "#f59e0b"                : "var(--text-secondary)",
                    border: `2px solid ${form.vehicleType === v ? "#f59e0b" : "var(--border)"}`,
                  }}
                >
                  <div className="text-xl mb-0.5">{e}</div>{l}
                </button>
              ))}
            </div>
          </div>
        )}

        <SubmitBtn loading={loading} label="Create Account" />

        <div className="divider-label my-2">or</div>
        <GoogleButton />

        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already a member?{" "}
          <Link to="/login" className="font-bold" style={{ color: "var(--brand)" }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// ── FORGOT PASSWORD PAGE ───────────────────────────────────────
export function ForgotPasswordPage() {
  const navigate    = useNavigate();
  const { addToast } = useCart();

  const [step,     setStep]     = useState("email"); // "email" | "otp" | "newPassword"
  const [email,    setEmail]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => {
      setCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });

      // Check if backend reported an email failure
      if (data.emailError) {
        setError(
          "OTP was generated but the email could not be sent. " +
          "Please ask the admin to check EMAIL_USER and EMAIL_PASS in the server .env file."
        );
        return;
      }

      setSuccess("OTP sent! Check your inbox and spam folder.");
      setStep("otp");
      startCooldown();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP";
      // Surface email config errors clearly
      if (err.response?.data?.emailError) {
        setError(
          "The OTP could not be emailed. Server email configuration issue — " +
          "please check EMAIL_USER and EMAIL_PASS in the backend .env file."
        );
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      if (data.emailError) {
        setError("OTP generated but email delivery failed. Check server email config.");
        return;
      }
      setSuccess("OTP resent to your email.");
      startCooldown();
    } catch {
      setError("Failed to resend OTP. Please try again.");
    }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setError("");
    setStep("newPassword");
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, otp, password });
      addToast("Password reset! Please log in.", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Reset failed";
      setError(msg);
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("expired")) {
        setStep("otp");
      }
    } finally { setLoading(false); }
  };

  const STEP_META = {
    email:       { title: "Forgot Password",  subtitle: "Enter your email to receive an OTP", icon: Mail },
    otp:         { title: "Enter OTP",         subtitle: `Check your inbox at ${email}`,        icon: ShieldCheck },
    newPassword: { title: "New Password",      subtitle: "Choose a strong new password",        icon: KeyRound },
  };
  const meta = STEP_META[step];
  const Icon = meta.icon;

  return (
    <AuthLayout title={meta.title} subtitle={meta.subtitle}>
      <div className="text-center mb-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(255,107,53,0.1)" }}
        >
          <Icon size={24} style={{ color: "var(--brand)" }} />
        </div>
      </div>

      {error   && <ErrorBox   message={error}   />}
      {success && <SuccessBox message={success} />}

      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4 mt-4">
          <Field
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            autoFocus
          />
          <SubmitBtn loading={loading} label="Send OTP" />
          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            <Link to="/login" className="font-bold" style={{ color: "var(--brand)" }}>← Back to login</Link>
          </p>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4">
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          <SubmitBtn loading={loading} label="Verify OTP" disabled={otp.length !== 6} />
          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              className="text-sm font-semibold"
              style={{ color: cooldown > 0 ? "var(--text-muted)" : "var(--brand)" }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      )}

      {step === "newPassword" && (
        <form onSubmit={handleReset} className="space-y-4 mt-4">
          <PasswordField
            label="New Password"
            value={password}
            onChange={setPassword}
            showPw={showPw}
            setShowPw={setShowPw}
          />
          <SubmitBtn loading={loading} label="Reset Password" />
        </form>
      )}
    </AuthLayout>
  );
}