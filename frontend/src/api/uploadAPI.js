/**
 * uploadAPI.js
 *
 * All image-upload related API calls for the frontend.
 * Uses FormData (multipart/form-data) — axios handles the header automatically.
 *
 * Usage:
 *   import { uploadAPI } from "../api/uploadAPI";
 *   const { url, publicId } = await uploadAPI.productImage(file, productId);
 */
import api from "./api.js";

export const uploadAPI = {
  /**
   * Upload a product image.
   * @param {File}   file        - the File object from an <input type="file">
   * @param {string} [productId] - if provided, updates product.image in DB automatically
   * @param {function} [onProgress] - (percent: number) => void
   * @returns {Promise<{url: string, publicId: string}>}
   */
  productImage: (file, productId, onProgress) => {
    const form = new FormData();
    form.append("image", file);
    if (productId) form.append("productId", productId);
    return api
      .post("/upload/product", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((r) => r.data);
  },

  /**
   * Upload the current user's store logo.
   * Automatically updates Store.image in DB.
   * @param {File}     file
   * @param {function} [onProgress]
   * @returns {Promise<{url: string, publicId: string}>}
   */
  storeLogo: (file, onProgress) => {
    const form = new FormData();
    form.append("image", file);
    return api
      .post("/upload/store", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((r) => r.data);
  },

  /**
   * Upload a user avatar.
   * @param {File}     file
   * @param {function} [onProgress]
   * @returns {Promise<{url: string, publicId: string}>}
   */
  avatar: (file, onProgress) => {
    const form = new FormData();
    form.append("image", file);
    return api
      .post("/upload/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      })
      .then((r) => r.data);
  },

  /**
   * Delete a Cloudinary asset.
   * @param {string} publicId
   * @param {"product"|"store"|"avatar"} type
   */
  delete: (publicId, type) =>
    api.delete("/upload", { data: { publicId, type } }).then((r) => r.data),
};

/**
 * Validates an image File before upload.
 * Returns { valid: true } or { valid: false, message: string }
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, message: "No file selected" };

  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, message: "Only JPEG, PNG, and WebP images are allowed" };
  }

  const MAX_SIZE_MB = 5;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_SIZE_MB} MB.`,
    };
  }

  return { valid: true };
}