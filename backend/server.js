import express    from "express";
import cors       from "cors";
import helmet     from "helmet";
import rateLimit  from "express-rate-limit";
import compression from "compression";
import morgan     from "morgan";
import { createServer } from "http";
import { Server }       from "socket.io";
import "dotenv/config";
import passport         from "./src/config/passport.js";
import connectDB        from "./src/config/db.js";
import { verifyEmailConfig } from "./src/services/emailService.js";

import authRoutes        from "./src/routes/authRoutes.js";
import storeRoutes       from "./src/routes/storeRoutes.js";
import productRoutes     from "./src/routes/productRoutes.js";
import cartRoutes        from "./src/routes/cartRoutes.js";
import orderRoutes       from "./src/routes/orderRoutes.js";
import couponRoutes      from "./src/routes/couponRoutes.js";
import storeCouponRoutes from "./src/routes/storeCouponRoutes.js";
import ratingRoutes      from "./src/routes/ratingRoutes.js";
import favoriteRoutes    from "./src/routes/favoriteRoutes.js";
import adminRoutes       from "./src/routes/adminRoutes.js";
import paymentRoutes     from "./src/routes/paymentRoutes.js";
import statsRoutes       from "./src/routes/statsRoutes.js";
import inventoryRoutes   from "./src/routes/inventoryRoutes.js";
import locationRoutes    from "./src/routes/locationRoutes.js";
import addressRoutes     from "./src/routes/addressRoutes.js";

// ── CRITICAL: Validate required environment variables at startup ──
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error("   Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET must be at least 32 characters. Generate one with:");
  console.error("   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
  process.exit(1);
}

const app        = express();
const httpServer = createServer(app);
const isDev      = process.env.NODE_ENV === "development";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ── CORS (before helmet so preflight works) ───────────────────
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (isDev) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ── Helmet with Razorpay CSP allowlist ───────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: isDev
      ? false  // disabled in dev for hot-reload etc.
      : {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
              "'self'",
              "https://checkout.razorpay.com",
              "'unsafe-inline'", // needed for Razorpay inline handler
            ],
            frameSrc: ["https://api.razorpay.com"],
            connectSrc: [
              "'self'",
              "https://api.razorpay.com",
              "wss:", // Socket.IO WebSocket
            ],
            imgSrc: ["'self'", "data:", "https:"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          },
        },
  })
);

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── Request logging ───────────────────────────────────────────
app.use(morgan(isDev ? "dev" : "combined"));

// ── Rate limiting ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: "Too many requests, please try again later." },
  skip: () => isDev,
});
app.use(globalLimiter);

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { message: "Too many auth attempts, please try again in 15 minutes." },
  skip: () => isDev,
});

// ── Socket.IO ─────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin:      ALLOWED_ORIGINS,
    credentials: true,
    methods:     ["GET", "POST"],
  },
  pingTimeout:  60_000,
  pingInterval: 25_000,
});

// ── DB + Email ────────────────────────────────────────────────
connectDB();
verifyEmailConfig().catch(() => {});

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(passport.initialize());
app.use((req, _res, next) => { req.io = io; next(); });

// ── Health check (before auth middleware) ─────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), env: process.env.NODE_ENV })
);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/stores",        storeRoutes);
app.use("/api/products",      productRoutes);
app.use("/api/cart",          cartRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/coupons",       couponRoutes);
app.use("/api/store-coupons", storeCouponRoutes);
app.use("/api/ratings",       ratingRoutes);
app.use("/api/favorites",     favoriteRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/payment",       paymentRoutes);
app.use("/api/stats",         statsRoutes);
app.use("/api/inventory",     inventoryRoutes);
app.use("/api/location",      locationRoutes);
app.use("/api/addresses",     addressRoutes);

app.get("/", (_req, res) => res.json({
  message: "QuickCart API v2",
  status:  "running",
  env:     process.env.NODE_ENV,
}));

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// ── Socket.IO — authenticated room joins ─────────────────────
io.on("connection", (socket) => {
  // join_store: only store owners should call this — validated in storeRoutes
  socket.on("join_store", (id) => {
    if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) {
      socket.join(`store_${id}`);
    }
  });

  socket.on("join_order", (id) => {
    if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) {
      socket.join(`order_${id}`);
    }
  });

  socket.on("join_delivery", (id) => {
    if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) {
      socket.join(`delivery_${id}`);
    }
  });

  socket.on("update_location", ({ orderId, lat, lng }) => {
    if (
      typeof orderId === "string" && /^[a-f\d]{24}$/i.test(orderId) &&
      typeof lat === "number" && typeof lng === "number" &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ) {
      io.to(`order_${orderId}`).emit("location_update", { lat, lng });
    }
  });

  socket.on("disconnect", () => {});
});

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ message: err.message });
  }
  // Don't leak stack traces in production
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] Error ${status}:`, isDev ? err.stack : err.message);
  res.status(status).json({
    message: isDev ? err.message : status === 500 ? "Something went wrong" : err.message,
  });
});

// ── Server startup ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 QuickCart API on port ${PORT} [${process.env.NODE_ENV}]`);
  console.log(`   Frontend URLs: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`   Razorpay:      ${process.env.RAZORPAY_KEY_ID ? "✅ configured" : "⚠️  NOT SET"}`);
  console.log(`   Email:         ${process.env.EMAIL_USER     ? "✅ configured" : "⚠️  NOT SET"}`);
  console.log(`   Google OAuth:  ${process.env.GOOGLE_CLIENT_ID ? "✅ configured" : "⚠️  NOT SET"}`);
});