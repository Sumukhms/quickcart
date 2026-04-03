/**
 * uploadController.js
 *
 * Handles Cloudinary image uploads for:
 *   POST /api/upload/product  — product image (store owner only)
 *   POST /api/upload/store    — store logo   (store owner only)
 *   POST /api/upload/avatar   — user avatar  (any authenticated user)
 *   DELETE /api/upload        — delete an asset by public_id
 *
 * Flow:
 *   1. multer memoryStorage puts file bytes in req.file.buffer
 *   2. We stream the buffer to Cloudinary via upload_stream
 *   3. Cloudinary returns { secure_url, public_id }
 *   4. We optionally update the DB record (product or store)
 *      so callers can also just use the URL from the response
 *      and save it themselves.
 */
import Product from "../models/Product.js";
import Store   from "../models/Store.js";
import User    from "../models/User.js";
import {
  uploadToCloudinary,
  destroyCloudinaryAsset,
  CLOUDINARY_FOLDERS,
} from "../config/cloudinary.js";

// ── POST /api/upload/product ─────────────────────────────────
// Body (multipart): image (file), productId (string, optional)
// If productId is provided, updates Product.image in DB.
export const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const { productId } = req.body;

    // If updating an existing product, verify ownership & get old publicId
    let oldPublicId = null;
    if (productId) {
      const product = await Product.findById(productId).populate("storeId", "ownerId");
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (product.storeId?.ownerId?.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Not authorised — this is not your product" });
      }
      // Extract publicId from existing Cloudinary URL so we can delete it
      if (product.image && product.image.includes("cloudinary.com")) {
        oldPublicId = extractPublicId(product.image);
      }
    }

    // Upload new image
    const result = await uploadToCloudinary(
      req.file.buffer,
      CLOUDINARY_FOLDERS.products,
      { public_id: `product_${productId || Date.now()}` }
    );

    // Update DB if productId provided
    if (productId) {
      await Product.findByIdAndUpdate(productId, { image: result.secure_url });
    }

    // Delete old image (non-blocking)
    if (oldPublicId) {
      destroyCloudinaryAsset(oldPublicId).catch(console.error);
    }

    res.json({
      url:       result.secure_url,
      publicId:  result.public_id,
      width:     result.width,
      height:    result.height,
      format:    result.format,
    });
  } catch (e) {
    console.error("[Upload] productImage error:", e.message);
    res.status(500).json({ message: "Image upload failed. Please try again." });
  }
};

// ── POST /api/upload/store ───────────────────────────────────
// Body (multipart): image (file), storeId (string, optional)
export const uploadStoreLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Find store owned by this user
    const store = await Store.findOne({ ownerId: req.user.userId });
    if (!store) {
      return res.status(404).json({ message: "No store found for this account" });
    }

    // Extract old publicId for cleanup
    let oldPublicId = null;
    if (store.image && store.image.includes("cloudinary.com")) {
      oldPublicId = extractPublicId(store.image);
    }

    // Upload new logo
    const result = await uploadToCloudinary(
      req.file.buffer,
      CLOUDINARY_FOLDERS.storeLogos,
      {
        public_id:      `store_${store._id}`,
        // Square crop for logos
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "auto" }],
      }
    );

    // Update store logo in DB
    await Store.findByIdAndUpdate(store._id, { image: result.secure_url });

    // Delete old logo (non-blocking)
    if (oldPublicId) {
      destroyCloudinaryAsset(oldPublicId).catch(console.error);
    }

    res.json({
      url:      result.secure_url,
      publicId: result.public_id,
    });
  } catch (e) {
    console.error("[Upload] storeLogo error:", e.message);
    res.status(500).json({ message: "Image upload failed. Please try again." });
  }
};

// ── POST /api/upload/avatar ──────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let oldPublicId = null;
    if (user.avatar && user.avatar.includes("cloudinary.com")) {
      oldPublicId = extractPublicId(user.avatar);
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      CLOUDINARY_FOLDERS.avatars,
      {
        public_id:      `avatar_${user._id}`,
        transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }],
      }
    );

    await User.findByIdAndUpdate(user._id, { avatar: result.secure_url });

    if (oldPublicId) {
      destroyCloudinaryAsset(oldPublicId).catch(console.error);
    }

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) {
    console.error("[Upload] avatar error:", e.message);
    res.status(500).json({ message: "Avatar upload failed. Please try again." });
  }
};

// ── DELETE /api/upload ───────────────────────────────────────
// Body: { publicId, type: "product"|"store" }
// Only deletes if the caller owns the asset.
export const deleteUpload = async (req, res) => {
  try {
    const { publicId, type } = req.body;
    if (!publicId) return res.status(400).json({ message: "publicId is required" });

    // Ownership check: make sure the caller's resource contains this url
    if (type === "product") {
      const product = await Product.findOne({ image: { $regex: publicId } }).populate("storeId", "ownerId");
      if (product && product.storeId?.ownerId?.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Not authorised" });
      }
    } else if (type === "store") {
      const store = await Store.findOne({ ownerId: req.user.userId, image: { $regex: publicId } });
      if (!store) return res.status(403).json({ message: "Not authorised" });
    }

    await destroyCloudinaryAsset(publicId);
    res.json({ message: "Asset deleted from Cloudinary" });
  } catch (e) {
    console.error("[Upload] delete error:", e.message);
    res.status(500).json({ message: "Failed to delete asset" });
  }
};

// ── Helper ───────────────────────────────────────────────────
/**
 * Extracts the Cloudinary public_id from a secure_url.
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1/quickcart/products/product_123.jpg"
 *       → "quickcart/products/product_123"
 */
function extractPublicId(url) {
  try {
    // Strip query params
    const cleanUrl = url.split("?")[0];
    // Grab everything after /upload/[optional_version]/
    const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}