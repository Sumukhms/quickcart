import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  Zap, Github, Twitter, Instagram, Mail,
  MapPin, Phone, Shield, Heart
} from "lucide-react";

const FOOTER_LINKS = {
  Company: [
    { label: "About Us",       href: "/about" },
    { label: "Careers",        href: "/careers" },
    { label: "Press & Media",  href: "/about" },
    { label: "Blog",           href: "/about" },
  ],
  Support: [
    { label: "Help Center",      href: "/help" },
    { label: "Safety & Trust",   href: "/help" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy",   href: "/terms" },
  ],
  "For Business": [
    { label: "Open a store",    href: "/register" },
    { label: "Deliver with us", href: "/register" },
    { label: "Advertise",       href: "/about" },
    { label: "Partner API",     href: "/about" },
  ],
};

// Real social links — update with your actual handles before launch
const SOCIAL_LINKS = [
  { icon: Twitter,   href: "https://twitter.com/intent/tweet?text=Check+out+QuickCart+%E2%9A%A1", label: "Twitter",   },
  { icon: Instagram, href: "https://instagram.com",                                               label: "Instagram", },
  { icon: Github,    href: "https://github.com",                                                  label: "GitHub",    },
  { icon: Mail,      href: "mailto:support@quickcart.in",                                         label: "Email",     },
];

const APP_LINKS = [
  {
    label: "App Store",
    sub:   "iPhone & iPad",
    href:  "/register",           // links to register until real app is live
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    label: "Play Store",
    sub:   "Android",
    href:  "/register",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.18 23.76c.37.21.8.27 1.22.15l12.12-6.99-2.54-2.54-10.8 9.38zm-1.1-20.03C2.03 4 2 4.27 2 4.56v14.88c0 .29.03.56.08.83l11.09-11.09L2.08 3.73zm19.5 8.26l-2.7-1.56-2.88 2.88 2.88 2.88 2.72-1.57c.78-.45.78-1.63-.02-2.63zM4.4.09C3.98-.02 3.54.04 3.18.25L14.27 11.3 16.81 8.77 4.4.09z" />
      </svg>
    ),
  },
];

const HIDDEN_PATHS = [
  "/login", "/register", "/forgot-password", "/auth/",
  "/store/", "/delivery/", "/admin",
];

export default function Footer() {
  const location   = useLocation();
  const { isLoggedIn } = useAuth();
  const { addToast }   = useCart();

  const shouldHide = HIDDEN_PATHS.some((p) => location.pathname.startsWith(p));
  if (shouldHide) return null;

  const handleAppClick = (label) => {
    addToast(`${label} app launching soon! Sign up on web in the meantime 📱`, "info");
  };

  return (
    <footer style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>

      {/* CTA strip */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ff6b35 0%, #e5521e 50%, #c44416 100%)" }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.6), transparent)", transform: "translate(35%, -35%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none opacity-10"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.8), transparent)", transform: "translate(-30%, 30%)" }} />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display font-bold text-2xl text-white mb-1">Hungry? We've got you. 🛵</h3>
              <p className="text-white/75 text-sm">Order from 50+ local stores. Delivered in minutes.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                to={isLoggedIn ? "/user/home" : "/register"}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.95)", color: "#e5521e", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
              >
                <Zap size={16} />
                {isLoggedIn ? "Order Now" : "Get Started Free"}
              </Link>
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1.5px solid rgba(255,255,255,0.3)" }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg transition-all duration-300 group-hover:scale-110"
                style={{ background: "linear-gradient(135deg, #ff6b35, #ff8c5a)", boxShadow: "0 4px 15px rgba(255,107,53,0.35)" }}
              >
                Q
              </div>
              <span className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>
                Quick<span style={{ color: "var(--brand)" }}>Cart</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--text-muted)" }}>
              Your neighbourhood delivery platform. Order groceries, food, medicines and more — delivered fast from local stores near you.
            </p>

            <div className="space-y-2">
              <a
                href="mailto:support@quickcart.in"
                className="flex items-center gap-2 text-xs transition-colors hover:text-brand"
                style={{ color: "var(--text-muted)" }}
              >
                <Mail size={12} style={{ color: "var(--brand)", flexShrink: 0 }} />
                support@quickcart.in
              </a>
              <a
                href="tel:+918012345678"
                className="flex items-center gap-2 text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <Phone size={12} style={{ color: "var(--brand)", flexShrink: 0 }} />
                +91 80 1234 5678
              </a>
              {/* FIXED: replaced dead href="#" with a span (address is not a link) */}
              <span className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <MapPin size={12} style={{ color: "var(--brand)", flexShrink: 0 }} />
                MG Road, Bengaluru, Karnataka 560001
              </span>
            </div>

            {/* Social links — all open in new tab */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-0.5"
                  style={{ background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)";
                    e.currentTarget.style.color       = "var(--brand)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color       = "var(--text-muted)";
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: "var(--text-primary)" }}>
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm transition-all hover:translate-x-0.5 inline-block"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* App badges */}
        <div
          className="mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold mr-1" style={{ color: "var(--text-muted)" }}>Coming soon:</p>
            {APP_LINKS.map(({ label, sub, icon, href }) => (
              // FIXED: these now link to /register (functional) + show toast
              <Link
                key={label}
                to={href}
                onClick={() => handleAppClick(label)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{icon}</span>
                <span>
                  <span className="block text-xs leading-tight">{label}</span>
                  <span className="block text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>{sub}</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              to="/help"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <Shield size={11} /> SSL Secured
            </Link>
            <Link
              to="/user/home"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
              style={{ background: "rgba(255,107,53,0.1)", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.2)" }}
            >
              ⚡ 10 min delivery
            </Link>
            <Link
              to="/user/home"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              🏪 50+ stores
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div
          className="mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <p>© {new Date().getFullYear()} QuickCart Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="hover:underline" style={{ color: "var(--text-muted)" }}>Terms</Link>
            <span>·</span>
            <Link to="/terms" className="hover:underline" style={{ color: "var(--text-muted)" }}>Privacy</Link>
            <span>·</span>
            <p className="flex items-center gap-1">
              Made with <Heart size={11} style={{ color: "#ef4444" }} fill="#ef4444" /> in Bengaluru
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}