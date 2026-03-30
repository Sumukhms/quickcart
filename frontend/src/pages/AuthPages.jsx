import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Truck, Store, User as UserIcon, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const ROLES = [
  { id: "customer",  icon: UserIcon, emoji: "👤", label: "Customer",    sub: "Order from stores near you" },
  { id: "store",     icon: Store,    emoji: "🏪", label: "Store Owner", sub: "Manage your store & products" },
  { id: "delivery",  icon: Truck,    emoji: "🛵", label: "Delivery",    sub: "Earn by delivering orders" },
];

export function LoginPage() {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const { login } = useAuth();
  const { addToast } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      addToast(`Welcome back, ${data.user.name}! 👋`, "success");
      navigate(location.state?.from?.pathname || data.redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your journey">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Field label="Email" type="email" placeholder="you@example.com"
          value={form.email} onChange={v => setForm({ ...form, email: v })} />
        <PasswordField value={form.password} onChange={v => setForm({ ...form, password: v })}
          showPw={showPw} setShowPw={setShowPw} />
        <SubmitBtn loading={loading} label="Sign In" />
        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No account?{" "}
          <Link to="/register" className="font-bold" style={{ color: "var(--brand)" }}>
            Sign up free
          </Link>
        </p>
      </form>

      {/* Demo accounts */}
      <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="divider-label mb-3">Quick Demo Login</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { role: "customer", email: "customer@demo.com", pw: "demo123", emoji: "👤", color: "#22c55e" },
            { role: "store",    email: "store@demo.com",    pw: "demo123", emoji: "🏪", color: "#3b82f6" },
            { role: "delivery", email: "delivery@demo.com", pw: "demo123", emoji: "🛵", color: "#f59e0b" },
          ].map(({ role, email, pw, emoji, color }) => (
            <button
              key={role}
              onClick={() => setForm({ email, password: pw })}
              className="py-3 px-1 rounded-2xl text-xs font-bold capitalize transition-all hover:scale-105 active:scale-95"
              style={{
                background: color + "12",
                color: color,
                border: `1.5px solid ${color}30`,
              }}
            >
              <div className="text-xl mb-1">{emoji}</div>
              {role}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const [form,    setForm]    = useState({ name: "", email: "", password: "", role: "customer", vehicleType: "bike" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const { register } = useAuth();
  const { addToast } = useCart();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role };
      if (form.role === "delivery") payload.vehicleType = form.vehicleType;
      const data = await register(payload);
      addToast("Account created! Welcome to QuickCart 🎉", "success");
      navigate(data.redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join thousands of happy users">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Field label="Full Name" type="text" placeholder="John Doe"
          value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <Field label="Email" type="email" placeholder="you@example.com"
          value={form.email} onChange={v => setForm({ ...form, email: v })} />
        <PasswordField value={form.password} onChange={v => setForm({ ...form, password: v })}
          showPw={showPw} setShowPw={setShowPw} placeholder="Min 6 characters" />

        {/* Role selection */}
        <div>
          <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-secondary)" }}>I am a</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(({ id, emoji, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm({ ...form, role: id })}
                className="py-3.5 px-2 rounded-2xl text-xs font-bold text-center transition-all hover:scale-105 active:scale-95 relative overflow-hidden"
                style={{
                  background:  form.role === id ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                  color:       form.role === id ? "var(--brand)" : "var(--text-secondary)",
                  border: `2px solid ${form.role === id ? "var(--brand)" : "var(--border)"}`,
                  transform:   form.role === id ? "scale(1.03)" : "scale(1)",
                }}
              >
                {form.role === id && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08), transparent)" }}
                  />
                )}
                <div className="text-2xl mb-1">{emoji}</div>
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
            {ROLES.find(r => r.id === form.role)?.sub}
          </p>
        </div>

        {/* Vehicle type for delivery */}
        {form.role === "delivery" && (
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Vehicle Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[["bike","🏍️","Bike"],["scooter","🛵","Scooter"],["cycle","🚲","Cycle"]].map(([v,e,l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, vehicleType: v })}
                  className="py-3 px-1 rounded-2xl text-xs font-bold transition-all hover:scale-105 text-center"
                  style={{
                    background: form.vehicleType === v ? "rgba(245,158,11,0.12)" : "var(--elevated)",
                    color:      form.vehicleType === v ? "#f59e0b" : "var(--text-secondary)",
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
        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already a member?{" "}
          <Link to="/login" className="font-bold" style={{ color: "var(--brand)" }}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// ── Shared sub-components ──────────────────────────────────────

function Field({ label, type, placeholder, value, onChange }) {
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
        required
      />
    </div>
  );
}

function PasswordField({ value, onChange, showPw, setShowPw, placeholder = "••••••••" }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
        Password
      </label>
      <div className="relative">
        <input
          type={showPw ? "text" : "password"}
          className="input-theme pr-11"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          minLength={6}
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
      className="p-3.5 rounded-2xl text-sm font-semibold flex items-center gap-2"
      style={{
        background: "rgba(239,68,68,0.1)",
        color: "#ef4444",
        border: "1px solid rgba(239,68,68,0.2)",
      }}
    >
      ❌ {message}
    </div>
  );
}

function SubmitBtn({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn btn-brand w-full justify-center text-base py-4 mt-2"
    >
      {loading ? (
        <div
          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          style={{ animation: "spin 0.7s linear infinite" }}
        />
      ) : (
        <>{label} <ArrowRight size={17} /></>
      )}
    </button>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 page-enter"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, var(--brand), transparent)",
            transform: "translate(40%, -40%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-8"
          style={{
            background: "radial-gradient(circle, #7c3aed, transparent)",
            transform: "translate(-40%, 40%)",
          }}
        />
        {/* Floating emojis */}
        {["🛒", "🍛", "🛵", "⚡", "✨"].map((e, i) => (
          <div
            key={i}
            className="absolute text-3xl opacity-5 select-none pointer-events-none"
            style={{
              left: `${10 + i * 20}%`,
              top: `${15 + (i % 3) * 25}%`,
              animation: `floatSlow ${5 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-xl"
              style={{
                background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
                boxShadow: "0 8px 25px rgba(255,107,53,0.4)",
              }}
            >
              Q
            </div>
            <span className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              Quick<span style={{ color: "var(--brand)" }}>Cart</span>
            </span>
          </Link>
          <h1
            className="font-display font-black text-3xl mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>
          <p style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        </div>

        {/* Card */}
        <div
          className="p-6 rounded-3xl shadow-2xl"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          }}
        >
          {children}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 mt-5 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1"><Sparkles size={11} style={{ color: "var(--brand)" }} /> 50k+ happy users</span>
          <span>·</span>
          <span>🔒 256-bit SSL</span>
          <span>·</span>
          <span>⭐ 4.8 rated</span>
        </div>
      </div>
    </div>
  );
}