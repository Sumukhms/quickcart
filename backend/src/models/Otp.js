/**
 * Otp.js
 *
 * Stores hashed OTPs for:
 *   - email verification  (purpose: "verify_email")
 *   - password reset      (purpose: "reset_password")
 *
 * TTL index auto-deletes expired documents via MongoDB.
 * We store a HASH of the OTP (never plaintext) so a DB
 * breach cannot expose valid codes.
 */
import mongoose from "mongoose";
import crypto   from "crypto";

const otpSchema = new mongoose.Schema({
  email: {
    type:     String,
    required: true,
    lowercase: true,
    trim:     true,
    index:    true,
  },
  otpHash: {
    type:     String,
    required: true,
  },
  purpose: {
    type:     String,
    enum:     ["verify_email", "reset_password"],
    required: true,
  },
  attempts: {
    type:    Number,
    default: 0,
  },
  expiresAt: {
    type:     Date,
    required: true,
  },
}, { timestamps: true });

// ── TTL index: MongoDB auto-removes doc after expiresAt ──────
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── Unique: one active OTP per email+purpose ─────────────────
otpSchema.index({ email: 1, purpose: 1 }, { unique: true });

// ── Static: create/replace OTP for an email + purpose ────────
otpSchema.statics.createOtp = async function (email, purpose) {
  // Generate 6-digit numeric OTP
  const otp     = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert: replace any existing OTP for this email+purpose
  await this.findOneAndUpdate(
    { email, purpose },
    { otpHash, expiresAt, attempts: 0 },
    { upsert: true, new: true }
  );

  return otp; // Return PLAINTEXT only once — to send in email
};

// ── Static: verify OTP (rate-limited to 5 attempts) ──────────
otpSchema.statics.verifyOtp = async function (email, otp, purpose) {
  const record = await this.findOne({ email, purpose });

  if (!record) {
    return { valid: false, reason: "OTP not found or already used" };
  }
  if (new Date() > record.expiresAt) {
    await record.deleteOne();
    return { valid: false, reason: "OTP has expired" };
  }
  if (record.attempts >= 5) {
    await record.deleteOne();
    return { valid: false, reason: "Too many attempts. Request a new OTP." };
  }

  const hash = crypto.createHash("sha256").update(String(otp)).digest("hex");
  if (hash !== record.otpHash) {
    await this.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    const remaining = 4 - record.attempts;
    return { valid: false, reason: `Invalid OTP. ${remaining} attempt(s) left.` };
  }

  // Valid — delete so it cannot be reused
  await record.deleteOne();
  return { valid: true };
};

export default mongoose.model("Otp", otpSchema);