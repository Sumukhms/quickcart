/**
 * cloudinary.js
 *
 * Initialises the Cloudinary SDK and exports a configured instance.
 * Also exports upload + destroy helpers used by the upload controller.
 *
 * Required .env keys:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Usage:
 *   import { cloudinary, uploadToCloudinary, destroyCloudinaryAsset } from "./cloudinary.js";
 */
import { v2 as cloudinary } from "cloudinary";

// ── Validate at startup ───────────────────────────────────────
const REQUIRED = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing  = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.warn(
    `⚠️  Cloudinary: missing env vars: ${missing.join(", ")}\n` +
    "   Image uploads will fail until these are set.\n" +
    "   Get them from: https://cloudinary.com/console"
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ── Folder constants ───────────────────────────────────────────
export const CLOUDINARY_FOLDERS = {
  products:    "quickcart/products",
  storeLogos:  "quickcart/stores",
  avatars:     "quickcart/avatars",
};

// ── Upload helper ─────────────────────────────────────────────
/**
 * Uploads a file buffer to Cloudinary.
 *
 * @param {Buffer}  buffer         - raw file bytes from multer memoryStorage
 * @param {string}  folder         - one of CLOUDINARY_FOLDERS values
 * @param {object}  [options={}]   - extra cloudinary upload_stream options
 * @returns {Promise<object>}      - Cloudinary upload result (includes secure_url, public_id)
 */
export function uploadToCloudinary(buffer, folder, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: "image",
      // Auto format + quality for best delivery (WebP on modern browsers)
      fetch_format:  "auto",
      quality:       "auto",
      // Reasonable size limit: 2 MB equivalent
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
      ],
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ── Delete helper ─────────────────────────────────────────────
/**
 * Removes an asset from Cloudinary by its public_id.
 * Used when updating/deleting products or store logos.
 *
 * @param {string} publicId - cloudinary public_id (without extension)
 * @returns {Promise<object>}
 */
export async function destroyCloudinaryAsset(publicId) {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Non-fatal: log but don't crash the request
    console.error("[Cloudinary] destroy error:", err.message);
    return null;
  }
}

export { cloudinary };
export default cloudinary;