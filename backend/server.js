import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import "dotenv/config";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/socket/socketHandler.js";
import authRoutes from "./src/routes/authRoutes.js";
import storeRoutes from "./src/routes/storeRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

connectDB();
initSocket(io);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Attach io to req so controllers can emit
app.use((req, _res, next) => { req.io = io; next(); });

app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (_req, res) => res.json({ message: "QuickCart API running" }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 QuickCart API on port ${PORT}`));