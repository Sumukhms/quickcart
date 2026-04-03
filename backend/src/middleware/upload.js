/**
 * upload.js  (middleware)
 *
 * Configures multer with in-memory storage so the file buffer is
 * available for streaming directly to Cloudinary (no local disk write).
 *
 * Exports:
 *   uploadSingle(fieldName)  — single-file multer middleware
 *   uploadMultiple(fieldName, maxCount) — multi-file multer middleware
 *
 * Limits:
 *   - 5 MB max file size
 *   - JPEG, PNG, WebP only
 */
import multer from "multer";

// ── Storage: keep files in memory (buffer) ────────────────────
const storage = multer.memoryStorage();

// ── File type filter ──────────────────────────────────────────
function imageFilter(_req, file, cb) {
  const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (ALLOWED_MIME.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(
    Object.assign(new Error("Only JPEG, PNG and WebP images are allowed"), {
      code: "INVALID_FILE_TYPE",
    }),
    false
  );
}

// ── Base multer instance ──────────────────────────────────────
const multerBase = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/**
 * Middleware for a single image field.
 * Adds Express-friendly error handling.
 *
 * @param {string} fieldName - form field name (e.g. "image")
 */
export function uploadSingle(fieldName) {
  return (req, res, next) => {
    multerBase.single(fieldName)(req, res, (err) => {
      if (!err) return next();

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File is too large. Maximum size is 5 MB." });
      }
      if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || "File upload error" });
    });
  };
}

/**
 * Middleware for multiple images from one field.
 *
 * @param {string} fieldName
 * @param {number} maxCount  - default 5
 */
export function uploadMultiple(fieldName, maxCount = 5) {
  return (req, res, next) => {
    multerBase.array(fieldName, maxCount)(req, res, (err) => {
      if (!err) return next();

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "One or more files exceed the 5 MB limit." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ message: `Too many files. Maximum allowed: ${maxCount}` });
      }
      if (err.code === "INVALID_FILE_TYPE") {
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || "File upload error" });
    });
  };
}