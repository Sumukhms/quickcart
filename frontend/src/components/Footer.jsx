import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Twitter, Instagram, Github, Mail,
  Heart,
} from "lucide-react";

const FOOTER_LINKS = {
  Company: [
    { label: "About Us",       href: "/about" },
    { label: "Careers",        href: "/careers" },
    { label: "Blog",           href: "/about" },
  ],
  Support: [
    { label: "Help Center",      href: "/help" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy",   href: "/terms" },
  ],
  Business: [
    { label: "Open a store",    href: "/register" },
    { label: "Deliver with us", href: "/register" },
    { label: "Partner API",     href: "/about" },
  ],
};

const SOCIAL_LINKS = [
  { icon: Twitter,   href: "https://twitter.com",         label: "Twitter"   },
  { icon: Instagram, href: "https://instagram.com",       label: "Instagram" },
  { icon: Github,    href: "https://github.com",          label: "GitHub"    },
  { icon: Mail,      href: "mailto:support@quickcart.in", label: "Email"     },
];

const HIDDEN_PATHS = [
  "/login", "/register", "/forgot-password", "/auth/",
  "/store/", "/delivery/", "/admin",
];

export default function Footer() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  const shouldHide = HIDDEN_PATHS.some((p) => location.pathname.startsWith(p));
  if (shouldHide) return null;

  return (
    <footer
      style={{
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">

        {/* ── Main row: Brand + Link columns ── */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">

          {/* Brand */}
          <div className="md:max-w-[220px] flex-shrink-0">
            <Link to="/" className="inline-flex items-center gap-2 mb-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs"
                style={{ background: "var(--brand)" }}
              >
                Q
              </div>
              <span
                className="font-display font-bold text-[15px] tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Quick<span style={{ color: "var(--brand)" }}>Cart</span>
              </span>
            </Link>
            <p
              className="text-[12px] leading-relaxed mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Your neighbourhood delivery platform. Groceries, food & medicines — delivered fast.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-1.5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                  style={{
                    background: "var(--elevated)",
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="flex-1 grid grid-cols-3 gap-6">
            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h4
                  className="font-bold text-[11px] uppercase tracking-widest mb-2.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {heading}
                </h4>
                <ul className="space-y-2">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        to={href}
                        className="text-[12px] transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
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
        </div>

        {/* ── Copyright ── */}
        <div
          className="mt-5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <p>© {new Date().getFullYear()} QuickCart Technologies Pvt. Ltd.</p>
          <div className="flex items-center gap-3">
            <Link to="/terms" className="hover:underline" style={{ color: "var(--text-muted)" }}>Terms</Link>
            <span>·</span>
            <Link to="/terms" className="hover:underline" style={{ color: "var(--text-muted)" }}>Privacy</Link>
            <span>·</span>
            <p className="flex items-center gap-1">
              Made with <Heart size={9} style={{ color: "#ef4444" }} fill="#ef4444" /> in Bengaluru
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}