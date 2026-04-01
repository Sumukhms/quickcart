import express    from "express";
import cors       from "cors";
import helmet     from "helmet";
import rateLimit  from "express-rate-limit";
import { createServer } from "http";
import { Server }       from "socket.io";
import "dotenv/config";
import passport         from "./src/config/passport.js";
import connectDB        from "./src/config/db.js";
import { verifyEmailConfig } from "./src/services/emailService.js";

import authRoutes     from "./src/routes/authRoutes.js";
import storeRoutes    from "./src/routes/storeRoutes.js";
import productRoutes  from "./src/routes/productRoutes.js";
import cartRoutes     from "./src/routes/cartRoutes.js";
import orderRoutes    from "./src/routes/orderRoutes.js";
import couponRoutes   from "./src/routes/couponRoutes.js";
import ratingRoutes   from "./src/routes/ratingRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import adminRoutes    from "./src/routes/adminRoutes.js";
import paymentRoutes  from "./src/routes/paymentRoutes.js";
import statsRoutes    from "./src/routes/statsRoutes.js";

const app        = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",   // vite preview
  process.env.FRONTEND_URL,
].filter(Boolean);

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,  // needed for Razorpay iframe
}));

// ── CORS ──────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight for all routes

// ── Global rate limiter (100 req / 15 min per IP) ─────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: "Too many requests, please try again later." },
  // Skip rate limit for development
  skip: () => process.env.NODE_ENV === "development",
});
app.use(globalLimiter);

// ── Auth-specific rate limiter (10 req / 15 min per IP) ───────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { message: "Too many auth attempts, please try again in 15 minutes." },
  skip: () => process.env.NODE_ENV === "development",
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// ── Connect DB ─────────────────────────────────────────────────
connectDB();

// ── Verify email config on startup (non-blocking) ────────────
verifyEmailConfig().catch(() => {});

app.use(express.json({ limit: "10kb" }));
app.use(passport.initialize());
app.use((req, _res, next) => { req.io = io; next(); });

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/stores",    storeRoutes);
app.use("/api/products",  productRoutes);
app.use("/api/cart",      cartRoutes);
app.use("/api/orders",    orderRoutes);
app.use("/api/coupons",   couponRoutes);
app.use("/api/ratings",   ratingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/payment",   paymentRoutes);
app.use("/api/stats",     statsRoutes);

app.get("/", (_req, res) => res.json({
  message: "QuickCart API v2",
  status: "running",
  env: process.env.NODE_ENV,
}));

// ── Socket.io ─────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.on("join_store",    (id) => socket.join(`store_${id}`));
  socket.on("join_order",    (id) => socket.join(`order_${id}`));
  socket.on("join_delivery", (id) => socket.join(`delivery_${id}`));
  socket.on("update_location", ({ orderId, lat, lng }) => {
    io.to(`order_${orderId}`).emit("location_update", { lat, lng });
  });
  socket.on("disconnect", () => {});
});

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  // CORS errors
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ message: err.message });
  }
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 QuickCart API on port ${PORT}`);
  console.log(`   Frontend URLs: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`   Email user: ${process.env.EMAIL_USER || "⚠️  NOT SET — OTP emails won't work"}`);
});