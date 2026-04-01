import { useLocation, Link } from "react-router-dom";
import {
  Zap, Shield, Star, Users, Package, Truck, MapPin, Mail, Phone,
  ChevronDown, ChevronRight, Store, Heart, HelpCircle, FileText,
  Briefcase, Check,
} from "lucide-react";

function Section({ children, className = "" }) {
  return (
    <div className={`max-w-3xl mx-auto px-4 py-8 ${className}`}>{children}</div>
  );
}

function PageHero({ icon: Icon, color, title, subtitle }) {
  return (
    <div
      className="relative overflow-hidden py-16"
      style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--card) 100%)", borderBottom: "1px solid var(--border)" }}
    >
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none opacity-10"
        style={{ background: `radial-gradient(circle, ${color}, transparent)`, transform: "translate(40%,-40%)" }}
      />
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: color + "20", border: `1.5px solid ${color}40` }}
        >
          <Icon size={28} style={{ color }} />
        </div>
        <h1 className="font-display font-bold text-4xl mb-3" style={{ color: "var(--text-primary)" }}>{title}</h1>
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function Accordion({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const id = `acc-${i}`;
        return (
          <details
            key={i}
            className="rounded-2xl overflow-hidden group"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <summary
              className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {item.q}
              <ChevronDown size={15} style={{ color: "var(--text-muted)", transition: "transform 0.2s", flexShrink: 0 }} className="group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              {item.a}
            </div>
          </details>
        );
      })}
    </div>
  );
}

