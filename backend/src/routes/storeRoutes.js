import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createStore , getStores , getStoreById} from "../controllers/storeController.js";

const router = express.Router();

router.post("/", protect, createStore);
router.get("/", getStores);
router.get("/:id", getStoreById);

export default router;