import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Truck, Store, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// ─── Role selector cards ──────────────────────────────────────
const ROLES = [
  { id: "customer",  icon: UserIcon, emoji: "👤", label: "Customer",  sub: "Order from stores near you" },
  { id: "store",     icon: Store,    emoji: "🏪", label: "Store Owner", sub: "Manage your store & products" },
  { id: "delivery",  icon: Truck,    emoji: "🛵", label: "Delivery",  sub: "Earn by delivering orders" },
];

// ─── Login Page ───────────────────────────────────────────────
export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      const from = location.state?.from?.pathname || data.redirectTo;
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <Field label="Email" type="email" placeholder="you@example.com"
          value={form.email} onChange={v => setForm({ ...form, email: v })} />
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} className="input-theme pr-10"
              placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <SubmitBtn loading={loading} label="Sign In" />
        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No account? <Link to="/register" className="font-bold" style={{ color: "var(--brand)" }}>Sign up free</Link>
        </p>
      </form>

      {/* Demo accounts */}
      <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs text-center mb-3 font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Quick Demo Login
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { role: "customer", email: "customer@demo.com", pw: "demo123", emoji: "👤" },
            { role: "store",    email: "store@demo.com",    pw: "demo123", emoji: "🏪" },
            { role: "delivery", email: "delivery@demo.com", pw: "demo123", emoji: "🛵" },
          ].map(({ role, email, pw, emoji }) => (
            <button key={role} onClick={() => setForm({ email, password: pw })}
              className="py-2 px-1 rounded-xl text-xs font-bold capitalize transition-all hover:scale-105"
              style={{ background: "var(--elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              {emoji} {role}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

// ─── Register Page ────────────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer", vehicleType: "bike" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      addToast("Account created! Welcome 🎉", "success");
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
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} className="input-theme pr-10"
              placeholder="Min 6 characters" minLength={6}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Role selection */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>I am a</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(({ id, emoji, label }) => (
              <button key={id} type="button" onClick={() => setForm({ ...form, role: id })}
                className="py-3 px-2 rounded-xl text-xs font-bold text-center transition-all hover:scale-105"
                style={{
                  background: form.role === id ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                  color: form.role === id ? "var(--brand)" : "var(--text-secondary)",
                  border: `1.5px solid ${form.role === id ? "var(--brand)" : "var(--border)"}`,
                }}>
                <div className="text-xl mb-1">{emoji}</div>
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
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Vehicle Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[["bike","🏍️","Bike"],["scooter","🛵","Scooter"],["cycle","🚲","Cycle"]].map(([v,e,l]) => (
                <button key={v} type="button" onClick={() => setForm({ ...form, vehicleType: v })}
                  className="py-2 px-1 rounded-xl text-xs font-bold transition-all hover:scale-105 text-center"
                  style={{
                    background: form.vehicleType === v ? "rgba(245,158,11,0.1)" : "var(--elevated)",
                    color: form.vehicleType === v ? "#f59e0b" : "var(--text-secondary)",
                    border: `1.5px solid ${form.vehicleType === v ? "#f59e0b" : "var(--border)"}`,
                  }}>
                  <div className="text-lg mb-0.5">{e}</div>{l}
                </button>
              ))}
            </div>
          </div>
        )}

        <SubmitBtn loading={loading} label="Create Account" />
        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already a member? <Link to="/login" className="font-bold" style={{ color: "var(--brand)" }}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

// ─── Shared sub-components ────────────────────────────────────
function Field({ label, type, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <input type={type} className="input-theme" placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)} required />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="p-3 rounded-xl text-sm font-medium"
      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
      {message}
    </div>
  );
}

function SubmitBtn({ loading, label }) {
  return (
    <button type="submit" disabled={loading} className="btn btn-brand w-full justify-center text-base py-3.5">
      {loading
        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <>{label} <ArrowRight size={17} /></>}
    </button>
  );
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, var(--brand), transparent)", transform: "translate(50%, -50%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)", transform: "translate(-50%, 50%)" }} />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)", boxShadow: "0 4px 20px rgba(255,107,53,0.4)" }}>Q</div>
            <span className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>
              Quick<span style={{ color: "var(--brand)" }}>Cart</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: "var(--text-primary)" }}>{title}</h1>
          <p style={{ color: "var(--text-muted)" }}>{subtitle}</p>
        </div>
        <div className="p-6 rounded-3xl shadow-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}