// ── ABOUT ─────────────────────────────────────────────────────
function About() {
  const stats = [
    { label: "Active Stores", value: "50+", color: "#3b82f6" },
    { label: "Orders Delivered", value: "10k+", color: "var(--brand)" },
    { label: "Happy Customers", value: "5k+", color: "#22c55e" },
    { label: "Avg Store Rating", value: "4.8★", color: "#f59e0b" },
  ];

  const values = [
    { icon: Zap, title: "Speed first", body: "We obsess over delivery time so your food arrives hot and your groceries arrive fresh. Our partners are trained to prioritize every minute.", color: "#f59e0b" },
    { icon: Shield, title: "Quality & safety", body: "Every store on QuickCart is verified. Products are handled with care, and customers can report any issue instantly for a full refund.", color: "#22c55e" },
    { icon: Heart, title: "Community driven", body: "We work with local store owners, not against them. QuickCart gives neighbourhood businesses the technology to compete with big chains.", color: "#ef4444" },
  ];

  return (
    <>
      <PageHero icon={Zap} color="var(--brand)" title="About QuickCart" subtitle="Your neighbourhood delivery platform — groceries, food, medicines and more, delivered in minutes." />

      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-5 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="font-display font-bold text-3xl mb-1" style={{ color }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="font-display font-bold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>Our story</h2>
          <p className="text-base leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            QuickCart started in Bengaluru with a simple idea: what if you could get anything from your local neighbourhood store as fast as you get a cab? We partnered with the grocery stores, restaurants and pharmacies that people already trust, and built the logistics network to bring their products to your door in under 30 minutes.
          </p>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Today QuickCart operates across Bengaluru with 50+ partner stores across groceries, food, snacks, beverages and medicines. We're growing fast — and we're always looking for great store partners and delivery partners to join us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {values.map(({ icon: Icon, title, body, color }) => (
            <div key={title} className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: color + "15" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{body}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-3xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.04))", border: "1.5px solid rgba(255,107,53,0.2)" }}
        >
          <h2 className="font-display font-bold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>Join QuickCart</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Whether you run a store or want to deliver — there's a place for you.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/register" className="btn btn-brand">
              <Store size={16} /> Open your store
            </Link>
            <Link to="/register" className="btn btn-ghost">
              <Truck size={16} /> Become a delivery partner
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
          <h2 className="font-bold text-lg mb-4" style={{ color: "var(--text-primary)" }}>Get in touch</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { icon: Mail, label: "support@quickcart.in", href: "mailto:support@quickcart.in" },
              { icon: Phone, label: "+91 80 1234 5678", href: "tel:+918012345678" },
              { icon: MapPin, label: "MG Road, Bengaluru, KA 560001", href: "#" },
            ].map(({ icon: Icon, label, href }) => (
              <a key={label} href={href}
                className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl transition-all hover:scale-105"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                <Icon size={14} style={{ color: "var(--brand)" }} /> {label}
              </a>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

// ── HELP ──────────────────────────────────────────────────────
function Help() {
  const sections = [
    {
      category: "🛒 Orders",
      items: [
        { q: "How do I place an order?", a: "Browse stores from the home page, add items to your cart, then go to checkout. Select your delivery address, choose a payment method, and tap 'Place Order'. You'll get a confirmation with a live tracking link." },
        { q: "Can I cancel my order?", a: "Yes — you can cancel a Pending or Confirmed order from the Orders page. Once the store starts preparing your order it can no longer be cancelled. If you need help, contact us at support@quickcart.in." },
        { q: "Can I add items to an existing order?", a: "No, orders cannot be modified after placement. You can place a new order for the additional items — a second delivery fee will apply." },
        { q: "What if an item I ordered is out of stock?", a: "The store will mark the item unavailable and contact you. You'll receive a partial refund for any items that couldn't be fulfilled within 2–3 business days." },
      ],
    },
    {
      category: "🛵 Delivery",
      items: [
        { q: "How long does delivery take?", a: "Most orders are delivered in 20–30 minutes. The estimated time is shown on each store's page and is updated in real time as your order moves through the flow." },
        { q: "Do you deliver to my area?", a: "QuickCart currently serves Bengaluru. Enter your address at checkout — if delivery is not available in your area you'll be notified before placing the order." },
        { q: "What is the delivery fee?", a: "The standard delivery fee is ₹20 per order. Some coupons offer free delivery — check the Coupons section at checkout to see available offers." },
        { q: "Can I track my delivery in real time?", a: "Yes. Once a delivery partner accepts your order you can track their location live from the Order Tracking page." },
      ],
    },
    {
      category: "💳 Payments",
      items: [
        { q: "What payment methods do you accept?", a: "We accept Cash on Delivery (COD), UPI (GPay, PhonePe, Paytm), and Credit/Debit cards via Razorpay. All online payments are encrypted and secure." },
        { q: "How do I apply a coupon?", a: "In the checkout Payment step, tap 'Browse available coupons' to see all active offers, or enter a code manually. Discounts are applied to your order total before confirmation." },
        { q: "When will I get my refund?", a: "Refunds for cancelled orders or issues are processed within 3–5 business days to your original payment method. COD refunds are issued as store credits." },
        { q: "Is my payment information secure?", a: "Yes. QuickCart never stores card details. All card payments go through Razorpay which is PCI DSS certified. UPI payments are processed by your bank directly." },
      ],
    },
    {
      category: "👤 Account",
      items: [
        { q: "How do I create an account?", a: "Tap 'Sign up free' on the homepage. You can register with your email and set a password, or use 'Continue with Google' for one-click sign-in." },
        { q: "I forgot my password — what do I do?", a: "On the login page, tap 'Forgot password'. Enter your email and we'll send a 6-digit OTP. Use it to set a new password." },
        { q: "How do I save a delivery address?", a: "Go to your Profile or the Checkout page and add a new address. You can save up to 5 addresses and set one as your default." },
        { q: "Can I use the same account to shop and run a store?", a: "Store owner and delivery partner accounts are separate roles. If you want to shop as a customer, all account types can browse and order from any store." },
      ],
    },
  ];

  return (
    <>
      <PageHero icon={HelpCircle} color="#3b82f6" title="Help Centre" subtitle="Find answers to common questions about orders, delivery, payments and your account." />
      <Section>
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-8" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <Mail size={16} style={{ color: "#3b82f6" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Can't find your answer?</p>
            <a href="mailto:support@quickcart.in" className="text-xs" style={{ color: "#3b82f6" }}>Email us at support@quickcart.in — we reply within 2 hours</a>
          </div>
        </div>
        <div className="space-y-8">
          {sections.map(({ category, items }) => (
            <div key={category}>
              <h2 className="font-bold text-base mb-3" style={{ color: "var(--text-primary)" }}>{category}</h2>
              <Accordion items={items} />
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ── TERMS & PRIVACY ───────────────────────────────────────────
function Terms() {
  const sections = [
    {
      title: "Terms of Service",
      items: [
        { heading: "Acceptance", body: "By creating an account or placing an order on QuickCart you agree to these terms. If you do not agree, please do not use the platform." },
        { heading: "Eligibility", body: "You must be at least 18 years old to create an account and place orders. By using QuickCart you confirm that you meet this requirement." },
        { heading: "Orders and payments", body: "All orders are subject to product availability and store acceptance. Prices are set by the store and may change at any time. QuickCart is not responsible for pricing errors by store partners." },
        { heading: "Cancellations and refunds", body: "Customers may cancel a 'Pending' or 'Confirmed' order at no charge. Refunds are processed within 3–5 business days. QuickCart reserves the right to cancel any order suspected of fraud." },
        { heading: "User conduct", body: "You agree not to use QuickCart for any unlawful purpose, to submit false information, harass delivery partners, or attempt to manipulate reviews or ratings." },
        { heading: "Limitation of liability", body: "QuickCart is a marketplace connecting customers with local stores. We are not liable for the quality of products sold by partner stores beyond the refund process described above." },
      ],
    },
    {
      title: "Privacy Policy",
      items: [
        { heading: "What we collect", body: "We collect your name, email, phone number, delivery addresses, and order history. If you sign in with Google, we receive your name, email and profile photo from Google." },
        { heading: "How we use your data", body: "Your data is used to process orders, send OTP codes, communicate order updates, and improve the platform. We do not sell your data to third parties." },
        { heading: "Payment data", body: "QuickCart never stores card numbers or UPI credentials. Payment processing is handled by Razorpay under their privacy policy. We only store a reference to the completed transaction." },
        { heading: "Location data", body: "Delivery addresses you enter are stored to pre-fill future checkouts. We do not track your device location unless you explicitly grant permission for real-time delivery tracking." },
        { heading: "Data retention", body: "Your account and order history are retained as long as your account is active. You may request deletion of your account and all associated data by emailing privacy@quickcart.in." },
        { heading: "Cookies", body: "QuickCart uses session cookies to keep you logged in. We do not use tracking cookies or serve third-party advertising cookies." },
      ],
    },
  ];

  return (
    <>
      <PageHero icon={FileText} color="#8b5cf6" title="Terms & Privacy" subtitle="Last updated April 2026. These terms govern your use of QuickCart." />
      <Section>
        <div className="space-y-10">
          {sections.map(({ title, items }) => (
            <div key={title}>
              <h2 className="font-display font-bold text-2xl mb-5" style={{ color: "var(--text-primary)" }}>{title}</h2>
              <div className="space-y-4">
                {items.map(({ heading, body }) => (
                  <div key={heading} className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <h3 className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>{heading}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 p-4 rounded-2xl text-sm" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
          Questions about these terms? Email <a href="mailto:legal@quickcart.in" style={{ color: "var(--brand)" }}>legal@quickcart.in</a>
        </div>
      </Section>
    </>
  );
}

// ── CAREERS ───────────────────────────────────────────────────
function Careers() {
  const roles = [
    {
      icon: Store,
      title: "Store Partner",
      type: "Business",
      color: "#3b82f6",
      description: "List your grocery store, restaurant, pharmacy or any local shop on QuickCart. We handle the orders, delivery and payments — you focus on what you do best.",
      perks: ["Zero commission on first 100 orders", "Real-time dashboard to manage orders", "Dedicated onboarding support", "Payments settled weekly"],
      cta: { label: "Open your store", href: "/register" },
    },
    {
      icon: Truck,
      title: "Delivery Partner",
      type: "Part-time / Full-time",
      color: "#f59e0b",
      description: "Earn on your schedule by delivering orders from local stores to customers across Bengaluru. Use a bike, scooter or cycle — you decide when and where you work.",
      perks: ["₹30+ per delivery", "Weekly payouts", "Flexible hours — work when you want", "In-app navigation and live order tracking"],
      cta: { label: "Start delivering", href: "/register" },
    },
    {
      icon: Users,
      title: "Customer Support",
      type: "Full-time · Bengaluru",
      color: "#22c55e",
      description: "Help customers, store partners and delivery partners resolve issues quickly. You'll work across chat, email and phone to ensure every QuickCart experience is a great one.",
      perks: ["Competitive salary + performance bonus", "Health insurance", "Lunch provided", "Work from our Bengaluru office"],
      cta: { label: "Send your CV", href: "mailto:careers@quickcart.in?subject=Customer Support Application" },
    },
    {
      icon: Zap,
      title: "Software Engineer",
      type: "Full-time · Bengaluru or Remote",
      color: "#8b5cf6",
      description: "Build the technology behind QuickCart — from the mobile app and real-time order tracking to the logistics engine and store dashboard. We use React, Node.js, MongoDB and Socket.io.",
      perks: ["Competitive salary + ESOPs", "Fully remote option", "₹1L learning & conference budget", "Work on problems that matter for local communities"],
      cta: { label: "Apply now", href: "mailto:careers@quickcart.in?subject=Engineering Application" },
    },
  ];

  return (
    <>
      <PageHero icon={Briefcase} color="#8b5cf6" title="Careers" subtitle="Join us in building the fastest neighbourhood delivery network in India." />
      <Section>
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-8" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <Mail size={16} style={{ color: "#8b5cf6" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Don't see your role? Email{" "}
            <a href="mailto:careers@quickcart.in" style={{ color: "#8b5cf6", fontWeight: 700 }}>careers@quickcart.in</a>
            {" "}with your CV and we'll reach out if something opens up.
          </p>
        </div>

        <div className="space-y-5">
          {roles.map(({ icon: Icon, title, type, color, description, perks, cta }) => (
            <div key={title} className="rounded-3xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15" }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>{title}</h3>
                    <span className="tag text-[10px] font-semibold" style={{ background: color + "15", color }}>{type}</span>
                  </div>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {perks.map(p => (
                  <div key={p} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <Check size={11} style={{ color, flexShrink: 0 }} /> {p}
                  </div>
                ))}
              </div>
              <a
                href={cta.href}
                {...(cta.href.startsWith("mailto") ? {} : {})}
                className="btn btn-brand inline-flex text-sm"
              >
                {cta.label} <ChevronRight size={14} />
              </a>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────
export default function StaticPage() {
  const { pathname } = useLocation();

  const PAGE_MAP = {
    "/about":    <About />,
    "/help":     <Help />,
    "/terms":    <Terms />,
    "/careers":  <Careers />,
  };

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      {PAGE_MAP[pathname] || <About />}
      <div className="pb-16" />
    </div>
  );
}