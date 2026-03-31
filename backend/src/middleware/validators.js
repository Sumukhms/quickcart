/**
 * validators.js
 *
 * express-validator chains for auth routes.
 * Each export is an array — spread it into the route definition:
 *   router.post("/register", ...registerValidation, authController.register)
 *
 * handleValidation() must come last in the chain to collect errors.
 */
import { body, validationResult } from "express-validator";

// ── Collect & return errors ───────────────────────────────────
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,    // surface first error
      errors:  errors.array(),
    });
  }
  next();
};

// ── Password strength rule (reused across chains) ─────────────
const passwordRule = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/\d/)
  .withMessage("Password must contain at least one number");

// ── Registration ──────────────────────────────────────────────
export const registerValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 60 }).withMessage("Name must be 2–60 characters")
    .escape(),                          // strip HTML

  body("email")
    .trim()
    .normalizeEmail()                  // lowercase, strip dots, etc.
    .isEmail().withMessage("Please enter a valid email address"),

  passwordRule,

  body("role")
    .optional()
    .isIn(["customer", "store", "delivery"])
    .withMessage("Invalid role"),

  handleValidation,
];

// ── Login ─────────────────────────────────────────────────────
export const loginValidation = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Please enter a valid email address"),

  body("password")
    .notEmpty().withMessage("Password is required"),

  handleValidation,
];

// ── OTP verify ────────────────────────────────────────────────
export const otpValidation = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Valid email is required"),

  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .isNumeric()
    .withMessage("OTP must be numeric"),

  handleValidation,
];

// ── Reset password ────────────────────────────────────────────
export const resetPasswordValidation = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Valid email is required"),

  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits")
    .isNumeric().withMessage("OTP must be numeric"),

  passwordRule,

  handleValidation,
];