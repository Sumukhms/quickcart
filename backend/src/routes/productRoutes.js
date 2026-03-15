import express from 'express';
import { createProduct , getProductsByStore } from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/',protect, createProduct);
router.get("/stores/:storeId",getProductsByStore);

export default router;