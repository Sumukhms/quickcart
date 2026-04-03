/**
 * RefreshToken.js
 *
 * Stores hashed refresh tokens tied to a user.
 * One user can have multiple active sessions (up to MAX_SESSIONS).
 * Each document is auto-deleted 7 days after creation via TTL index.
 *
 * We store a SHA-256 hash (not the raw token) so a DB breach
 * cannot be used to forge new access tokens.
 */
import mongoose from "mongoose";
import crypto   from "crypto";

const MAX_SESSIONS = 5;

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    tokenHash: {
      type:     String,
      required: true,
    },
    // The raw token is never stored — only the hash.
    // We keep the family field to detect refresh-token reuse attacks:
    // if a stolen token is used after rotation, the whole family is revoked.
    family: {
      type:     String,
      required: true,
      index:    true,
    },
    userAgent: { type: String, default: "" },
    ip:        { type: String, default: "" },
    expiresAt: {
      type:     Date,
      required: true,
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB removes expired documents automatically
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ── Static helpers ────────────────────────────────────────────

/** Hash a raw token before storing / comparing */
refreshTokenSchema.statics.hash = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Generate a cryptographically random raw token */
refreshTokenSchema.statics.generate = () =>
  crypto.randomBytes(64).toString("hex");

/**
 * Store a new refresh token.
 * Enforces MAX_SESSIONS by evicting the oldest if exceeded.
 */
refreshTokenSchema.statics.store = async function (
  userId,
  rawToken,
  family,
  { userAgent = "", ip = "", expiresInDays = 7 } = {}
) {
  const tokenHash = this.hash(rawToken);
  const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000);

  // Enforce session cap — delete oldest sessions beyond the limit
  const sessions = await this.find({ userId }).sort({ createdAt: 1 });
  if (sessions.length >= MAX_SESSIONS) {
    const toDelete = sessions.slice(0, sessions.length - MAX_SESSIONS + 1);
    await this.deleteMany({ _id: { $in: toDelete.map((s) => s._id) } });
  }

  return this.create({ userId, tokenHash, family, userAgent, ip, expiresAt });
};

/**
 * Find and validate a raw token.
 * Returns the document if valid, null otherwise.
 */
refreshTokenSchema.statics.findValid = async function (rawToken) {
  const tokenHash = this.hash(rawToken);
  const doc = await this.findOne({ tokenHash });
  if (!doc) return null;
  if (doc.expiresAt < new Date()) {
    await doc.deleteOne();
    return null;
  }
  return doc;
};

/**
 * Detect reuse: another token in the same family was already used.
 * This means the original token was stolen — revoke the whole family.
 */
refreshTokenSchema.statics.revokeFamily = async function (family) {
  return this.deleteMany({ family });
};

export default mongoose.model("RefreshToken", refreshTokenSchema);