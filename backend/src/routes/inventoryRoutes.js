import express from "express";
import {
  getInventory,
  updateStock,
  bulkUpdateStock,
  toggleAvailability,
  getLowStockAlerts,
} from "../controllers/inventoryController.js";
import { protect, storeOnly } from "../middleware/authMiddleware.js";

const r = express.Router();
r.use(protect, storeOnly);

r.get("/",               getInventory);
r.get("/alerts",         getLowStockAlerts);
r.patch("/:id/stock",    updateStock);
r.patch("/:id/toggle",   toggleAvailability);
r.post("/bulk",          bulkUpdateStock);

export default r;