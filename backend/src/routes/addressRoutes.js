/**
 * addressRoutes.js
 *
 * Mount in server.js:
 *   import addressRoutes from "./src/routes/addressRoutes.js";
 *   app.use("/api/addresses", addressRoutes);
 */
import express from "express";
import {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  addressFromCoords,
} from "../controllers/addressController.js";
import { protect } from "../middleware/authMiddleware.js";

const r = express.Router();

// All address routes require authentication
r.use(protect);

r.get("/",                listAddresses);
r.post("/",               addAddress);
r.post("/from-coords",    addressFromCoords);
r.put("/:id",             updateAddress);
r.delete("/:id",          deleteAddress);
r.patch("/:id/default",   setDefaultAddress);

export default r;