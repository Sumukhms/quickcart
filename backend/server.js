import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import "dotenv/config";
import connectDB from "./src/config/db.js";
import authRoutes    from "./src/routes/authRoutes.js";
import storeRoutes   from "./src/routes/storeRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import cartRoutes    from "./src/routes/cartRoutes.js";
import orderRoutes   from "./src/routes/orderRoutes.js";
import couponRoutes  from "./src/routes/couponRoutes.js";
import ratingRoutes  from "./src/routes/ratingRoutes.js";
import favoriteRoutes from "./src/routes/favoriteRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});

connectDB();

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use((req, _res, next) => { req.io = io; next(); });

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/stores",    storeRoutes);
app.use("/api/products",  productRoutes);
app.use("/api/cart",      cartRoutes);
app.use("/api/orders",    orderRoutes);
app.use("/api/coupons",   couponRoutes);
app.use("/api/ratings",   ratingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (_req, res) => res.json({ message: "QuickCart API v2 running", roles: ["customer", "store", "delivery"] }));

// ─── Socket.io ────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join_store", (storeId) => {
    socket.join(`store_${storeId}`);
    console.log(`Socket joined store room: ${storeId}`);
  });

  socket.on("join_order", (orderId) => {
    socket.join(`order_${orderId}`);
  });

  socket.on("join_delivery", (agentId) => {
    socket.join(`delivery_${agentId}`);
  });

  socket.on("update_location", ({ orderId, lat, lng }) => {
    io.to(`order_${orderId}`).emit("location_update", { lat, lng });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 QuickCart API on port ${PORT}`));