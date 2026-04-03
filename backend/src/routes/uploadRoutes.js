/**
 * uploadRoutes.js
 *
 * Mount in server.js:
 *   import uploadRoutes from "./src/routes/uploadRoutes.js";
 *   app.use("/api/upload", uploadRoutes);
 */
import express from "express";
import {
  uploadProductImage,
  uploadStoreLogo,
  uploadAvatar,
  deleteUpload,
} from "../controllers/uploadController.js";
import { protect, storeOnly } from "../middleware/authMiddleware.js";
import { uploadSingle }       from "../middleware/upload.js";

const r = express.Router();

// ── Product image upload (store owners only) ─────────────────
r.post(
  "/product",
  protect,
  storeOnly,
  uploadSingle("image"),
  uploadProductImage
);

// ── Store logo upload (store owners only) ────────────────────
r.post(
  "/store",
  protect,
  storeOnly,
  uploadSingle("image"),
  uploadStoreLogo
);

// ── User avatar upload (any authenticated user) ──────────────
r.post(
  "/avatar",
  protect,
  uploadSingle("image"),
  uploadAvatar
);

// ── Delete Cloudinary asset ──────────────────────────────────
r.delete(
  "/",
  protect,
  deleteUpload
);

export default r;