import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Order from "./src/models/Order.js";
import User from "./src/models/User.js";

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import passport from "./src/config/passport.js";
import connectDB from "./src/config/db.js";
import { verifyEmailConfig } from "./src/services/emailService.js";

import authRoutes from "./src/routes/authRoutes.js";
import storeRoutes from "./src/routes/storeRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import couponRoutes from "./src/routes/couponRoutes.js";
import storeCouponRoutes from "./src/routes/storeCouponRoutes.js";
import ratingRoutes from "./src/routes/ratingRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import statsRoutes from "./src/routes/statsRoutes.js";
import inventoryRoutes from "./src/routes/inventoryRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import addressRoutes from "./src/routes/addressRoutes.js";
import webhookRoutes from "./src/routes/webhookRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import deliveryRoutes from "./src/routes/deliveryRoutes.js";

import { startAutoCancelJob } from "./src/jobs/autoCancelOrders.js";

// ── Validate required environment variables ───────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("   Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET must be at least 32 characters. Generate one with:");
  console.error("   node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const isDev = process.env.NODE_ENV === "development";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

// ── CORS ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (isDev) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Helmet ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: isDev
      ? false
      : {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com", "'unsafe-inline'"],
            frameSrc: ["https://api.razorpay.com"],
            connectSrc: ["'self'", "https://api.razorpay.com", "https://res.cloudinary.com", "wss:"],
            imgSrc: ["'self'", "data:", "https:", "https://res.cloudinary.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          },
        },
  }),
);

// ── Compression & Logging ─────────────────────────────────────
app.use(compression());
app.use(morgan(isDev ? "dev" : "combined"));

// ── Global rate limiter ───────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
    skip: () => isDev,
  }),
);

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many auth attempts, please try again in 15 minutes." },
  skip: () => isDev,
});

// ── Database & Email ──────────────────────────────────────────
connectDB();
verifyEmailConfig().catch(() => {});

// ── Webhook route MUST be before express.json() ───────────────
// Razorpay webhooks require the raw body for HMAC signature verification.
app.use(
  "/api/webhook",
  (req, _res, next) => {
    req.io = io;
    next();
  },
  webhookRoutes,
);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// ── Auth ──────────────────────────────────────────────────────
app.use(passport.initialize());

// ── Inject Socket.IO instance on every request ────────────────
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ── Upload route (multipart — after json parser is fine) ──────
app.use("/api/upload", uploadRoutes);

// ── Health check ──────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), env: process.env.NODE_ENV }),
);

// ── API Routes ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/store-coupons", storeCouponRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (_req, res) =>
  res.json({ message: "QuickCart API v2", status: "running", env: process.env.NODE_ENV }),
);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: "Endpoint not found" }));

// ── Socket.IO ─────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

io.use(async (socket, next) => {
  try {
    const tokenStr = socket.handshake.auth?.token;
    if (!tokenStr || !tokenStr.startsWith("Bearer ")) {
      return next(new Error("Authentication error: No token provided"));
    }
    const token = tokenStr.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return next(new Error("Authentication error: Invalid token payload"));
    }
    
    const user = await User.findById(decoded.userId).select("storeId");
    socket.user = {
      ...decoded,
      storeId: user?.storeId?.toString()
    };
    
    next();
  } catch (err) {
    next(new Error("Authentication error: " + err.message));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user.userId})`);

  socket.on("join_store", (id) => {
    if (socket.user.role === "store" && socket.user.storeId === id) {
      socket.join(`store_${id}`);
    } else {
      console.warn(`[Socket] Unauthorized join_store attempt by ${socket.user.userId}`);
    }
  });

  socket.on("join_order", async (id) => {
    try {
      if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) {
        const order = await Order.findById(id).select("userId deliveryAgentId storeId");
        if (!order) return;
        
        const isCustomer = order.userId.toString() === socket.user.userId;
        const isDelivery = order.deliveryAgentId?.toString() === socket.user.userId;
        const isStore = order.storeId.toString() === socket.user.storeId;
        const isAdmin = socket.user.role === "admin";

        if (isCustomer || isDelivery || isStore || isAdmin) {
          socket.join(`order_${id}`);
        } else {
          console.warn(`[Socket] Unauthorized join_order attempt by ${socket.user.userId} for order ${id}`);
        }
      }
    } catch (err) {
      console.error("[Socket] join_order error:", err.message);
    }
  });

  socket.on("join_delivery", (id) => {
    if (socket.user.role === "delivery" && socket.user.userId === id) {
      socket.join(`delivery_${id}`);
    } else {
      console.warn(`[Socket] Unauthorized join_delivery attempt by ${socket.user.userId}`);
    }
  });

  socket.on("join_user_room", (id) => {
    if (socket.user.userId === id) {
      socket.join(`user_${id}`);
    } else {
      console.warn(`[Socket] Unauthorized join_user_room attempt by ${socket.user.userId}`);
    }
  });

  socket.on("update_location", async ({ orderId, lat, lng }) => {
    try {
      if (
        socket.user.role === "delivery" &&
        typeof orderId === "string" &&
        /^[a-f\d]{24}$/i.test(orderId) &&
        typeof lat === "number" &&
        typeof lng === "number"
      ) {
        // Verify delivery agent actually owns this order
        const order = await Order.findById(orderId).select("deliveryAgentId");
        if (order && order.deliveryAgentId?.toString() === socket.user.userId) {
          io.to(`order_${orderId}`).emit("location_update", { lat, lng });
        } else {
          console.warn(`[Socket] Unauthorized location update by ${socket.user.userId} for order ${orderId}`);
        }
      }
    } catch (err) {
      console.error("[Socket] update_location error:", err.message);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

startAutoCancelJob(io);

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ message: err.message });
  }
  const status = err.status || 500;
  console.error(
    `[${new Date().toISOString()}] Error ${status}:`,
    isDev ? err.stack : err.message,
  );
  res.status(status).json({
    message:
      isDev ? err.message : status === 500 ? "Something went wrong" : err.message,
  });
});

// ── Server startup ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 QuickCart API on port ${PORT} [${process.env.NODE_ENV}]`);
  console.log(`   Frontend URLs : ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`   Razorpay      : ${process.env.RAZORPAY_KEY_ID ? "✅ configured" : "⚠️  NOT SET"}`);
  console.log(`   Webhook Secret: ${process.env.RAZORPAY_WEBHOOK_SECRET ? "✅ set" : "⚠️  NOT SET (unsafe!)"}`);
  console.log(`   Email         : ${process.env.EMAIL_USER ? "✅ configured" : "⚠️  NOT SET"}`);
  console.log(`   Google OAuth  : ${process.env.GOOGLE_CLIENT_ID ? "✅ configured" : "⚠️  NOT SET"}`);
  console.log(`   Cloudinary    : ${process.env.CLOUDINARY_CLOUD_NAME ? "✅ configured" : "⚠️  NOT SET (uploads disabled)"}`);
});