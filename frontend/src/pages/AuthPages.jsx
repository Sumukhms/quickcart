import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { addToast } = useCart();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
      addToast("Welcome back! 👋", "success");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return <AuthLayout title="Welcome back" subtitle="Sign in to your account">
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
        <input type="email" className="input-theme" placeholder="you@example.com"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} className="input-theme pr-10"
            placeholder="••••••••"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-brand w-full justify-center text-base py-3.5">
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight size={17} /></>}
      </button>
      <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
        No account? <Link to="/register" className="font-bold" style={{ color: "var(--brand)" }}>Sign up free</Link>
      </p>
    </form>
  </AuthLayout>;
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
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
      await register(form.name, form.email, form.password, form.role);
      addToast("Account created! Welcome 🎉", "success");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return <AuthLayout title="Create account" subtitle="Join thousands of happy customers">
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}
      {[
        { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
        { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
      ].map(({ key, label, type, placeholder }) => (
        <div key={key}>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
          <input type={type} className="input-theme" placeholder={placeholder}
            value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
        </div>
      ))}
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} className="input-theme pr-10"
            placeholder="Min 6 characters"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>I am a</label>
        <div className="grid grid-cols-3 gap-2">
          {["customer", "store", "delivery"].map(r => (
            <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
              className="py-2.5 rounded-xl text-sm font-semibold capitalize transition-all"
              style={{
                background: form.role === r ? "var(--brand)" : "var(--elevated)",
                color: form.role === r ? "white" : "var(--text-secondary)",
                border: "1.5px solid", borderColor: form.role === r ? "var(--brand)" : "var(--border)",
              }}>
              {r === "customer" ? "👤 Customer" : r === "store" ? "🏪 Store" : "🛵 Delivery"}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-brand w-full justify-center text-base py-3.5">
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight size={17} /></>}
      </button>
      <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Already a member? <Link to="/login" className="font-bold" style={{ color: "var(--brand)" }}>Sign in</Link>
      </p>
    </form>
  </AuthLayout>;
}

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 page-enter" style={{ backgroundColor: "var(--bg)" }}>
      {/* BG decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, var(--brand), transparent)", transform: "translate(50%, -50%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)", transform: "translate(-50%, 50%)" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white"
              style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)", boxShadow: "0 4px 20px rgba(255,107,53,0.4)" }}>
              Q
            </div>
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